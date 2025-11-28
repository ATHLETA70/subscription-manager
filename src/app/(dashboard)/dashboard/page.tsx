"use client";

import { LayoutDashboard } from "lucide-react";
import { DashboardStats } from "@/components/dashboard/stats";
import { SubscriptionList } from "@/components/dashboard/subscription-list";
import { TrialSubscriptions } from "@/components/subscriptions/trial-subscriptions";
import { Subscription } from "@/types/subscription";
import { DashboardCharts } from "@/components/dashboard/charts";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";

import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function DashboardPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        const supabase = createClient();
        // 本番環境ではログインユーザーのデータを取得
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .order('amount', { ascending: false });

            if (data) {
                setSubscriptions(data);
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return <LoadingSpinner />;
    }

    // ... existing imports

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                    <LayoutDashboard className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight">ダッシュボード</h1>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        サブスクリプションの利用状況と支出の概要
                    </p>
                </div>
            </div>

            <DashboardStats subscriptions={subscriptions} />

            <DashboardCharts subscriptions={subscriptions} />

            <SubscriptionList subscriptions={subscriptions} onUpdate={fetchData} />
            <TrialSubscriptions subscriptions={subscriptions} onUpdate={fetchData} />
        </div>
    );
}
