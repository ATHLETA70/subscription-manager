"use server";

import { createClient } from "@/lib/supabase/server";
import { getGeminiClient, GEMINI_MODEL_NAME } from "@/lib/gemini";
// import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
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

export interface CancellationInfo {
    cancellation_url: string;
    steps: { id: number; label: string; description: string }[];
    required_info: { label: string; value: string }[];
    is_cancellable?: boolean;
    verified?: boolean;
    debugLogs?: string[];
}

function normalizeServiceName(name: string): string {
    return name
        .toLowerCase()
        .replace(/\s+(premium|plus|basic|standard|pro)\s*$/i, "")
        .trim();
}

function generatePrompt(serviceName: string, searchResults: string): string {
    return `
あなたは日本のサブスクリプションサービスの解約情報を専門に調査するAIアシスタントです。

サービス名: ${serviceName}

以下のGoogle検索結果を参考にして、このサービスの解約情報をJSON形式で提供してください。

## 検索結果
${searchResults}

タスク: 
1. 検索結果の中から、**最も信頼できる公式の解約ページ**のURLを選んでください。
2. そのページの内容を推測し、解約手順をステップバイステップで記述してください。

優先順位（上から優先）:
1. 公式ヘルプセンター・サポートセンターの解約方法ページ
2. 公式FAQの解約セクション
3. 公式サイトのアカウント設定ページ

重要な注意事項:
- **必ず検索結果に含まれるURL、またはそこから確実に推測できる公式URLを使用してください**
- 第三者のブログやまとめサイトのURLは避けてください（ただし、公式へのリンクが見つからない場合は、公式トップページを設定）
- 見つからない場合は、cancellation_urlを空文字列にすること

JSON構造:
{
  "is_cancellable": boolean,
  "cancellation_url": "公式の解約方法が記載されたURL",
  "steps": [
    { "id": 1, "label": "ステップのタイトル", "description": "詳細な手順" }
  ],
  "required_info": [
    { "label": "情報ラベル", "value": "プレースホルダー" }
  ]
}

特別ケース:
- 家賃、光熱費、物理契約など、オンライン解約不可の場合: is_cancellable = false
- アプリ内でのみ解約可能（iOS/Android）の場合: is_cancellable = true, URLは各ストアの管理ページまたは空
- 電話・メールのみの場合: is_cancellable = true, URLは問い合わせページ

応答は必ず日本語で、JSONのみを返してください（マークダウン不要）。
`;
}

async function validateUrl(url: string): Promise<boolean> {
    if (!url) return false;
    try {
        new URL(url);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SubscriptionManager/1.0;)' }
        });
        clearTimeout(timeoutId);

        if (response.ok) return true;

        if (response.status === 405 || response.status === 403 || response.status === 404) {
            const controller2 = new AbortController();
            const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
            const response2 = await fetch(url, {
                method: 'GET',
                signal: controller2.signal,
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SubscriptionManager/1.0;)' }
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

// Updated to accept subscriptionId for direct update
export async function getCancellationInfo(serviceName: string, subscriptionId?: string): Promise<CancellationInfo | null> {
    const supabase = await createClient();
    const genAI = getGeminiClient();
    if (!genAI) return null;

    try {
        // 1. Perform Google Search using Puppeteer
        console.log(`[Cancellation] Searching Google for: ${serviceName}`);
        const searchResults = await performGoogleSearch(`${serviceName} 解約方法 公式`);

        const searchContext = searchResults.map(r => `- [${r.title}](${r.url})\n  ${r.snippet}`).join("\n");
        console.log(`[Cancellation] Search context generated (${searchResults.length} results)`);

        // 2. Use Gemini to analyze results
        const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL_NAME,
        });

        const prompt = generatePrompt(serviceName, searchContext);
        console.log(`[Gemini] Requesting info for: ${serviceName} (SubID: ${subscriptionId})`);

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
        if (data.is_cancellable && data.cancellation_url) {
            const isValid = await validateUrl(data.cancellation_url);
            if (!isValid) {
                console.warn(`[Gemini] URL validation failed for: ${data.cancellation_url}. Keeping it anyway.`);
            }
        }

        const cancellationInfo: CancellationInfo = {
            cancellation_url: data.cancellation_url || "",
            steps: data.steps || [],
            required_info: data.required_info || [],
            is_cancellable: data.is_cancellable ?? true,
            verified: false,
            debugLogs: ["Fetched fresh from Gemini with Puppeteer Search"]
        };

        // If subscriptionId is provided, save directly to subscriptions table
        if (subscriptionId) {
            await supabase
                .from("subscriptions")
                .update({ cancellation_info: cancellationInfo })
                .eq("id", subscriptionId);
            console.log(`[Gemini] Saved info to subscription ${subscriptionId}`);
        }

        return cancellationInfo;

    } catch (error) {
        console.error("[Gemini] API Error:", error);
        return null;
    }
}

// Refresh function now just calls getCancellationInfo with subscriptionId
export async function refreshCancellationInfo(serviceName: string, subscriptionId?: string): Promise<CancellationInfo | null> {
    console.log(`[Refresh] Forcing refresh for ${serviceName} (SubID: ${subscriptionId})`);
    return getCancellationInfo(serviceName, subscriptionId);
}

// Update specific subscription's cancellation URL
export async function updateCancellationUrl(
    subscriptionId: string,
    newUrl: string
): Promise<boolean> {
    const supabase = await createClient();
    try {
        // First get current info to preserve steps
        const { data: current } = await supabase
            .from("subscriptions")
            .select("cancellation_info")
            .eq("id", subscriptionId)
            .single();

        const currentInfo = current?.cancellation_info || {};
        const newInfo = {
            ...currentInfo,
            cancellation_url: newUrl,
            verified: true
        };

        const { error } = await supabase
            .from("subscriptions")
            .update({ cancellation_info: newInfo })
            .eq("id", subscriptionId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error("[Update URL] Error:", error);
        return false;
    }
}
