"use client";

import { DashboardStats } from "@/components/dashboard/stats";
import { SubscriptionList } from "@/components/dashboard/subscription-list";
import { DashboardCharts } from "@/components/dashboard/charts";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function DashboardPage() {
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const supabase = createClient();
            const { data } = await supabase
                .from('subscriptions')
                .select('*')
                .order('amount', { ascending: false });

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
        <div className="space-y-8">
            <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">ダッシュボード</h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                    サブスクリプションの利用状況と支出の概要
                </p>
            </div>

            <DashboardStats subscriptions={subscriptions} />

            <DashboardCharts subscriptions={subscriptions} />

            <SubscriptionList subscriptions={subscriptions} />
        </div>
    );
}
