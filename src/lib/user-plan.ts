import { SupabaseClient } from '@supabase/supabase-js';

export const PLAN_LIMITS = {
    free: 5,
    premium: Infinity,
};

export type UserPlan = {
    type: 'free' | 'premium';
    limit: number;
    subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | null;
};

export async function getUserPlan(supabase: SupabaseClient, userId: string): Promise<UserPlan> {
    const { data } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (!data) {
        return {
            type: 'free',
            limit: PLAN_LIMITS.free,
            subscriptionStatus: null,
        };
    }

    // Check if the plan is effectively premium (active or trialing)
    const isPremium = data.plan_type === 'premium' &&
        (data.subscription_status === 'active' || data.subscription_status === 'trialing');

    return {
        type: isPremium ? 'premium' : 'free',
        limit: isPremium ? PLAN_LIMITS.premium : PLAN_LIMITS.free,
        subscriptionStatus: data.subscription_status,
    };
}

// @deprecated Use getUserPlan instead
// export const userPlan = {
//     type: 'free',
//     limit: 5,
//     price: 280
// };
