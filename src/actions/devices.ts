"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Register a device token for push notifications
 */
export async function registerDeviceToken(
    token: string,
    platform: 'ios' | 'android' | 'web'
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    if (!token) {
        return { success: false, error: "Token is required" };
    }

    try {
        // Upsert device token
        const { error } = await supabase
            .from("user_devices")
            .upsert({
                user_id: user.id,
                fcm_token: token,
                platform: platform,
                last_active: new Date().toISOString(),
                created_at: new Date().toISOString(), // This will be ignored on update
            }, {
                onConflict: 'user_id, fcm_token',
                ignoreDuplicates: false
            });

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error("[Register Device Token] Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}

/**
 * Remove a device token (e.g. on logout)
 */
export async function unregisterDeviceToken(token: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    try {
        const { error } = await supabase
            .from("user_devices")
            .delete()
            .match({
                user_id: user.id,
                fcm_token: token
            });

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error("[Unregister Device Token] Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}
