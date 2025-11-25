'use server'

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function fixSubscriptionOwnership() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error("ログインが必要です");
        }

        const adminSupabase = createAdminClient();

        // Update all subscriptions to belong to the current user
        // CAUTION: This assumes a single-user scenario or that the user wants to claim ALL data.
        // In a multi-user app, this would be dangerous. But for this personal app context, it's a valid fix.
        const { error, data } = await adminSupabase
            .from('subscriptions')
            .update({ user_id: user.id })
            .neq('user_id', user.id) // Only update if different
            .select();

        if (error) throw error;

        const count = data ? data.length : 0;

        revalidatePath('/dashboard');
        revalidatePath('/subscriptions');

        return { success: true, count };
    } catch (error) {
        console.error("Fix ownership error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}
