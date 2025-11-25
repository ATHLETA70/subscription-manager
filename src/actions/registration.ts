"use server";

import { createClient } from "@/lib/supabase/server";
import { getGeminiClient, GEMINI_MODEL_NAME } from "@/lib/gemini";

export interface RegistrationInfo {
    registration_url: string;
    has_free_trial?: boolean;
    trial_period?: string;
    notes?: string;
    user_verified?: boolean;
}

function normalizeServiceName(name: string): string {
    return name
        .toLowerCase()
        .replace(/\s+(premium|plus|basic|standard|pro)\s*$/i, "")
        .trim();
}

function generateRegistrationPrompt(serviceName: string): string {
    return `
      Service Name: ${serviceName}

      タスク: このサービスの新規登録ページの情報をJSON形式で提供してください。
      
      重要: 
      1. **公式サイトの新規登録/サインアップページのURLを返してください**
         (例: /signup, /register, /join, /start などのパス)
      2. 無料トライアルがある場合、そのページURLを優先してください
      3. プラン選択ページから登録できる場合、そのURLでも可
      4. **推測や古いURLは絶対に返さないでください**
      5. ログインページ(/login)ではなく、新規登録ページを返してください
      6. 確実にアクセス可能な公開URLが見つからない場合は、registration_urlを空文字列にしてください
      
      検索クエリ例: "${serviceName} 新規登録", "${serviceName} sign up official", "${serviceName} 無料トライアル"
      
      JSON構造:
      {
        "registration_url": "公式の新規登録ページのURL",
        "has_free_trial": boolean,
        "trial_period": "例: 30日間（分かる場合のみ）",
        "notes": "登録時の注意点や特典情報があれば"
      }

      ルール:
      1. 応答は日本語で。
      2. マークダウン形式を使用せず、JSONのみを返してください。
      3. URLが確実に存在する場合のみ返してください。
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

export async function getRegistrationInfo(serviceName: string): Promise<RegistrationInfo | null> {
    const supabase = await createClient();
    const normalizedName = normalizeServiceName(serviceName);

    // 1. Check Database
    const { data: existingData } = await supabase
        .from("service_registration_info")
        .select("*")
        .eq("service_name", normalizedName)
        .single();

    if (existingData) {
        return {
            registration_url: existingData.registration_url,
            has_free_trial: existingData.has_free_trial ?? false,
            trial_period: existingData.trial_period,
            notes: existingData.notes,
            user_verified: existingData.user_verified ?? false,
        };
    }

    // 2. If not found, ask Gemini
    const genAI = getGeminiClient();
    if (!genAI) return null;

    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });
        const prompt = generateRegistrationPrompt(serviceName);

        console.log(`[Gemini Registration] Requesting info for: ${serviceName}`);
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        console.log(`[Gemini Registration] Raw response:`, text);

        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/^```json\n|\n```$/g, "").trim();

        let data;
        try {
            data = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error("[Gemini Registration] JSON Parse Error:", parseError);
            console.error("[Gemini Registration] Failed JSON string:", jsonStr);
            return null;
        }

        // Validate structure
        if (!data.registration_url) {
            console.error("[Gemini Registration] Invalid response - no registration_url:", data);
            return null;
        }

        // URL Validation: Check if the URL is actually accessible
        if (data.registration_url) {
            const isValid = await validateUrl(data.registration_url);
            if (!isValid) {
                console.warn(`[Gemini Registration] URL validation failed for: ${data.registration_url}. Clearing URL.`);
                data.registration_url = "";
            }
        }

        // 3. Save to Database
        await supabase.from("service_registration_info").upsert({
            service_name: normalizedName,
            registration_url: data.registration_url || "",
            has_free_trial: data.has_free_trial ?? false,
            trial_period: data.trial_period || null,
            notes: data.notes || null,
            verified: false,
            user_verified: false,
        }, { onConflict: 'service_name', ignoreDuplicates: true });

        return {
            registration_url: data.registration_url || "",
            has_free_trial: data.has_free_trial,
            trial_period: data.trial_period,
            notes: data.notes,
            user_verified: false,
        };

    } catch (error) {
        console.error("[Gemini Registration] API Error:", error);
        return null;
    }
}

export async function refreshRegistrationInfo(serviceName: string): Promise<RegistrationInfo | null> {
    const supabase = await createClient();
    const normalizedName = normalizeServiceName(serviceName);
    const genAI = getGeminiClient();
    if (!genAI) return null;

    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });
        const prompt = generateRegistrationPrompt(serviceName);

        console.log(`[Gemini Registration Refresh] Requesting info for: ${serviceName}`);
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        console.log(`[Gemini Registration Refresh] Raw response:`, text);

        const jsonStr = text.replace(/^```json\n|\n```$/g, "").trim();
        let data;
        try {
            data = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error("[Gemini Registration Refresh] JSON Parse Error:", parseError);
            return null;
        }

        if (!data.registration_url) {
            console.error("[Gemini Registration Refresh] Invalid response:", data);
            return null;
        }

        // URL Validation
        if (data.registration_url) {
            const isValid = await validateUrl(data.registration_url);
            if (!isValid) {
                console.warn(`[Gemini Registration Refresh] URL validation failed for: ${data.registration_url}`);
                data.registration_url = "";
            }
        }

        await supabase.from("service_registration_info").upsert({
            service_name: normalizedName,
            registration_url: data.registration_url || "",
            has_free_trial: data.has_free_trial ?? false,
            trial_period: data.trial_period || null,
            notes: data.notes || null,
            verified: false,
            user_verified: false,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'service_name', ignoreDuplicates: false });

        return {
            registration_url: data.registration_url || "",
            has_free_trial: data.has_free_trial,
            trial_period: data.trial_period,
            notes: data.notes,
            user_verified: false,
        };
    } catch (error) {
        console.error("[Gemini Registration Refresh] API Error:", error);
        return null;
    }
}

/**
 * Update registration URL with user verification
 */
export async function updateRegistrationUrl(
    serviceName: string,
    newUrl: string,
    verified: boolean = true
): Promise<boolean> {
    const supabase = await createClient();
    const normalizedName = normalizeServiceName(serviceName);

    try {
        // Use upsert to handle both insert and update cases
        const { error } = await supabase
            .from("service_registration_info")
            .upsert({
                service_name: normalizedName,
                registration_url: newUrl,
                user_verified: verified,
                verification_count: verified ? 1 : 0,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'service_name', ignoreDuplicates: false });

        if (error) {
            console.error("[Update Registration URL] Database Error:", error);
            throw error;
        }
        return true;
    } catch (error) {
        console.error("[Update Registration URL] Error:", error);
        return false;
    }
}

/**
 * Mark registration URL as verified by user
 */
export async function verifyRegistrationUrl(serviceName: string): Promise<boolean> {
    const supabase = await createClient();
    const normalizedName = normalizeServiceName(serviceName);

    try {
        // First get current verification count
        const { data: existing } = await supabase
            .from("service_registration_info")
            .select("verification_count")
            .eq("service_name", normalizedName)
            .single();

        const currentCount = existing?.verification_count || 0;

        const { error } = await supabase
            .from("service_registration_info")
            .update({
                user_verified: true,
                verification_count: currentCount + 1,
            })
            .eq("service_name", normalizedName);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error("[Verify Registration URL] Error:", error);
        return false;
    }
}
