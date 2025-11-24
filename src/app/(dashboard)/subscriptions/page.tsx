"use client";

import { SubscriptionList } from "@/components/dashboard/subscription-list";
import { SubscriptionCancellationCandidates } from "@/components/subscriptions/cancellation-candidates";
import { CancelledSubscriptions } from "@/components/subscriptions/cancelled-subscriptions";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const supabase = createClient();
            const { data } = await supabase
                .from('subscriptions')
                .select('*');

            if (data) {
                setSubscriptions(data);
            }
            setLoading(false);
        }
        fetchData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center">読み込み中...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">サブスクリプション一覧</h1>
                <p className="text-muted-foreground">
                    現在契約中および過去に契約していたサブスクリプションの管理
                </p>
            </div>
            <SubscriptionList subscriptions={subscriptions} />
            <SubscriptionCancellationCandidates subscriptions={subscriptions} />
            <CancelledSubscriptions subscriptions={subscriptions} />
        </div>
    );
}
