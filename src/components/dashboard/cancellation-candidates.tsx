import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Subscription } from "@/types/subscription";

export function CancellationCandidates({ subscriptions }: { subscriptions: Subscription[] }) {
    // Calculate subscriptions due within next 7 days
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const candidates = subscriptions
        .filter(sub => {
            // Only active subscriptions
            if (sub.status !== 'active' && sub.status !== '利用中') return false;
            if (!sub.next_payment_date) return false;

            const nextDate = new Date(sub.next_payment_date);
            return nextDate >= now && nextDate <= sevenDaysFromNow;
        })
        .sort((a, b) => {
            // Type assertion safe because filter ensures next_payment_date is not null
            const dateA = new Date(a.next_payment_date!);
            const dateB = new Date(b.next_payment_date!);
            return dateA.getTime() - dateB.getTime();
        });

    if (candidates.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-semibold tracking-tight">解約候補</h2>
                <span className="text-sm text-muted-foreground">
                    (7日以内に請求予定)
                </span>
            </div>

            {/* Mobile View (Cards) */}
            <div className="grid gap-2 md:hidden">
                {candidates.map((sub) => {
                    const daysUntil = Math.ceil(
                        (new Date(sub.next_payment_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                        <Link
                            href={`/subscriptions/${sub.id}`}
                            key={sub.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-orange-500/20 bg-orange-500/5 shadow-sm active:scale-95 transition-transform"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-orange-500/20 shrink-0">
                                    {sub.image_url ? (
                                        <img
                                            src={sub.image_url}
                                            alt={sub.name}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                                            {sub.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-medium">{sub.name}</div>
                                    <div className="text-[10px] text-muted-foreground">
                                        ¥{typeof sub.amount === 'number' ? sub.amount.toLocaleString() : sub.amount}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-orange-500">{daysUntil}日後</div>
                                <div className="text-[10px] text-muted-foreground">{sub.next_payment_date}</div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Desktop View (Table) */}
            <div className="hidden md:block rounded-xl border border-orange-500/20 bg-orange-500/5 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-orange-500/10 text-muted-foreground font-medium border-b border-orange-500/20">
                        <tr>
                            <th className="px-6 py-3">サービス名</th>
                            <th className="px-6 py-3">カテゴリ</th>
                            <th className="px-6 py-3">金額</th>
                            <th className="px-6 py-3">次回請求日</th>
                            <th className="px-6 py-3">残り日数</th>
                            <th className="px-6 py-3 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-500/10">
                        {candidates.map((sub) => {
                            const daysUntil = Math.ceil(
                                (new Date(sub.next_payment_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                            );
                            return (
                                <tr key={sub.id} className="hover:bg-orange-500/10 transition-colors group cursor-pointer">
                                    <td className="px-6 py-4">
                                        <Link href={`/subscriptions/${sub.id}`} className="flex items-center gap-3">
                                            {sub.image_url ? (
                                                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-orange-500/20 shrink-0 p-1.5">
                                                    <img
                                                        src={sub.image_url}
                                                        alt={sub.name}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                    {sub.name.charAt(0)}
                                                </div>
                                            )}
                                            <span className="font-medium group-hover:text-orange-600 transition-colors">{sub.name}</span>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">{sub.category}</td>
                                    <td className="px-6 py-4 font-medium">¥{typeof sub.amount === 'number' ? sub.amount.toLocaleString() : sub.amount}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{sub.next_payment_date}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/20 text-orange-600">
                                            {daysUntil}日後
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/subscriptions/${sub.id}`}
                                            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border border-orange-500/20 bg-background hover:bg-orange-500/10 hover:text-orange-600 transition-colors whitespace-nowrap"
                                        >
                                            詳細 / 解約
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
