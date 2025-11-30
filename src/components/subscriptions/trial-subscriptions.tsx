"use client";

import Link from "next/link";
import { Subscription } from "@/types/subscription";
import { cn } from "@/lib/utils";

function SubscriptionIcon({ sub }: { sub: Subscription }) {
    if (sub.image_url) {
        return (
            <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-border/10 shrink-0 p-1.5">
                <img
                    src={sub.image_url}
                    alt={sub.name}
                    className="w-full h-full object-contain"
                />
            </div>
        );
    }

    return (
        <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-sm bg-blue-500"
        )}>
            {sub.name.charAt(0)}
        </div>
    );
}

interface TrialSubscriptionsProps {
    subscriptions: Subscription[];
    onUpdate?: () => Promise<void>;
}

export function TrialSubscriptions({ subscriptions, onUpdate }: TrialSubscriptionsProps) {
    // Filter to show only trial subscriptions
    const trialSubscriptions = subscriptions.filter(
        sub => sub.status === 'trial'
    );

    return (
        <div className="space-y-4 relative">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight text-blue-600">トライアル期間中のサブスクリプション</h2>
            </div>

            {trialSubscriptions.length === 0 ? (
                <div className="text-sm text-muted-foreground p-8 border border-dashed border-blue-200 rounded-xl text-center bg-blue-50/10">
                    現在トライアル期間中のサブスクリプションはありません。
                </div>
            ) : (
                <>
                    {/* Mobile View (Cards) */}
                    <div className="grid gap-2 md:hidden">
                        {trialSubscriptions.map((sub) => (
                            <Link
                                href={`/subscriptions/detail?id=${sub.id}`}
                                key={sub.id}
                                className="flex items-center justify-between p-3 rounded-xl border border-blue-100 bg-blue-50/30 shadow-sm active:scale-95 transition-transform"
                            >
                                <div className="flex items-center gap-3">
                                    <SubscriptionIcon sub={sub} />
                                    <div>
                                        <div className="text-sm font-medium">{sub.name}</div>
                                        <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/50 text-muted-foreground border border-blue-100">
                                                {sub.category}
                                            </span>
                                            <span>•</span>
                                            <span className="text-blue-600 font-medium">終了: {sub.first_payment_date || '未設定'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <div className="text-sm font-bold">¥{typeof sub.amount === 'number' ? sub.amount.toLocaleString() : sub.amount}</div>
                                    <div className="text-[10px] px-1.5 py-0.5 rounded-full inline-block bg-blue-500/10 text-blue-600 font-medium">
                                        トライアル中
                                    </div>
                                    <span className="text-[10px] text-blue-600 font-medium mt-0.5">詳細 / 解約 &rarr;</span>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Desktop View (Grid-based Table) */}
                    <div className="hidden md:block rounded-xl border border-blue-100 bg-blue-50/10 shadow-sm overflow-hidden">
                        {/* Header */}
                        <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1.2fr_1fr_1.2fr] gap-4 px-6 py-3 bg-blue-50/50 text-blue-900/70 font-medium text-sm border-b border-blue-100">
                            <div>サービス名</div>
                            <div>カテゴリ</div>
                            <div>金額</div>
                            <div>支払い周期</div>
                            <div>トライアル終了日</div>
                            <div>ステータス</div>
                            <div className="text-right">操作</div>
                        </div>
                        {/* Body */}
                        <div className="divide-y divide-blue-100">
                            {trialSubscriptions.map((sub) => (
                                <div key={sub.id} className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1.2fr_1fr_1.2fr] gap-4 px-6 py-4 hover:bg-blue-50/50 transition-colors group items-center text-sm">
                                    <Link href={`/subscriptions/detail?id=${sub.id}`} className="flex items-center gap-3">
                                        <SubscriptionIcon sub={sub} />
                                        <span className="font-medium group-hover:text-blue-600 transition-colors">{sub.name}</span>
                                    </Link>
                                    <div className="text-muted-foreground">{sub.category}</div>
                                    <div className="font-medium">¥{typeof sub.amount === 'number' ? sub.amount.toLocaleString() : sub.amount}</div>
                                    <div className="text-muted-foreground">{sub.cycle === 'monthly' ? '月額' : '年額'}</div>
                                    <div className="text-blue-600 font-medium">{sub.first_payment_date || '未設定'}</div>
                                    <div>
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium inline-block bg-blue-500/10 text-blue-600">
                                            トライアル中
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <Link
                                            href={`/subscriptions/detail?id=${sub.id}`}
                                            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border border-blue-200 bg-white hover:bg-blue-50 hover:text-blue-700 transition-colors whitespace-nowrap text-blue-600"
                                        >
                                            詳細 / 解約
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
