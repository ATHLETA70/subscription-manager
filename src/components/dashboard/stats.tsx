import { DollarSign, TrendingUp, CreditCard, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

import { Subscription } from "@/types/subscription";

export function DashboardStats({ subscriptions }: { subscriptions: Subscription[] }) {
    // Calculate stats dynamically
    const activeSubs = subscriptions.filter(sub => sub.status === "active" || sub.status === "利用中");
    const monthlyTotal = activeSubs.reduce((acc, sub) => {
        // Handle both string (mock) and number (db) formats for amount
        const amount = typeof sub.amount === 'string' ? parseInt(sub.amount.replace(/[^0-9]/g, "")) : sub.amount;
        return sub.cycle === "月額" || sub.cycle === "monthly" ? acc + amount : acc + Math.round(amount / 12);
    }, 0);

    const yearlyTotal = monthlyTotal * 12;
    const cancelledCount = subscriptions.length - activeSubs.length;

    // Calculate cancellation candidates (duplicate categories)
    const categoryCounts = activeSubs.reduce((acc, sub) => {
        acc[sub.category] = (acc[sub.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const duplicateCategories = Object.keys(categoryCounts).filter(cat => categoryCounts[cat] > 1);
    const candidateCount = activeSubs.filter(sub => duplicateCategories.includes(sub.category)).length;

    const stats = [
        {
            title: "今月の支払総額",
            value: `¥${monthlyTotal.toLocaleString()}`,
            change: "先月から +¥980",
            icon: DollarSign,
            trend: "up",
        },
        {
            title: "年間支払予測",
            value: `¥${yearlyTotal.toLocaleString()}`,
            change: "現在の契約に基づく",
            icon: TrendingUp,
            trend: "neutral",
        },
        {
            title: "契約中のサブスク",
            value: activeSubs.length.toString(),
            change: `更新間近: 2件`,
            icon: CreditCard,
            trend: "neutral",
        },
        {
            title: "解約候補",
            value: candidateCount.toString(),
            change: `カテゴリ被り: ${duplicateCategories.length}件`,
            icon: AlertCircle,
            trend: "down",
            alert: candidateCount > 0,
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={index}
                        className={cn(
                            "p-3 md:p-6 rounded-xl md:rounded-2xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
                            stat.alert && "border-yellow-500/50 bg-yellow-500/5"
                        )}
                    >
                        <div className="flex items-center justify-between space-y-0 pb-1 md:pb-2">
                            <p className="text-xs md:text-sm font-medium text-muted-foreground truncate mr-1">
                                {stat.title}
                            </p>
                            <Icon className={cn("h-3 w-3 md:h-4 md:w-4 flex-shrink-0", stat.alert ? "text-yellow-500" : "text-muted-foreground")} />
                        </div>
                        <div className="flex flex-col gap-0.5 md:gap-1">
                            <div className="text-lg md:text-2xl font-bold">{stat.value}</div>
                            <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                                {stat.change}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
