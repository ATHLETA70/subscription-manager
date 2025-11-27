"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserPlan, PLAN_LIMITS } from '@/lib/user-plan';

export function useUserPlan() {
    const [plan, setPlan] = useState<UserPlan | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPlan() {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setPlan({ type: 'free', limit: PLAN_LIMITS.free, subscriptionStatus: null });
                    return;
                }

                const { data } = await supabase
                    .from('user_plans')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (!data) {
                    setPlan({ type: 'free', limit: PLAN_LIMITS.free, subscriptionStatus: null });
                } else {
                    const isPremium = data.plan_type === 'premium' &&
                        (data.subscription_status === 'active' || data.subscription_status === 'trialing');

                    setPlan({
                        type: isPremium ? 'premium' : 'free',
                        limit: isPremium ? PLAN_LIMITS.premium : PLAN_LIMITS.free,
                        subscriptionStatus: data.subscription_status,
                    });
                }
            } catch (error) {
                console.error('Error fetching user plan:', error);
                setPlan({ type: 'free', limit: PLAN_LIMITS.free, subscriptionStatus: null });
            } finally {
                setLoading(false);
            }
        }

        fetchPlan();
    }, []);

    return { plan, loading };
}
