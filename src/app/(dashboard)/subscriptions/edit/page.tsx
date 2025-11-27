"use client";

import { EditSubscriptionForm } from "@/components/subscriptions/edit-subscription-form";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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
        return <LoadingSpinner />;
    }

    if (!subscription) {
        return <div className="p-8 text-center">サブスクリプションが見つかりません</div>;
    }

    return <EditSubscriptionForm subscription={subscription} />;
}

export default function EditSubscriptionPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <EditSubscriptionContent />
        </Suspense>
    );
}
