"use client";

import { Bell, Calendar } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function NotificationsPage() {
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

    const safeSubscriptions = subscriptions || [];
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const notifications = safeSubscriptions
        .filter(sub => sub.status === "active" || sub.status === "利用中")
        .map(sub => {
            const billingDate = new Date(sub.next_payment_date);
            const diffTime = billingDate.getTime() - currentDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return { ...sub, diffDays };
        })
        .filter(sub => sub.diffDays >= 0 && sub.diffDays <= 14) // Show notifications for next 14 days
        .sort((a, b) => a.diffDays - b.diffDays);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">通知</h1>
                <p className="text-muted-foreground">
                    次回請求日（解約期限）が近づいているサブスクリプション
                </p>
            </div>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center border rounded-xl bg-card text-muted-foreground">
                        現在、新しい通知はありません。
                    </div>
                ) : (
                    notifications.map((sub) => (
                        <div key={sub.id} className="flex items-start gap-4 p-4 rounded-xl border bg-card shadow-sm hover:bg-accent/50 transition-colors">
                            <div className={`p-2 rounded-full bg-primary/10 text-primary`}>
                                <Bell className="w-5 h-5" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-lg">{sub.name}</h3>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${sub.diffDays <= 3 ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"
                                        }`}>
                                        あと{sub.diffDays}日
                                    </span>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    次回請求日は <span className="font-medium text-foreground">{sub.next_payment_date}</span> です。
                                    解約する場合はこの日までに手続きを行ってください。
                                </p>
                                <div className="pt-2">
                                    <Link
                                        href={`/subscriptions/detail?id=${sub.id}`}
                                        className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                        詳細・解約手続きへ <Calendar className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
