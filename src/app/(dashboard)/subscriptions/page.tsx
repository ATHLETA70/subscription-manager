"use client";

import { CreditCard } from "lucide-react";
import { SubscriptionList } from "@/components/dashboard/subscription-list";
import { SubscriptionCancellationCandidates } from "@/components/subscriptions/cancellation-candidates";
import { CancelledSubscriptions } from "@/components/subscriptions/cancelled-subscriptions";
import { TrialSubscriptions } from "@/components/subscriptions/trial-subscriptions";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .order('next_payment_date', { ascending: true });

        if (error) {
            console.error('Error fetching subscriptions:', error);
        } else {
            setSubscriptions(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                    <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight">サブスクリプション一覧</h1>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        現在契約中および過去に契約していたサブスクリプションの管理
                    </p>
                </div>
            </div>
            <SubscriptionList subscriptions={subscriptions} onUpdate={fetchData} />
            <TrialSubscriptions subscriptions={subscriptions} onUpdate={fetchData} />
            <SubscriptionCancellationCandidates subscriptions={subscriptions} onUpdate={fetchData} />
            <CancelledSubscriptions subscriptions={subscriptions} onUpdate={fetchData} />
        </div>
    );
}

