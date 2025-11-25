"use client";

import { useState } from "react";
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

import { userPlan } from "@/lib/mock-data";

function SubscriptionIcon({ sub }: { sub: any }) {
    const [imageError, setImageError] = useState(false);

    if (sub.image_url && !imageError) {
        return (
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-border/10 shrink-0 p-1.5">
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
            "w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-sm",
            // Use a default color if none provided (though our seed data has colors mapped? No, seed data has status/category but not color class)
            // We might need to map category to color here or just use a default
            "bg-primary"
        )}>
            {sub.name.charAt(0)}
        </div>
    );
}

interface SubscriptionListProps {
    subscriptions: any[];
    onUpdate?: () => Promise<void>;
}

export function SubscriptionList({ subscriptions, onUpdate }: SubscriptionListProps) {
    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);

    // Filter to show only active subscriptions
    const activeSubscriptions = subscriptions.filter(
        sub => sub.status === 'active' || sub.status === '利用中'
    );

    const handleNewSubscription = () => {
        if (userPlan.type === 'free' && subscriptions.length >= userPlan.limit) {
            alert(`フリープランでは最大${userPlan.limit}つまでしか登録できません。\n無制限に登録するにはプレミアムプラン（¥200/月）にアップグレードしてください。`);
            return;
        }
        router.push('/subscriptions/new');
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === activeSubscriptions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(activeSubscriptions.map(sub => sub.id));
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

            toast.success("ステータスを更新しました");
            setSelectedIds([]);

            // データを再取得
            if (onUpdate) {
                await onUpdate();
            } else {
                router.refresh();
            }
        } catch (error) {
            console.error('[Bulk Update] Error:', error);
            toast.error(error instanceof Error ? error.message : "更新に失敗しました");
        } finally {
            setIsUpdating(false);
        }
    };

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
                <h2 className="text-xl font-semibold tracking-tight">契約中のサブスクリプション</h2>
                <div className="flex gap-2">
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 mr-4 animate-in fade-in slide-in-from-right-4">
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
                    <button
                        onClick={handleNewSubscription}
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        新規登録
                    </button>
                </div>
            </div>

            {/* Debug/Fix Data Button (Temporary) */}
            <div className="flex justify-end mb-2">
                <button
                    onClick={async () => {
                        if (!confirm("データの所有権を修正しますか？\n(表示されないデータがある場合に有効です)")) return;
                        const { fixSubscriptionOwnership } = await import("@/actions/fix-data");
                        const result = await fixSubscriptionOwnership();
                        if (result.success) {
                            toast.success(`${result.count}件のデータを修正しました`);
                            router.refresh();
                        } else {
                            toast.error(`修正に失敗しました: ${result.error}`);
                        }
                    }}
                    className="text-xs text-muted-foreground hover:text-primary underline"
                >
                    データが表示されない/更新できない場合はこちら
                </button>
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
                <div className="grid grid-cols-[40px_2fr_1.2fr_1fr_1fr_1.2fr_1fr_1.2fr] gap-4 px-6 py-3 bg-muted/50 text-muted-foreground font-medium text-sm border-b">
                    <div className="flex items-center justify-center">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={activeSubscriptions.length > 0 && selectedIds.length === activeSubscriptions.length}
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
                <div className="divide-y divide-border">
                    {activeSubscriptions.map((sub) => (
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
        </div>
    );
}
