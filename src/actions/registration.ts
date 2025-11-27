"use server";

import { createClient } from "@/lib/supabase/server";
import { getGeminiClient, GEMINI_MODEL_NAME } from "@/lib/gemini";
const HarmCategory = {
    HARM_CATEGORY_HARASSMENT: "HARM_CATEGORY_HARASSMENT",
    HARM_CATEGORY_HATE_SPEECH: "HARM_CATEGORY_HATE_SPEECH",
    HARM_CATEGORY_SEXUALLY_EXPLICIT: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    HARM_CATEGORY_DANGEROUS_CONTENT: "HARM_CATEGORY_DANGEROUS_CONTENT",
};
const HarmBlockThreshold = {
    BLOCK_NONE: "BLOCK_NONE",
};
import { performGoogleSearch } from "@/lib/search";

export interface RegistrationInfo {
    registration_url: string;
    has_free_trial?: boolean;
    trial_period?: string;
    notes?: string;
    verified?: boolean;
}

function normalizeServiceName(name: string): string {
    return name
        .toLowerCase()
        .replace(/\s+(premium|plus|basic|standard|pro)\s*$/i, "")
        .trim();
}

function generateRegistrationPrompt(serviceName: string, searchResults: string): string {
    return `
あなたは日本のサブスクリプションサービスの登録情報を専門に調査するAIアシスタントです。

サービス名: ${serviceName}

以下のGoogle検索結果を参考にして、このサービスの有料契約・登録情報をJSON形式で提供してください。

## 検索結果
${searchResults}

タスク: 
1. 検索結果の中から、**最も信頼できる公式の登録・有料契約ページ**のURLを選んでください。
2. 無料トライアルの情報があれば含めてください。

優先順位（上から優先）:
1. 公式サイトの新規登録/サインアップページ（/signup, /register, /join など）
2. 公式サイトのプラン選択・契約ページ
3. 公式サイトのトップページ

重要な注意事項:
- **必ず検索結果に含まれるURL、またはそこから確実に推測できる公式URLを使用してください**
- 第三者のブログやまとめサイトのURLは避けてください
- 見つからない場合は、registration_urlを空文字列にすること
- ログインページ(/login)ではなく、新規登録ページを返してください

JSON構造:
{
  "registration_url": "公式の登録・有料契約ページのURL",
  "has_free_trial": boolean,
  "trial_period": "例: 7日間（分かる場合のみ）",
  "notes": "登録時の注意点や特典情報があれば"
}

応答は必ず日本語で、JSONのみを返してください（マークダウン不要）。
`;
}

async function validateUrl(url: string): Promise<boolean> {
    if (!url) return false;
    try {
        // Basic syntax check
        new URL(url);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SubscriptionManager/1.0;)'
            }
        });
        clearTimeout(timeoutId);

        if (response.ok) return true;

        // Retry with GET if HEAD fails
        if (response.status === 405 || response.status === 403 || response.status === 404) {
            const controller2 = new AbortController();
            const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
            const response2 = await fetch(url, {
                method: 'GET',
                signal: controller2.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; SubscriptionManager/1.0;)'
                }
            });
            clearTimeout(timeoutId2);
            return response2.ok;
        }

        return false;
    } catch (error) {
        console.warn(`[URL Validation Failed] ${url}:`, error);
        return false;
    }
}

export async function getRegistrationInfo(serviceName: string, subscriptionId?: string): Promise<RegistrationInfo | null> {
    const supabase = await createClient();
    const genAI = getGeminiClient();
    if (!genAI) return null;

    try {
        // 1. Perform Google Search using Puppeteer
        console.log(`[Registration] Searching Google for: ${serviceName}`);
        const searchResults = await performGoogleSearch(`${serviceName} 有料契約 登録 公式`);

        const searchContext = searchResults.map(r => `- [${r.title}](${r.url})\n  ${r.snippet}`).join("\n");
        console.log(`[Registration] Search context generated (${searchResults.length} results)`);

        // 2. Use Gemini to analyze results
        const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL_NAME,
        });

        const prompt = generateRegistrationPrompt(serviceName, searchContext);
        console.log(`[Gemini] Requesting registration info for: ${serviceName} (SubID: ${subscriptionId})`);

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 2048,
                responseMimeType: "application/json",
            },
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT as any,
                    threshold: HarmBlockThreshold.BLOCK_NONE as any,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH as any,
                    threshold: HarmBlockThreshold.BLOCK_NONE as any,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT as any,
                    threshold: HarmBlockThreshold.BLOCK_NONE as any,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT as any,
                    threshold: HarmBlockThreshold.BLOCK_NONE as any,
                },
            ],
        });

        const response = result.response;
        const text = response.text();
        console.log(`[Gemini] Raw response: ${text?.substring(0, 200)}...`);

        if (!text) return null;

        const jsonStr = text.replace(/^```json\n|\n```$/g, "").trim();
        let data;
        try {
            data = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error("[Gemini] JSON Parse Error:", parseError);
            return null;
        }

        // URL Validation (Relaxed)
        if (data.registration_url) {
            const isValid = await validateUrl(data.registration_url);
            if (!isValid) {
                console.warn(`[Gemini] URL validation failed for: ${data.registration_url}. Keeping it anyway.`);
            }
        }

        const registrationInfo: RegistrationInfo = {
            registration_url: data.registration_url || "",
            has_free_trial: data.has_free_trial ?? false,
            trial_period: data.trial_period || null,
            notes: data.notes || null,
            verified: false,
        };

        // If subscriptionId is provided, save directly to subscriptions table
        if (subscriptionId) {
            await supabase
                .from("subscriptions")
                .update({ registration_info: registrationInfo })
                .eq("id", subscriptionId);
            console.log(`[Gemini] Saved registration info to subscription ${subscriptionId}`);
        }

        return registrationInfo;

    } catch (error) {
        console.error("[Gemini Registration] API Error:", error);
        return null;
    }
}

// Refresh function now just calls getRegistrationInfo with subscriptionId
export async function refreshRegistrationInfo(serviceName: string, subscriptionId?: string): Promise<RegistrationInfo | null> {
    console.log(`[Refresh] Forcing refresh for ${serviceName} (SubID: ${subscriptionId})`);
    return getRegistrationInfo(serviceName, subscriptionId);
}

// Update specific subscription's registration URL
export async function updateRegistrationUrl(
    subscriptionId: string,
    newUrl: string
): Promise<boolean> {
    const supabase = await createClient();
    try {
        // First get current info to preserve other fields
        const { data: current } = await supabase
            .from("subscriptions")
            .select("registration_info")
            .eq("id", subscriptionId)
            .single();

        const currentInfo = current?.registration_info || {};
        const newInfo = {
            ...currentInfo,
            registration_url: newUrl,
            verified: true
        };

        const { error } = await supabase
            .from("subscriptions")
            .update({ registration_info: newInfo })
            .eq("id", subscriptionId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error("[Update URL] Error:", error);
        return false;
    }
}


