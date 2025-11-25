'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function bulkUpdateStatus(ids: string[], status: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error("ログインが必要です");
        }

        // Verify ownership and update
        const { error, data } = await supabase
            .from('subscriptions')
            .update({ status })
            .in('id', ids)
            .eq('user_id', user.id) // Ensure user owns the data
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            // If no data returned, it might be an ownership issue or ids don't exist
            // Let's check if the ids exist at all
            const { count } = await supabase
                .from('subscriptions')
                .select('*', { count: 'exact', head: true })
                .in('id', ids);

            if (count && count > 0) {
                throw new Error("更新権限がありません。データの所有者が異なる可能性があります。");
            } else {
                throw new Error("更新対象のデータが見つかりませんでした。");
            }
        }

        revalidatePath('/dashboard');
        revalidatePath('/subscriptions');

        return { success: true, count: data.length };
    } catch (error) {
        console.error("Bulk update error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}
