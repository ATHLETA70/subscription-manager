"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SubscriptionCancellationCandidatesProps {
    subscriptions: any[];
}

export function SubscriptionCancellationCandidates({ subscriptions }: SubscriptionCancellationCandidatesProps) {
    // Filter to get only active subscriptions
    const activeSubs = subscriptions.filter(sub => sub.status === 'active' || sub.status === '利用中');

    // Calculate duplicate categories (same logic as dashboard stats)
    const categoryCounts = activeSubs.reduce((acc, sub) => {
        acc[sub.category] = (acc[sub.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const duplicateCategories = Object.keys(categoryCounts).filter(cat => categoryCounts[cat] > 1);
    const candidates = activeSubs.filter(sub => duplicateCategories.includes(sub.category));

    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);

    const toggleSelectAll = () => {
        if (selectedIds.length === candidates.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(candidates.map(sub => sub.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sId => sId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkUpdate = async (status: string) => {
        if (!confirm(`${selectedIds.length}件のサブスクリプションのステータスを変更しますか？`)) return;

        setIsUpdating(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('subscriptions')
                .update({ status })
                .in('id', selectedIds);

            if (error) throw error;

            toast.success("ステータスを更新しました");
            setSelectedIds([]);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("更新に失敗しました");
        } finally {
            setIsUpdating(false);
        }
    };

    if (candidates.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight text-pink-500">解約候補のサブスクリプション</h2>
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                        <span className="text-sm text-muted-foreground">{selectedIds.length}件選択中</span>
                        <select
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                            onChange={(e) => {
                                if (e.target.value) handleBulkUpdate(e.target.value);
                                e.target.value = "";
                            }}
                            disabled={isUpdating}
                        >
                            <option value="">ステータス変更...</option>
                            <option value="active">有効にする</option>
                            <option value="paused">一時停止</option>
                            <option value="cancelled">解約済みにする</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Mobile View (Cards) */}
            <div className="grid gap-2 md:hidden">
                {candidates.map((sub) => (
                    <Link
                        href={`/subscriptions/${sub.id}`}
                        key={sub.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-pink-500/20 bg-pink-500/5 shadow-sm active:scale-95 transition-transform"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-pink-500/20 shrink-0">
                                {sub.image_url ? (
                                    <img
                                        src={sub.image_url}
                                        alt={sub.name}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-pink-500 flex items-center justify-center text-white text-xs font-bold">
                                        {sub.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="text-sm font-medium">{sub.name}</div>
                                <div className="text-[10px] text-muted-foreground">
                                    {sub.next_payment_date || '未設定'} • {sub.cycle === 'monthly' ? '月額' : '年額'}
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                            <div className="text-sm font-bold">¥{typeof sub.amount === 'number' ? sub.amount.toLocaleString() : sub.amount}</div>
                            <div className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-600">
                                {sub.category}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Desktop View (Grid-based Table) */}
            <div className="hidden md:block rounded-xl border border-pink-500/20 bg-pink-500/5 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[40px_2fr_1.2fr_1fr_1fr_1.2fr_1fr_1.2fr] gap-4 px-6 py-3 bg-pink-500/10 text-muted-foreground font-medium text-sm border-b border-pink-500/20">
                    <div className="flex items-center justify-center">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-pink-300 text-pink-500 focus:ring-pink-500"
                            checked={candidates.length > 0 && selectedIds.length === candidates.length}
                            onChange={toggleSelectAll}
                        />
                    </div>
                    <div>サービス名</div>
                    <div>カテゴリ</div>
                    <div>金額</div>
                    <div>支払い周期</div>
                    <div>次回請求日</div>
                    <div>ステータス</div>
                    <div className="text-right">操作</div>
                </div>
                {/* Body */}
                <div className="divide-y divide-pink-500/10">
                    {candidates.map((sub) => (
                        <div key={sub.id} className={cn(
                            "grid grid-cols-[40px_2fr_1.2fr_1fr_1fr_1.2fr_1fr_1.2fr] gap-4 px-6 py-4 hover:bg-pink-500/10 transition-colors group items-center text-sm",
                            selectedIds.includes(sub.id) && "bg-pink-500/10"
                        )}>
                            <div className="flex items-center justify-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-pink-300 text-pink-500 focus:ring-pink-500"
                                    checked={selectedIds.includes(sub.id)}
                                    onChange={() => toggleSelect(sub.id)}
                                />
                            </div>
                            <Link href={`/subscriptions/${sub.id}`} className="flex items-center gap-3">
                                {sub.image_url ? (
                                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-pink-500/20 shrink-0 p-1.5">
                                        <img
                                            src={sub.image_url}
                                            alt={sub.name}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-9 h-9 rounded-lg bg-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                        {sub.name.charAt(0)}
                                    </div>
                                )}
                                <span className="font-medium group-hover:text-pink-600 transition-colors">{sub.name}</span>
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
                                    href={`/subscriptions/${sub.id}`}
                                    className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border border-pink-500/20 bg-background hover:bg-pink-500/10 hover:text-pink-600 transition-colors whitespace-nowrap"
                                >
                                    詳細 / 解約
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
