"use server";

import { createClient } from "@/lib/supabase/server";
import { getGeminiClient, GEMINI_MODEL_NAME } from "@/lib/gemini";

export interface CancellationInfo {
    cancellation_url: string;
    steps: { id: number; label: string; description: string }[];
    required_info: { label: string; value: string }[];
    is_cancellable?: boolean;
    user_verified?: boolean;
}

function normalizeServiceName(name: string): string {
    return name
        .toLowerCase()
        .replace(/\s+(premium|plus|basic|standard|pro)\s*$/i, "")
        .trim();
}

function generatePrompt(serviceName: string): string {
    return `
      Service Name: ${serviceName}

      タスク: このサブスクリプションサービスの解約情報をJSON形式で提供してください。
      
      重要: 
      1. **解約方法を説明している公式ヘルプページ、FAQ、またはサポート記事のURLを優先してください。** 
         (理由: 直接の解約ページはログインが必要だったり、URLが変更されやすいため)
      2. ヘルプページが見つからない場合のみ、アカウント設定や解約ページのURLを返してください。
      3. **推測や古いURLは絶対に返さないでください。** 404エラーになるURLは無価値です。
      4. 確実にアクセス可能な公開URLが見つからない場合は、cancellation_urlを空文字列にしてください。
      
      検索クエリ例: "${serviceName} 解約方法 公式 ヘルプ", "${serviceName} cancel subscription help center", "${serviceName} 退会 FAQ"
      
      JSON構造:
      {
        "is_cancellable": boolean, 
        "cancellation_url": "公式の解約方法が記載されたヘルプページ、または解約ページのURL",
        "steps": [
          { "id": 1, "label": "ステップのタイトル", "description": "詳細な手順" }
        ],
        "required_info": [
          { "label": "情報ラベル（例: ログインメール）", "value": "プレースホルダーまたは既知の値" }
        ]
      }

      ルール:
      1. 家賃、光熱費、物理的な契約など、オンライン解約プロセスがないサービスの場合、is_cancellableをfalseに設定。
      2. is_cancellableがtrueの場合でも、**有効なURLが確認できない場合はcancellation_urlを空にしてください。**
      3. アプリ内でのみ解約可能な場合（例: iOS設定、Google Play）は、その旨をstepsに記載し、URLはそれぞれの管理ページ（例: https://play.google.com/store/account/subscriptions）を指定するか、空にしてください。
      4. 応答は日本語で。
      5. マークダウン形式を使用せず、JSONのみを返してください。
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

        // Retry with GET if HEAD fails (some servers block HEAD or return 403/405)
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

export async function getCancellationInfo(serviceName: string): Promise<CancellationInfo | null> {
    const supabase = await createClient();
    const normalizedName = normalizeServiceName(serviceName);

    // 1. Check Database
    const { data: existingData } = await supabase
        .from("service_cancellation_info")
        .select("*")
        .eq("service_name", normalizedName)
        .single();

    if (existingData) {
        // Check if data is stale (older than the implementation of is_cancellable logic)
        // Adjust this date to ensure we re-evaluate existing entries
        const CUTOFF_DATE = new Date("2025-11-24T06:00:00Z"); // Use a time slightly after the migration
        const updatedAt = new Date(existingData.updated_at);

        // If data is new enough, return it. Otherwise, fall through to re-fetch.
        if (updatedAt > CUTOFF_DATE) {
            return {
                cancellation_url: existingData.cancellation_url,
                steps: existingData.cancellation_steps,
                required_info: existingData.required_info,
                is_cancellable: existingData.is_cancellable ?? true,
                user_verified: existingData.user_verified ?? false,
            };
        }
        // If stale, we proceed to Gemini fetch (step 2)
    }

    // 2. If not found, ask Gemini
    const genAI = getGeminiClient();
    if (!genAI) return null;

    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });
        const prompt = generatePrompt(serviceName);

        console.log(`[Gemini] Requesting info for: ${serviceName}`);
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        console.log(`[Gemini] Raw response:`, text);

        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/^```json\n|\n```$/g, "").trim();

        let data;
        try {
            data = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error("[Gemini] JSON Parse Error:", parseError);
            console.error("[Gemini] Failed JSON string:", jsonStr);
            return null;
        }

        // Validate structure (basic check)
        // If is_cancellable is false, we don't need URL validation
        if (data.is_cancellable && (!data.cancellation_url || !Array.isArray(data.steps))) {
            console.error("[Gemini] Invalid response structure:", data);
            return null;
        }

        // URL Validation: Check if the URL is actually accessible
        if (data.is_cancellable && data.cancellation_url) {
            const isValid = await validateUrl(data.cancellation_url);
            if (!isValid) {
                console.warn(`[Gemini] URL validation failed for: ${data.cancellation_url}. Clearing URL.`);
                data.cancellation_url = ""; // Clear invalid URL
                // We could also set is_cancellable to false, or keep it true but without URL (user has to find it)
                // For now, keeping is_cancellable=true but empty URL will show "URL not found" state in UI
            }
        }

        // 3. Save to Database
        // Use upsert with ignoreDuplicates to handle race conditions where another request might have saved it
        await supabase.from("service_cancellation_info").upsert({
            service_name: normalizedName,
            cancellation_url: data.cancellation_url || "",
            cancellation_steps: data.steps || [],
            required_info: data.required_info || [],
            is_cancellable: data.is_cancellable ?? true,
            verified: false,
        }, { onConflict: 'service_name', ignoreDuplicates: true });

        return data as CancellationInfo;

    } catch (error) {
        console.error("[Gemini] API Error:", error);
        return null;
    }
}

export async function refreshCancellationInfo(serviceName: string): Promise<CancellationInfo | null> {
    const supabase = await createClient();
    const normalizedName = normalizeServiceName(serviceName);
    const genAI = getGeminiClient();
    if (!genAI) return null;

    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });
        const prompt = generatePrompt(serviceName);

        console.log(`[Gemini Refresh] Requesting info for: ${serviceName}`);
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        console.log(`[Gemini Refresh] Raw response:`, text);

        const jsonStr = text.replace(/^```json\n|\n```$/g, "").trim();
        let data;
        try {
            data = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error("[Gemini Refresh] JSON Parse Error:", parseError);
            console.error("[Gemini Refresh] Failed JSON string:", jsonStr);
            return null;
        }

        if (data.is_cancellable && (!data.cancellation_url || !Array.isArray(data.steps))) {
            console.error("[Gemini Refresh] Invalid response structure:", data);
            return null;
        }

        // URL Validation
        if (data.is_cancellable && data.cancellation_url) {
            const isValid = await validateUrl(data.cancellation_url);
            if (!isValid) {
                console.warn(`[Gemini Refresh] URL validation failed for: ${data.cancellation_url}. Clearing URL.`);
                data.cancellation_url = "";
            }
        }

        await supabase.from("service_cancellation_info").upsert({
            service_name: normalizedName,
            cancellation_url: data.cancellation_url || "",
            cancellation_steps: data.steps || [],
            required_info: data.required_info || [],
            is_cancellable: data.is_cancellable ?? true,
            verified: false,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'service_name', ignoreDuplicates: false });

        return data as CancellationInfo;
    } catch (error: any) {
        console.error("[Gemini Refresh] API Error:", JSON.stringify(error, null, 2));
        if (error.response) {
            console.error("[Gemini Refresh] Error Response:", JSON.stringify(error.response, null, 2));
        }
        return null;
    }
}

/**
 * Update cancellation URL with user verification
 */
export async function updateCancellationUrl(
    serviceName: string,
    newUrl: string,
    verified: boolean = true
): Promise<boolean> {
    const supabase = await createClient();
    const normalizedName = normalizeServiceName(serviceName);

    try {
        const { error } = await supabase
            .from("service_cancellation_info")
            .update({
                cancellation_url: newUrl,
                user_verified: verified,
                verification_count: verified ? 1 : 0,
                updated_at: new Date().toISOString(),
            })
            .eq("service_name", normalizedName);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error("[Update URL] Error:", error);
        return false;
    }
}

/**
 * Mark cancellation URL as verified by user
 */
export async function verifyCancellationUrl(serviceName: string): Promise<boolean> {
    const supabase = await createClient();
    const normalizedName = normalizeServiceName(serviceName);

    try {
        // First get current verification count
        const { data: existing } = await supabase
            .from("service_cancellation_info")
            .select("verification_count")
            .eq("service_name", normalizedName)
            .single();

        const currentCount = existing?.verification_count || 0;

        const { error } = await supabase
            .from("service_cancellation_info")
            .update({
                user_verified: true,
                verification_count: currentCount + 1,
            })
            .eq("service_name", normalizedName);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error("[Verify URL] Error:", error);
        return false;
    }
}

