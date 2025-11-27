"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function UpgradeButton() {
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to create checkout session');
            }

            const { url } = await res.json();
            if (url) {
                window.location.href = url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (error) {
            console.error(error);
            toast.error('アップグレードの開始に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button onClick={handleUpgrade} disabled={loading} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0">
            {loading ? '処理中...' : 'プレミアムプランにアップグレード (¥200/月)'}
        </Button>
    );
}
