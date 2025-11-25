"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CancelledSubscriptionsProps {
    subscriptions: any[];
    onUpdate?: () => Promise<void>;
}

export function CancelledSubscriptions({ subscriptions, onUpdate }: CancelledSubscriptionsProps) {
    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);

    // Filter to get only cancelled/inactive subscriptions
    const cancelledSubs = subscriptions.filter(sub => sub.status === 'inactive' || sub.status === '解約中');

    const toggleSelectAll = () => {
        if (selectedIds.length === cancelledSubs.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(cancelledSubs.map(sub => sub.id));
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
            const { error, data } = await supabase
                .from('subscriptions')
                .update({ status })
                .in('id', selectedIds)
                .select();

            if (error) throw error;

            if (!data || data.length === 0) {
                throw new Error("更新対象が見つかりませんでした。権限がないか、データが存在しません。");
            }

            if (!data || data.length === 0) {
                throw new Error("更新対象が見つかりませんでした。権限がないか、データが存在しません。");
            }

            toast.success("ステータスを更新しました");
            setSelectedIds([]);

            // データを再取得
            if (onUpdate) {
                await onUpdate();
            } else {
                router.refresh();
            }
        } catch (error) {
            console.error(error);
            toast.error("更新に失敗しました");
        } finally {
            setIsUpdating(false);
        }
    };

    if (cancelledSubs.length === 0) return null;

    return (
        <div className="space-y-4 relative">
            {/* Loading Overlay */}
            {isUpdating && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
                    <div className="flex flex-col items-center gap-3 bg-card p-6 rounded-xl border shadow-lg">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-medium">更新中...</p>
                    </div>
                </div>
            )}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight text-gray-500">解約済みのサブスクリプション</h2>
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
                            <option value="active">有効にする（再契約）</option>
                            <option value="paused">一時停止</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Mobile View (Cards) */}
            <div className="grid gap-2 md:hidden">
                {cancelledSubs.map((sub) => (
                    <Link
                        href={`/subscriptions/${sub.id}`}
                        key={sub.id}
                        className="flex items-center justify-between p-3 rounded-xl border bg-card opacity-60 shadow-sm active:scale-95 transition-transform"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center overflow-hidden border shrink-0 grayscale">
                                {sub.image_url ? (
                                    <img
                                        src={sub.image_url}
                                        alt={sub.name}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold">
                                        {sub.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-600">{sub.name}</div>
                                <div className="text-[10px] text-muted-foreground">
                                    {sub.category}
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                            <div className="text-sm font-bold text-gray-500">¥{typeof sub.amount === 'number' ? sub.amount.toLocaleString() : sub.amount}</div>
                            <div className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500">
                                解約済み
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Desktop View (Grid-based Table) */}
            <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden opacity-70">
                {/* Header */}
                <div className="grid grid-cols-[40px_2fr_1.2fr_1fr_1fr_1.2fr_1fr_1.2fr] gap-4 px-6 py-3 bg-muted/50 text-muted-foreground font-medium text-sm border-b">
                    <div className="flex items-center justify-center">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={cancelledSubs.length > 0 && selectedIds.length === cancelledSubs.length}
                            onChange={toggleSelectAll}
                        />
                    </div>
                    <div>サービス名</div>
                    <div>カテゴリ</div>
                    <div>金額</div>
                    <div>支払い周期</div>
                    <div>解約日</div>
                    <div>ステータス</div>
                    <div className="text-right">操作</div>
                </div>
                {/* Body */}
                <div className="divide-y divide-border">
                    {cancelledSubs.map((sub) => (
                        <div key={sub.id} className={cn(
                            "grid grid-cols-[40px_2fr_1.2fr_1fr_1fr_1.2fr_1fr_1.2fr] gap-4 px-6 py-4 hover:bg-muted/50 transition-colors group items-center text-sm",
                            selectedIds.includes(sub.id) && "bg-muted/50"
                        )}>
                            <div className="flex items-center justify-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={selectedIds.includes(sub.id)}
                                    onChange={() => toggleSelect(sub.id)}
                                />
                            </div>
                            <Link href={`/subscriptions/${sub.id}`} className="flex items-center gap-3">
                                {sub.image_url ? (
                                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center overflow-hidden border shrink-0 p-1.5 grayscale">
                                        <img
                                            src={sub.image_url}
                                            alt={sub.name}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-9 h-9 rounded-lg bg-gray-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                        {sub.name.charAt(0)}
                                    </div>
                                )}
                                <span className="font-medium text-gray-600 group-hover:text-gray-800 transition-colors">{sub.name}</span>
                            </Link>
                            <div className="text-muted-foreground">{sub.category}</div>
                            <div className="font-medium text-gray-600">¥{typeof sub.amount === 'number' ? sub.amount.toLocaleString() : sub.amount}</div>
                            <div className="text-muted-foreground">{sub.cycle === 'monthly' ? '月額' : '年額'}</div>
                            <div className="text-muted-foreground">{sub.next_payment_date || '-'}</div>
                            <div>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 inline-block">
                                    解約済み
                                </span>
                            </div>
                            <div className="text-right">
                                <Link
                                    href={`/subscriptions/${sub.id}`}
                                    className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors whitespace-nowrap"
                                >
                                    詳細を見る
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
