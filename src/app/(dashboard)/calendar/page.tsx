"use client";

import { Calendar } from "@/components/calendar/calendar";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function CalendarPage() {
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
                <h1 className="text-3xl font-bold tracking-tight">カレンダー</h1>
                <p className="text-muted-foreground mt-2">
                    サブスクリプションの請求日を確認できます
                </p>
            </div>

            <Calendar subscriptions={subscriptions} />
        </div>
    );
}
