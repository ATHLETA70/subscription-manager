"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Subscription } from "@/types/subscription";
import { createCustomCategory } from "@/actions/categories";
import { CategorySelect } from "@/components/subscriptions/category-select";

export function EditSubscriptionForm({ subscription }: { subscription: Subscription }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState<string>(subscription.status || 'active');
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [category, setCategory] = useState(subscription.category || "");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const amountStr = formData.get("amount") as string;
        const cycle = formData.get("cycle") as string;
        let category = formData.get("category") as string;
        const nextBillingDate = formData.get("nextBillingDate") as string;
        const status = formData.get("status") as string;
        const memo = formData.get("memo") as string;

        // If custom category, save it to database first
        if (isCustomCategory && category) {
            const result = await createCustomCategory(category);
            if (!result.success) {
                setError(result.error || "カテゴリの作成に失敗しました");
                setLoading(false);
                return;
            }
        }

        // Parse amount (remove ¥ and commas)
        let amount = parseInt(amountStr.replace(/[^0-9]/g, ""));

        // トライアルの場合は金額が未入力なら0とする
        if (status === 'trial' && isNaN(amount)) {
            amount = 0;
        }

        // バリデーション: トライアルの場合は金額と周期のチェックをスキップ
        if (!name || !category) {
            setError("必須フィールド（サービス名、カテゴリ）を入力してください");
            setLoading(false);
            return;
        }

        if (status !== 'trial') {
            if (isNaN(amount) || !cycle) {
                setError("金額と支払い周期を入力してください");
                setLoading(false);
                return;
            }
        }

        try {
            const supabase = createClient();

            // Prepare update data
            const updateData = {
                name,
                amount,
                cycle: cycle || 'monthly', // トライアル時はデフォルトでmonthly
                category,
                next_payment_date: nextBillingDate || null,
                status,
            };

            // Add memo only if it exists in database (check migration)
            if (memo) {
                (updateData as Record<string, string | number | null>).memo = memo;
            }

            console.log("Updating subscription with ID:", subscription.id);
            console.log("Update data:", updateData);

            const { data, error: updateError } = await supabase
                .from("subscriptions")
                .update(updateData)
                .eq("id", subscription.id)
                .select();

            if (updateError) {
                console.error("Update error details:", {
                    message: updateError.message,
                    details: updateError.details,
                    hint: updateError.hint,
                    code: updateError.code,
                });
                throw updateError;
            }

            console.log("Update successful:", data);
            router.push(`/subscriptions/detail?id=${subscription.id}`);
            router.refresh();
        } catch (err: unknown) {
            console.error("Catch error:", err);
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
                            <label htmlFor="amount" className="text-sm font-medium">
                                金額 (円) {subscriptionStatus === 'trial' ? <span className="text-muted-foreground font-normal">(任意)</span> : '*'}
                            </label>
                            <input
                                id="amount"
                                name="amount"
                                type="number"
                                required={subscriptionStatus !== 'trial'}
                                defaultValue={typeof subscription.amount === 'number' ? subscription.amount : parseInt(String(subscription.amount).replace(/[^0-9]/g, '') || '0')}
                                placeholder="1000"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        {subscriptionStatus !== 'trial' && (
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
                        )}
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="category" className="text-sm font-medium">カテゴリ *</label>
                        {!isCustomCategory ? (
                            <>
                                <CategorySelect
                                    value={category}
                                    onValueChange={setCategory}
                                    onCustomCategoryMode={setIsCustomCategory}
                                    defaultValue={subscription.category}
                                />
                                {/* Hidden input to submit category value */}
                                <input type="hidden" name="category" value={category} />
                            </>
                        ) : (
                            <div className="flex gap-2 items-center">
                                <input
                                    id="category"
                                    name="category"
                                    type="text"
                                    required
                                    placeholder="カテゴリ名を入力 (例: 教育)"
                                    className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsCustomCategory(false)}
                                    className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border rounded-md hover:bg-accent whitespace-nowrap h-10"
                                >
                                    選択に戻る
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="nextBillingDate" className="text-sm font-medium">
                            {subscriptionStatus === 'trial' ? 'トライアル終了日' : '次回請求日'}
                        </label>
                        <input
                            id="nextBillingDate"
                            name="nextBillingDate"
                            type="date"
                            defaultValue={subscription.next_payment_date || ""}
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
                            value={subscriptionStatus}
                            onChange={(e) => setSubscriptionStatus(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="active">契約中</option>
                            <option value="trial">トライアル中</option>
                            <option value="inactive">解約済み</option>
                            {/* If the current status is not in the standard list, add it as an option */}
                            {subscription.status && ![
                                "active", "trial", "inactive"
                            ].includes(subscription.status) && (
                                    <option value={subscription.status}>{subscription.status}</option>
                                )}
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
