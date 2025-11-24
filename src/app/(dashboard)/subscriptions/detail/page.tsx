"use client";

import { ArrowLeft, Calendar, FileText, Edit } from "lucide-react";
import Link from "next/link";
import { CancellationNav } from "@/components/cancellation/cancellation-nav";
import { UpgradeAssistant } from "@/components/upgrade/upgrade-assistant";
import { createClient } from "@/lib/supabase/client";
import { notFound, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

import { getCancellationInfo, CancellationInfo } from "@/actions/cancellation";
import { toast } from "sonner";

// Default fallback only
const DEFAULT_CANCELLATION_INFO: CancellationInfo = {
    cancellation_url: "",
    required_info: [{ label: "ログインメールアドレス", value: "user@example.com" }],
    steps: [
        { id: 1, label: "サービスにログイン", description: "登録したアカウントでログイン" },
        { id: 2, label: "アカウント設定へ移動", description: "設定やアカウント管理ページを探す" },
        { id: 3, label: "解約オプションを探す", description: "通常「プラン」や「サブスクリプション」セクションにあります" },
        { id: 4, label: "解約手続きを完了", description: "画面の指示に従って解約します" },
    ],
};

function SubscriptionDetailContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const [sub, setSub] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [cancellationData, setCancellationData] = useState<CancellationInfo | null>(null);

    useEffect(() => {
        async function fetchData() {
            if (!id) return;
            const supabase = createClient();

            // 1. Fetch Subscription
            const { data: subData, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !subData) {
                console.error(error);
                setLoading(false);
                return;
            }

            setSub(subData);

            // 2. Fetch Cancellation Info (Dynamic)
            try {
                const info = await getCancellationInfo(subData.name);
                if (info) {
                    setCancellationData(info);
                }
            } catch (err) {
                console.error("Failed to fetch cancellation info:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [id]);

    if (loading) {
        return <div className="p-8 text-center">読み込み中...</div>;
    }

    if (!sub) {
        return <div className="p-8 text-center">サブスクリプションが見つかりません</div>;
    }

    // Use dynamic data or fallback
    const finalCancellationData = cancellationData || DEFAULT_CANCELLATION_INFO;


    // Format display values
    const displayCycle = sub.cycle === "monthly" ? "月額" : "年額";
    const displayAmount = `¥${sub.amount.toLocaleString()}`;
    const displayNextBilling = sub.next_payment_date || "未設定";

    // Check if subscription is active or cancelled
    const isActive = sub.status === 'active' || sub.status === '利用中';
    const isCancelled = sub.status === 'inactive' || sub.status === '解約中';

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="space-y-4">
                <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" /> ダッシュボードに戻る
                </Link>

                <div className="flex items-center gap-4">
                    {sub.image_url ? (
                        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg overflow-hidden p-2">
                            <img src={sub.image_url} alt={sub.name} className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg bg-primary">
                            {sub.name.charAt(0)}
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{sub.name}</h1>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <span className="px-2 py-0.5 rounded-md bg-secondary text-xs font-medium">{displayCycle}</span>
                            <span>•</span>
                            <span className="font-medium text-foreground">{displayAmount}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Button */}
            <Link
                href={`/subscriptions/edit?id=${sub.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4"
            >
                <Edit className="w-4 h-4" />
                編集する
            </Link>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-card space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Calendar className="w-4 h-4" /> 次回請求日
                    </div>
                    <div className="font-semibold text-lg">{displayNextBilling}</div>
                </div>
                <div className="p-4 rounded-xl border bg-card space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        ステータス
                    </div>
                    <div className="flex items-center gap-2">
                        {sub.status === 'active' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                                <div className="w-2 h-2 rounded-full bg-green-600"></div>
                                有効
                            </span>
                        )}
                        {sub.status === 'trial' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                トライアル中
                            </span>
                        )}
                        {sub.status === 'cancelled' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                                <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                                解約済み
                            </span>
                        )}
                        {sub.status === 'paused' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                                <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                                一時停止
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Memo Card */}
            <div className="p-4 rounded-xl border bg-card space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <FileText className="w-4 h-4" /> メモ
                </div>
                <div className="font-medium text-base whitespace-pre-wrap">{sub.memo || 'メモなし'}</div>
            </div>

            <hr className="border-border" />

            {/* Conditional Assistant - Show different content based on status */}
            <section className="space-y-4">
                {isActive ? (
                    <>
                        <div className="flex items-center justify between">
                            <h2 className="text-xl font-semibold">解約アシスタント</h2>
                            <button
                                onClick={async () => {
                                    const toastId = toast.loading("情報を更新中...");
                                    try {
                                        const { refreshCancellationInfo } = await import("@/actions/cancellation");
                                        const newData = await refreshCancellationInfo(sub.name);
                                        if (newData) {
                                            setCancellationData(newData);
                                            toast.success("情報を更新しました", { id: toastId });
                                        } else {
                                            toast.error("情報の取得に失敗しました", { id: toastId });
                                        }
                                    } catch (e) {
                                        toast.error("エラーが発生しました", { id: toastId });
                                    }
                                }}
                                className="text-xs text-muted-foreground hover:text-primary underline"
                            >
                                情報が正しくないですか？再取得
                            </button>
                        </div>

                        {/* Only if the service is cancellable (e.g. not Rent or Utilities) */}
                        {(finalCancellationData.is_cancellable !== false) && (
                            <CancellationNav
                                serviceName={sub.name}
                                cancelUrl={finalCancellationData.cancellation_url}
                                steps={finalCancellationData.steps}
                                requiredInfo={finalCancellationData.required_info}
                                onUpdateUrl={async (newUrl: string) => {
                                    const toastId = toast.loading("URLを更新中...");
                                    try {
                                        const { updateCancellationUrl } = await import("@/actions/cancellation");
                                        const success = await updateCancellationUrl(sub.name, newUrl);
                                        if (success) {
                                            setCancellationData({
                                                ...finalCancellationData,
                                                cancellation_url: newUrl,
                                                user_verified: true,
                                            });
                                            toast.success("URLを更新しました", { id: toastId });
                                        } else {
                                            toast.error("更新に失敗しました", { id: toastId });
                                        }
                                    } catch (e) {
                                        toast.error("エラーが発生しました", { id: toastId });
                                    }
                                }}
                            />
                        )}
                    </>
                ) : isCancelled ? (
                    // Show upgrade assistant for cancelled subscriptions
                    <>
                        <h2 className="text-xl font-semibold mb-4">有料アシスタント</h2>
                        <UpgradeAssistant serviceName={sub.name} />
                    </>
                ) : null}
            </section>
        </div >
    );
}

export default function SubscriptionDetailPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">読み込み中...</div>}>
            <SubscriptionDetailContent />
        </Suspense>
    );
}
