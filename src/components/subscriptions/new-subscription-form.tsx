"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getCancellationInfo } from "@/actions/cancellation";
import { userPlan } from "@/lib/user-plan";

export function NewSubscriptionForm() {
    const router = useRouter();
    const [status, setStatus] = useState<'idle' | 'saving' | 'investigating' | 'success'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState('active');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus('saving');
        setError(null);

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const amountStr = formData.get("amount") as string;
        const cycle = formData.get("cycle") as string;
        const category = formData.get("category") as string;
        const billingDate = formData.get("billingDate") as string;
        // subscriptionStatus state is used instead of getting from formData directly for consistency

        // Parse amount (remove ¥ and commas)
        let amount = parseInt(amountStr.replace(/[^0-9]/g, ""));

        // トライアルの場合は金額が未入力なら0とする
        if (subscriptionStatus === 'trial' && isNaN(amount)) {
            amount = 0;
        }

        // バリデーション: トライアルの場合は金額と周期のチェックをスキップ
        if (!name || !category || !billingDate) {
            setError("必須フィールド（サービス名、カテゴリ、日付）を入力してください");
            setStatus('idle');
            return;
        }

        if (subscriptionStatus !== 'trial') {
            if (isNaN(amount) || !cycle) {
                setError("金額と支払い周期を入力してください");
                setStatus('idle');
                return;
            }
        }

        try {
            const supabase = createClient();
            let userId: string;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError("ログインが必要です");
                setStatus('idle');
                return;
            }
            userId = user.id;

            // Check subscription limit for free plan (本番のみ)
            if (userPlan.type === 'free') {
                const { count, error: countError } = await supabase
                    .from("subscriptions")
                    .select("*", { count: 'exact', head: true })
                    .eq("user_id", userId)
                    .neq("status", "deleted");

                if (countError) throw countError;

                if (count !== null && count >= userPlan.limit) {
                    setError(`フリープランでは最大${userPlan.limit}つまでしか登録できません。プレミアムプランにアップグレードしてください。`);
                    setStatus('idle');
                    return; // Added return to stop execution if limit is reached
                }
            }

            const { error: insertError } = await supabase
                .from("subscriptions")
                .insert({
                    user_id: userId,
                    name,
                    amount,
                    cycle: cycle || 'monthly', // トライアル時はデフォルトでmonthly
                    category,
                    first_payment_date: billingDate,
                    next_payment_date: billingDate,
                    status: subscriptionStatus,
                });

            if (insertError) throw insertError;

            // Step 2: Investigate cancellation info
            setStatus('investigating');

            try {
                await getCancellationInfo(name);
            } catch (fetchError) {
                console.error("Failed to fetch cancellation info:", fetchError);
                // Continue even if this fails, but maybe log it
            }

            // Step 3: Success
            setStatus('success');

            // Wait a bit for the user to see the success message
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Force a hard refresh/navigation to ensure data is visible
            router.refresh();
            router.push('/dashboard');

        } catch (error) {
            console.error("Error adding subscription:", error);
            setError("サブスクリプションの追加に失敗しました。もう一度お試しください。");
            setStatus('idle');
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20 relative">
            {/* Loading Overlay */}
            {status !== 'idle' && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border shadow-lg rounded-xl p-8 max-w-md w-full space-y-6 text-center">
                        {status === 'saving' && (
                            <>
                                <div className="flex justify-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-semibold">データを保存しています...</h3>
                                    <p className="text-muted-foreground text-sm">しばらくお待ちください</p>
                                </div>
                            </>
                        )}
                        {status === 'investigating' && (
                            <>
                                <div className="flex justify-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-semibold">解約情報を調査中</h3>
                                    <p className="text-muted-foreground text-sm">
                                        AI解約アシスタントが「{document.getElementById('name') ? (document.getElementById('name') as HTMLInputElement).value : 'サービス'}」の解約ページURLを調査しています...
                                    </p>
                                </div>
                            </>
                        )}
                        {status === 'success' && (
                            <>
                                <div className="flex justify-center">
                                    <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-semibold">登録が完了しました！</h3>
                                    <p className="text-muted-foreground text-sm">ダッシュボードに移動します</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="space-y-4">
                <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" /> ダッシュボードに戻る
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">サブスクリプションを登録</h1>
                <p className="text-muted-foreground">
                    管理したいサブスクリプションの情報を入力してください。
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
                            placeholder="例: Netflix, Spotify"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                                placeholder="1000"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        {subscriptionStatus !== 'trial' && (
                            <div className="grid gap-2">
                                <label htmlFor="cycle" className="text-sm font-medium">支払い周期 *</label>
                                <select
                                    id="cycle"
                                    name="cycle"
                                    required
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
                            <select
                                id="category"
                                name="category"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                onChange={(e) => {
                                    if (e.target.value === 'custom') {
                                        setIsCustomCategory(true);
                                    }
                                }}
                            >
                                <option value="">カテゴリを選択</option>
                                <option value="エンタメ">エンタメ</option>
                                <option value="音楽">音楽</option>
                                <option value="仕事効率化">仕事効率化</option>
                                <option value="ショッピング">ショッピング</option>
                                <option value="スポーツ">スポーツ</option>
                                <option value="その他">その他</option>
                                <option value="custom">＋ 新しいカテゴリを入力...</option>
                            </select>
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
                        <label htmlFor="billingDate" className="text-sm font-medium">
                            {subscriptionStatus === 'trial' ? 'トライアル終了日' : '初回請求日'} *
                        </label>
                        <input
                            id="billingDate"
                            name="billingDate"
                            type="date"
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="status" className="text-sm font-medium">契約種別 *</label>
                        <select
                            id="status"
                            name="status"
                            required
                            value={subscriptionStatus}
                            onChange={(e) => setSubscriptionStatus(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="active">有料契約</option>
                            <option value="trial">トライアル</option>
                        </select>
                        <p className="text-xs text-muted-foreground">
                            トライアル期間中の場合は「トライアル」を選択してください
                        </p>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={status !== 'idle'}
                        className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
                    >
                        {status !== 'idle' ? (
                            <>処理中...</>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" /> 保存する
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
