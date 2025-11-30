"use client";

import { useState, useEffect } from "react";
import { MoreHorizontal, ExternalLink, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
// import { Badge } from "@/components/ui/badge"; // Need to create this or use raw tailwind
// import { Button } from "@/components/ui/button"; // Need to create this or use raw tailwind
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from "@/components/ui/table"; // Need to create this or use raw tailwind

// For now, I will use raw Tailwind to avoid dependency on uncreated UI components
// and keep the velocity high. I can refactor to shadcn/ui later.

import { Subscription } from "@/types/subscription";
import { useUserPlan } from "@/hooks/use-user-plan";

function SubscriptionIcon({ sub }: { sub: Subscription }) {
    const [imageError, setImageError] = useState(false);

    if (sub.image_url && !imageError) {
        return (
            <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-border/20 dark:border-white/10 shrink-0 p-1.5 shadow-sm">
                <img
                    src={sub.image_url}
                    alt={sub.name}
                    className="w-full h-full object-contain"
                    onError={() => setImageError(true)}
                />
            </div>
        );
    }

    return (
        <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center font-bold shrink-0 shadow-sm",
            "border border-border/20 dark:border-white/10",
            // Light mode: primary color with white text
            "bg-primary text-primary-foreground",
            // Dark mode: elevated surface with white text for better contrast
            "dark:bg-gray-700 dark:text-white"
        )}>
            {sub.name.charAt(0)}
        </div>
    );
}

interface SubscriptionListProps {
    subscriptions: Subscription[];
    onUpdate?: () => Promise<void>;
}

