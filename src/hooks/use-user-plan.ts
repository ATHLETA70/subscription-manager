"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserPlan, PLAN_LIMITS } from '@/lib/user-plan';

export function useUserPlan() {
    const [plan, setPlan] = useState<UserPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const supabase = createClient();
        let userId: string | null = null;

        async function fetchPlan() {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setPlan({ type: 'free', limit: PLAN_LIMITS.free, subscriptionStatus: null });
                    return;
                }

                userId = user.id;

                const { data, error: fetchError } = await supabase
                    .from('user_plans')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "Row not found"
                    console.error('Error fetching user plan:', fetchError);
                    setError(fetchError);
                }

                updatePlan(data);
            } catch (error) {
                console.error('Error fetching user plan:', error);
                setPlan({ type: 'free', limit: PLAN_LIMITS.free, subscriptionStatus: null });
                setError(error);
            } finally {
                setLoading(false);
            }
        }

        function updatePlan(data: any) {
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
        }

        fetchPlan();

        // Subscribe to realtime changes
        const channel = supabase
            .channel('user_plans_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_plans',
                    filter: userId ? `user_id=eq.${userId}` : undefined,
                },
                (payload) => {
                    console.log('User plan updated:', payload);
                    updatePlan(payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return { plan, loading, error };
}
