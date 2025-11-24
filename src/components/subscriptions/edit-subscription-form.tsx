"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

import { Subscription } from "@/lib/calendar-utils";

export function EditSubscriptionForm({ subscription }: { subscription: Subscription }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const amountStr = formData.get("amount") as string;
        const cycle = formData.get("cycle") as string;
        const category = formData.get("category") as string;
        const nextBillingDate = formData.get("nextBillingDate") as string;
        const status = formData.get("status") as string;

        const amount = parseInt(amountStr.replace(/[^0-9]/g, ""));

        if (!name || !amount || !cycle || !category) {
            setError("すべての必須フィールドを入力してください");
            setLoading(false);
            return;
        }

        try {
            const supabase = createClient();

            const { error: updateError } = await supabase
                .from("subscriptions")
                .update({
                    name,
                    amount,
                    cycle,
                    category,
                    next_payment_date: nextBillingDate || subscription.next_payment_date,
                    memo: formData.get("memo") as string,
                    status: status || subscription.status,
                })
                .eq("id", subscription.id);

            if (updateError) throw updateError;

            router.push(`/subscriptions/detail?id=${subscription.id}`);
            router.refresh();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "エラーが発生しました";
            setError(message);
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        setError(null);

        try {
            const supabase = createClient();

            const { error: deleteError } = await supabase
                .from("subscriptions")
                .delete()
                .eq("id", subscription.id);

            if (deleteError) throw deleteError;

            router.push("/dashboard");
            router.refresh();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "削除中にエラーが発生しました";
            setError(message);
            setDeleting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="space-y-4">
                <Link href={`/subscriptions/detail?id=${subscription.id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" /> 詳細に戻る
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">サブスクリプションを編集</h1>
                <p className="text-muted-foreground">
                    {subscription.name}の情報を更新します。
                </p>
            </div>

            {error && (
                <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <label htmlFor="name" className="text-sm font-medium">サービス名 *</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            defaultValue={subscription.name}
                            placeholder="例: Netflix, Spotify"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label htmlFor="amount" className="text-sm font-medium">金額 (円) *</label>
                            <input
                                id="amount"
                                name="amount"
                                type="number"
                                required
                                defaultValue={subscription.amount}
                                placeholder="1000"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="cycle" className="text-sm font-medium">支払い周期 *</label>
                            <select
                                id="cycle"
                                name="cycle"
                                required
                                defaultValue={subscription.cycle}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="monthly">月額</option>
                                <option value="yearly">年額</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="category" className="text-sm font-medium">カテゴリ *</label>
                        <select
                            id="category"
                            name="category"
                            required
                            defaultValue={subscription.category}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">カテゴリを選択</option>
                            <option value="entertainment">エンタメ</option>
                            <option value="music">音楽</option>
                            <option value="productivity">仕事効率化</option>
                            <option value="shopping">ショッピング</option>
                            <option value="sports">スポーツ</option>
                            <option value="other">その他</option>
                        </select>
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="nextBillingDate" className="text-sm font-medium">次回請求日</label>
                        <input
                            id="nextBillingDate"
                            name="nextBillingDate"
                            type="date"
                            defaultValue={subscription.next_payment_date}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="memo" className="text-sm font-medium">メモ</label>
                        <textarea
                            id="memo"
                            name="memo"
                            rows={3}
                            defaultValue={subscription.memo}
                            placeholder="契約に関するメモを入力..."
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                        />
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="status" className="text-sm font-medium">ステータス *</label>
                        <select
                            id="status"
                            name="status"
                            required
                            defaultValue={subscription.status || 'active'}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="active">有効</option>
                            <option value="trial">トライアル中</option>
                            <option value="cancelled">解約済み</option>
                            <option value="paused">一時停止</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
                    >
                        {loading ? (
                            <>処理中...</>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" /> 更新する
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={deleting}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 px-8"
                    >
                        <Trash2 className="w-4 h-4 mr-2" /> 削除
                    </button>
                </div>
            </form>

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border rounded-xl p-6 max-w-md w-full space-y-4">
                        <h3 className="text-lg font-semibold">本当に削除しますか？</h3>
                        <p className="text-sm text-muted-foreground">
                            {subscription.name}を削除すると、この操作は取り消せません。
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4"
                            >
                                {deleting ? "削除中..." : "削除する"}
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleting}
                                className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4"
                            >
                                キャンセル
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