export function SubscriptionList({ subscriptions, onUpdate }: SubscriptionListProps) {
    const router = useRouter();
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [showDowngradeModal, setShowDowngradeModal] = useState(false);
    const { plan, loading } = useUserPlan();

    // Filter to show only active subscriptions
    const activeSubscriptions = subscriptions.filter(
        sub => sub.status === 'active' || sub.status === '利用中'
    );

    // Check for downgrade status on load
    useEffect(() => {
        if (!loading && plan?.type === 'free' && subscriptions.length > plan.limit) {
            setShowDowngradeModal(true);
        }
    }, [loading, plan, subscriptions.length]);

    const handleNewSubscription = () => {
        if (!loading && plan?.type === 'free' && subscriptions.length >= plan.limit) {
            setShowLimitModal(true);
            return;
        }
        router.push('/subscriptions/new');
    };

    return (
        <div className="space-y-4 relative">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">契約中のサブスクリプション</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleNewSubscription}
                        className="group inline-flex items-center gap-2 pl-4 pr-5 py-2.5 text-sm font-semibold text-primary-foreground bg-primary rounded-full shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
                    >
                        <div className="p-1 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                            <Plus className="w-4 h-4" />
                        </div>
                        <span>新規登録</span>
                    </button>
                </div>
            </div>

            {/* Mobile View (Cards) */}
            <div className="grid gap-2 md:hidden">
                {activeSubscriptions.map((sub) => (
                    <Link
                        href={`/subscriptions/detail?id=${sub.id}`}
                        key={sub.id}
                        className="flex items-center justify-between p-3 rounded-xl border bg-card shadow-sm active:scale-95 transition-transform"
                    >
                        <div className="flex items-center gap-3">
                            <SubscriptionIcon sub={sub} />
                            <div>
                                <div className="text-sm font-medium">{sub.name}</div>
                                <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                                        {sub.category}
                                    </span>
                                    <span>•</span>
                                    <span>{sub.next_payment_date || '未設定'}</span>
                                    <span>•</span>
                                    <span>{sub.cycle === 'monthly' ? '月額' : '年額'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                            <div className="text-sm font-bold">¥{typeof sub.amount === 'number' ? sub.amount.toLocaleString() : sub.amount}</div>
                            <div className={`text-[10px] px-1.5 py-0.5 rounded-full inline-block ${sub.status === 'active' || sub.status === '利用中'
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-red-500/10 text-red-500'
                                }`}>
                                {sub.status === 'active' ? '契約中' : sub.status === 'inactive' ? '解約中' : sub.status}
                            </div>
                            <span className="text-[10px] text-primary font-medium mt-0.5">詳細 / 解約 &rarr;</span>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Desktop View (Grid-based Table) */}
            <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1.2fr_1fr_1.2fr] gap-4 px-6 py-3 bg-muted/50 text-muted-foreground font-medium text-sm border-b">
                    <div>サービス名</div>
                    <div>カテゴリ</div>
                    <div>金額</div>
                    <div>支払い周期</div>
                    <div>次回請求日</div>
                    <div>ステータス</div>
                    <div className="text-right">操作</div>
                </div>
                {/* Body */}
                <div className="divide-y divide-border">
                    {activeSubscriptions.map((sub) => (
                        <div key={sub.id} className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1.2fr_1fr_1.2fr] gap-4 px-6 py-4 hover:bg-muted/50 transition-colors group items-center text-sm">
                            <Link href={`/subscriptions/detail?id=${sub.id}`} className="flex items-center gap-3">
                                <SubscriptionIcon sub={sub} />
                                <span className="font-medium group-hover:text-primary transition-colors">{sub.name}</span>
                            </Link>
                            <div className="text-muted-foreground">{sub.category}</div>
                            <div className="font-medium">¥{typeof sub.amount === 'number' ? sub.amount.toLocaleString() : sub.amount}</div>
                            <div className="text-muted-foreground">{sub.cycle === 'monthly' ? '月額' : '年額'}</div>
                            <div className="text-muted-foreground">{sub.next_payment_date || '未設定'}</div>
                            <div>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium inline-block ${sub.status === 'active' || sub.status === '利用中'
                                    ? 'bg-green-500/10 text-green-500'
                                    : 'bg-red-500/10 text-red-500'
                                    }`}>
                                    {sub.status === 'active' ? '契約中' : sub.status === 'inactive' ? '解約中' : sub.status}
                                </span>
                            </div>
                            <div className="text-right">
                                <Link
                                    href={`/subscriptions/detail?id=${sub.id}`}
                                    className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors whitespace-nowrap"
                                >
                                    詳細 / 解約
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Free Plan Limit Modal (New Subscription Attempt) */}
            {showLimitModal && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border rounded-2xl p-8 max-w-md w-full space-y-6 shadow-2xl animate-in zoom-in duration-300">
                        <div className="text-center space-y-4">
                            {/* Icon */}
                            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-primary">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                                </svg>
                            </div>

                            {/* Title */}
                            <h3 className="text-2xl font-bold tracking-tight">
                                すごい！<br />
                                たくさんのサブスクを管理していますね🎉
                            </h3>

                            {/* Message */}
                            <div className="space-y-3 text-sm text-muted-foreground">
                                <p>
                                    現在、フリープランで管理できる<br />
                                    <span className="font-bold text-foreground">最大{plan?.limit}つのサブスクリプション</span>を<br />
                                    すでに登録されています。
                                </p>
                                <p className="text-base font-medium text-foreground">
                                    さらに多くのサブスクを管理するには<br />
                                    プレミアムプランへのアップグレードがおすすめです！
                                </p>
                                <div className="space-y-6">
                                    <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border p-6 flex items-center gap-6">
                                        <div className="p-4 bg-[#E184DF]/10 rounded-xl shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="28px" height="32px" viewBox="0 0 14 16" version="1.1">
                                                <g id="Flow" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                                    <g id="0-Default" transform="translate(-121.000000, -40.000000)" fill="#E184DF">
                                                        <path d="M127,50 L126,50 C123.238576,50 121,47.7614237 121,45 C121,42.2385763 123.238576,40 126,40 L135,40 L135,56 L133,56 L133,42 L129,42 L129,56 L127,56 L127,50 Z M127,48 L127,42 L126,42 C124.343146,42 123,43.3431458 123,45 C123,46.6568542 124.343146,48 126,48 L127,48 Z" id="Pilcrow" />
                                                    </g>
                                                </g>
                                            </svg>
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-bold text-foreground">Premium Plan</h3>
                                            <h5 className="text-lg font-medium text-muted-foreground">¥280 <span className="text-sm">/ month</span></h5>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <p>
                                            現在、フリープランで管理できる<br />
                                            <span className="font-bold text-foreground">最大{plan?.limit}つのサブスクリプション</span>を<br />
                                            すでに登録されています。
                                        </p>
                                        <p>
                                            さらに多くのサブスクを管理するには<br />
                                            プレミアムプランへのアップグレードがおすすめです！
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={async () => {
                                        const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
                                        if (!priceId) {
                                            toast.error('Stripeの設定が不足しています (Price ID)');
                                            return;
                                        }

                                        try {
                                            toast.loading('決済画面へ移動中...');
                                            const res = await fetch('/api/stripe/checkout', {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                },
                                                body: JSON.stringify({
                                                    priceId,
                                                }),
                                            });

                                            if (!res.ok) {
                                                const errorText = await res.text();
                                                throw new Error(errorText || 'Failed to create checkout session');
                                            }

                                            const { url } = await res.json();
                                            if (url) {
                                                window.location.href = url;
                                            } else {
                                                throw new Error('No checkout URL returned');
                                            }
                                        } catch (error) {
                                            console.error(error);
                                            toast.dismiss();
                                            toast.error(error instanceof Error ? error.message : 'アップグレードの開始に失敗しました');
                                        }
                                    }}
                                    className="w-full inline-flex items-center justify-center rounded-md text-sm font-bold bg-[#556cd6] text-white hover:bg-[#445acb] h-11 px-8 transition-colors shadow-sm"
                                >
                                    Checkout
                                </button>
                                <button
                                    onClick={() => setShowLimitModal(false)}
                                    className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8 transition-colors"
                                >
                                    閉じる
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Downgrade Alert Modal (Existing Subscriptions > Limit) */}
            {showDowngradeModal && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border rounded-2xl p-8 max-w-md w-full space-y-6 shadow-2xl animate-in zoom-in duration-300">
                        <div className="text-center space-y-4">
                            {/* Icon */}
                            <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-orange-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            </div>

                            {/* Title */}
                            <h3 className="text-2xl font-bold tracking-tight">
                                フリープランの上限を超えています
                            </h3>

                            {/* Message */}
                            <div className="space-y-3 text-sm text-muted-foreground">
                                <p>
                                    現在、フリープランの上限（5件）を超える<br />
                                    <span className="font-bold text-foreground">{subscriptions.length}つのサブスクリプション</span>が登録されています。
                                </p>
                                <p className="text-base font-medium text-foreground">
                                    新規登録を行うには、<br />
                                    登録済みサブスクリプションを<br />
                                    5件以下になるように整理してください。
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowDowngradeModal(false)}
                                    className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 transition-colors"
                                >
                                    確認しました
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
