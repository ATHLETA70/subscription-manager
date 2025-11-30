"use client";

import { ArrowLeft, Calendar, FileText, Edit, Calculator, Clock } from "lucide-react";
import Link from "next/link";
import { CancellationNav } from "@/components/cancellation/cancellation-nav";
import { RegistrationNav } from "@/components/registration/registration-nav";
import { createClient } from "@/lib/supabase/client";
import { notFound, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

import { getCancellationInfo, CancellationInfo } from "@/actions/cancellation";
import { getRegistrationInfo, RegistrationInfo } from "@/actions/registration";
import { toast } from "sonner";
import { AIProcessingOverlay, AIProcessingStatus } from "@/components/ui/ai-processing-overlay";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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
    const [registrationData, setRegistrationData] = useState<RegistrationInfo | null>(null);
    const [analyzingStatus, setAnalyzingStatus] = useState<AIProcessingStatus>("idle");

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

            // 2. Fetch appropriate info based on status
            const isInactive = subData.status === 'inactive' || subData.status === '解約中' || subData.status === '解約済';

            if (isInactive) {
                // Fetch registration info for cancelled subscriptions
                try {
                    const regInfo = await getRegistrationInfo(subData.name, subData.id);
                    if (regInfo) {
                        setRegistrationData(regInfo);
                    }
                } catch (err) {
                    console.error("Failed to fetch registration info:", err);
                }
            } else {
                // Fetch cancellation info for active subscriptions
                // First check if we already have it in the subscription record
                if (subData.cancellation_info) {
                    setCancellationData(subData.cancellation_info);
                } else {
                    // If not, fetch it and save it to the subscription
                    try {
                        const info = await getCancellationInfo(subData.name, subData.id);
                        if (info) {
                            setCancellationData(info);
                            // Update local state to reflect the change immediately
                            setSub({ ...subData, cancellation_info: info });
                        }
                    } catch (err) {
                        console.error("Failed to fetch cancellation info:", err);
                    }
                }
            }

            setLoading(false);
        }

        fetchData();
    }, [id]);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!sub) {
        return <div className="p-8 text-center">サブスクリプションが見つかりません</div>;
    }

    // Use dynamic data or fallback
    const baseData = cancellationData || DEFAULT_CANCELLATION_INFO;
    const finalCancellationData = {
        ...baseData,
        cancellation_url: sub.cancellation_url || baseData.cancellation_url
    };


    // Format display values
    const displayCycle = sub.cycle === "monthly" ? "月額" : "年額";
    const displayAmount = `¥${sub.amount.toLocaleString()}`;
    const displayNextBilling = sub.next_payment_date || "未設定";

    // Calculate payment statistics
    const firstPaymentDate = new Date(sub.first_payment_date || sub.created_at);
    const today = new Date();
    const daysElapsed = Math.floor(
        (today.getTime() - firstPaymentDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const monthsElapsed = Math.max(0, Math.floor(
        (today.getTime() - firstPaymentDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    ));
    const totalPayment = sub.amount * monthsElapsed;

    // Generate monthly payment history
    const paymentHistory = [];
    for (let i = 0; i < monthsElapsed; i++) {
        const date = new Date(firstPaymentDate);
        date.setMonth(date.getMonth() + i);
        paymentHistory.push({
            month: `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月`,
            amount: sub.amount
        });
    }
    // Reverse to show most recent first
    paymentHistory.reverse();

    // Check if subscription is active or cancelled
    const isActive = sub.status === 'active' || sub.status === '利用中' || sub.status === 'trial';
    const isCancelled = sub.status === 'inactive' || sub.status === '解約中';

    return (
        <div className="max-w-2xl mx-auto space-y-5 pb-20">
            <AIProcessingOverlay status={analyzingStatus} serviceName={sub.name} />

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
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border bg-card space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Calendar className="w-4 h-4" /> 次回請求日
                    </div>
                    <div className="font-semibold text-lg">{displayNextBilling}</div>
                </div>
                <div className="p-3.5 rounded-xl border bg-card space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        ステータス
                    </div>
                    <div className="flex items-center gap-2">
                        {(sub.status === 'active' || sub.status === '利用中') && (
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
                        {(sub.status === 'cancelled' || sub.status === 'inactive' || sub.status === '解約済' || sub.status === '解約中') && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                                <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                                {sub.status === '解約中' ? '解約中' : '解約済み'}
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

            {/* Payment Statistics Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Total Payment Card */}
                <div className="p-3.5 rounded-xl border bg-card space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Calculator className="w-4 h-4" /> 累計支払い総額
                    </div>
                    <div className="font-semibold text-lg">
                        ¥{totalPayment.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {monthsElapsed}ヶ月分
                    </div>
                </div>

                {/* Days Elapsed Card */}
                <div className="p-3.5 rounded-xl border bg-card space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Clock className="w-4 h-4" /> 初回支払いからの経過
                    </div>
                    <div className="font-semibold text-lg">
                        {daysElapsed}日
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {firstPaymentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}から
                    </div>
                </div>
            </div>

            {/* Memo Card */}
            <div className="p-3.5 rounded-xl border bg-card space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <FileText className="w-4 h-4" /> メモ
                </div>
                <div className="font-medium text-base whitespace-pre-wrap">{sub.memo || 'メモなし'}</div>
            </div>

            {/* Payment History Section */}
            {monthsElapsed > 0 && (
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">支払い履歴</h3>
                    <div className="p-4 rounded-xl border bg-card max-h-80 overflow-y-auto">
                        <div className="space-y-0">
                            {paymentHistory.map((entry, index) => (
                                <div
                                    key={index}
                                    className="flex justify-between items-center py-2 border-b border-white/5 dark:border-white/5 last:border-0"
                                >
                                    <span className="text-sm text-muted-foreground">
                                        {entry.month}
                                    </span>
                                    <span className="font-medium">
                                        ¥{entry.amount.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <hr className="border-border" />

            {/* Conditional Assistant - Show different content based on status */}
            <section className="space-y-4">
                {isActive ? (
                    <>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">解約アシスタント</h2>
                            <button
                                onClick={async () => {
                                    setAnalyzingStatus("processing");
                                    try {
                                        const { refreshCancellationInfo } = await import("@/actions/cancellation");
                                        // Pass subscription ID to force update specific record
                                        const newData = await refreshCancellationInfo(sub.name, sub.id);

                                        if (newData) {
                                            setAnalyzingStatus("success");
                                            // Wait for success animation
                                            await new Promise(resolve => setTimeout(resolve, 3000));

                                            setCancellationData(newData);
                                            // Update local state
                                            setSub({ ...sub, cancellation_info: newData });
                                            toast.success("情報を更新しました");
                                        } else {
                                            setAnalyzingStatus("error");
                                            await new Promise(resolve => setTimeout(resolve, 3000));
                                            toast.error("情報の取得に失敗しました");
                                        }
                                    } catch (e) {
                                        setAnalyzingStatus("error");
                                        await new Promise(resolve => setTimeout(resolve, 3000));
                                        toast.error("エラーが発生しました");
                                    } finally {
                                        setAnalyzingStatus("idle");
                                    }
                                }}
                                className="text-xs text-muted-foreground hover:text-primary underline"
                            >
                                情報が正しくないですか？再取得
                            </button>
                        </div>

                        {/* Only if the service is cancellable (e.g. not Rent or Utilities) */}
                        <CancellationNav
                            serviceName={sub.name}
                            cancelUrl={finalCancellationData.cancellation_url}
                            steps={finalCancellationData.steps}
                            requiredInfo={finalCancellationData.required_info}
                            onUpdateUrl={async (newUrl: string) => {
                                const toastId = toast.loading("URLを保存中...");
                                try {
                                    const { updateCancellationUrl } = await import("@/actions/cancellation");
                                    // Use the new action that updates cancellation_info JSON
                                    const success = await updateCancellationUrl(sub.id, newUrl);

                                    if (success) {
                                        // Update local state
                                        const newInfo = { ...finalCancellationData, cancellation_url: newUrl };
                                        setCancellationData(newInfo);
                                        setSub({ ...sub, cancellation_info: newInfo });
                                        toast.success("URLを保存しました", { id: toastId });
                                    } else {
                                        toast.error("保存に失敗しました", { id: toastId });
                                    }
                                } catch (e) {
                                    toast.error("エラーが発生しました", { id: toastId });
                                }
                            }}
                        />

                        {/* Debug Logs */}
                        {(() => {
                            console.log('[Detail Page] cancellationData:', cancellationData);
                            console.log('[Detail Page] debugLogs:', cancellationData?.debugLogs);
                            return null;
                        })()}
                    </>
                ) : isCancelled ? (
                    // Show registration assistant for cancelled subscriptions
                    <>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">再登録アシスタント</h2>
                            <button
                                onClick={async () => {
                                    setAnalyzingStatus("processing");
                                    try {
                                        const { refreshRegistrationInfo } = await import("@/actions/registration");
                                        const newData = await refreshRegistrationInfo(sub.name, sub.id);

                                        if (newData) {
                                            setAnalyzingStatus("success");
                                            await new Promise(resolve => setTimeout(resolve, 3000));

                                            setRegistrationData(newData);
                                            // Update local state
                                            setSub({ ...sub, registration_info: newData });
                                            toast.success("情報を更新しました");
                                        } else {
                                            setAnalyzingStatus("error");
                                            await new Promise(resolve => setTimeout(resolve, 3000));
                                            toast.error("情報の取得に失敗しました");
                                        }
                                    } catch (e) {
                                        setAnalyzingStatus("error");
                                        await new Promise(resolve => setTimeout(resolve, 3000));
                                        toast.error("エラーが発生しました");
                                    } finally {
                                        setAnalyzingStatus("idle");
                                    }
                                }}
                                className="text-xs text-muted-foreground hover:text-primary underline"
                            >
                                情報が正しくないですか？再取得
                            </button>
                        </div>
                        <RegistrationNav
                            serviceName={sub.name}
                            registrationUrl={registrationData?.registration_url || ""}
                            hasFreeTrial={registrationData?.has_free_trial}
                            trialPeriod={registrationData?.trial_period}
                            notes={registrationData?.notes}
                            onUpdateUrl={async (newUrl: string) => {
                                const toastId = toast.loading("URLを更新中...");
                                try {
                                    const { updateRegistrationUrl } = await import("@/actions/registration");
                                    const success = await updateRegistrationUrl(sub.id, newUrl);
                                    if (success) {
                                        setRegistrationData({
                                            ...registrationData,
                                            registration_url: newUrl,
                                            verified: true,
                                        } as RegistrationInfo);
                                        // Update local state
                                        setSub({ ...sub, registration_info: { ...registrationData, registration_url: newUrl, verified: true } });
                                        toast.success("URLを更新しました", { id: toastId });
                                    } else {
                                        toast.error("更新に失敗しました", { id: toastId });
                                    }
                                } catch (e) {
                                    toast.error("エラーが発生しました", { id: toastId });
                                }
                            }}
                        />
                    </>
                ) : null}
            </section>
        </div >
    );
}

export default function SubscriptionDetailPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <SubscriptionDetailContent />
        </Suspense>
    );
}
