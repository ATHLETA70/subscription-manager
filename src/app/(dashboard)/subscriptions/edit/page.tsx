"use client";

import { EditSubscriptionForm } from "@/components/subscriptions/edit-subscription-form";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function EditSubscriptionContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSubscription() {
            if (!id) return;
            const supabase = createClient();
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) {
                console.error(error);
            } else {
                setSubscription(data);
            }
            setLoading(false);
        }

        fetchSubscription();
    }, [id]);

    if (loading) {
        return <div className="p-8 text-center">読み込み中...</div>;
    }

    if (!subscription) {
        return <div className="p-8 text-center">サブスクリプションが見つかりません</div>;
    }

    return <EditSubscriptionForm subscription={subscription} />;
}

export default function EditSubscriptionPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">読み込み中...</div>}>
            <EditSubscriptionContent />
        </Suspense>
    );
}
