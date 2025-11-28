"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/calendar/calendar";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                    <CalendarIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight">カレンダー</h1>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        サブスクリプションの請求日を確認できます
                    </p>
                </div>
            </div>

            <Calendar subscriptions={subscriptions} />
        </div>
    );
}
