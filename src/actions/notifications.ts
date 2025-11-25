"use server";

import { createClient } from "@/lib/supabase/server";

export interface NotificationPreferences {
    days_before_billing: number;
    email_notifications: boolean;
}

/**
 * Get user's notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Get existing preferences
    const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

    // Return existing preferences or default values
    return data || { days_before_billing: 7, email_notifications: false };
}

/**
 * Update user's notification preferences
 */
export async function updateNotificationPreferences(
    daysBeforeBilling: number,
    emailNotifications: boolean = false
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    // Validate days_before_billing
    if (daysBeforeBilling < 1 || daysBeforeBilling > 90) {
        return { success: false, error: "Days before billing must be between 1 and 90" };
    }

    try {
        const { error } = await supabase
            .from("notification_preferences")
            .upsert({
                user_id: user.id,
                days_before_billing: daysBeforeBilling,
                email_notifications: emailNotifications,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error("[Update Notification Preferences] Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}
