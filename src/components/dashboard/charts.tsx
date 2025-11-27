"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { cn } from "@/lib/utils";

import { Subscription } from "@/types/subscription";

// ... (keep data calculation logic same as before) ...
// Calculate category data
export function DashboardCharts({ subscriptions }: { subscriptions: Subscription[] }) {
    const [activeTab, setActiveTab] = useState<'service' | 'category_trend'>('service');
    const [monthRange, setMonthRange] = useState<3 | 6 | 12>(6);

    // 1. Pie Chart Data: Active Subscriptions by Service Name
    const serviceData = subscriptions
        .filter(sub => {
            // ステータスチェック: 契約中またはトライアル中のみ
            const isActiveStatus =
                sub.status === "active" ||
                sub.status === "利用中" ||
                sub.status === "trial";

            if (!isActiveStatus) return false;

            // 金額チェック: 1円以上のみ
            const amount = typeof sub.amount === 'string'
                ? parseInt(sub.amount.replace(/[^0-9]/g, ""))
                : sub.amount;

            return amount >= 1;
        })
        .map(sub => {
            const amount = typeof sub.amount === 'string' ? parseInt(sub.amount.replace(/[^0-9]/g, "")) : sub.amount;
            const monthlyAmount = sub.cycle === "月額" || sub.cycle === "monthly" ? amount : Math.round(amount / 12);
            return { name: sub.name, value: monthlyAmount, category: sub.category };
        })
        .sort((a, b) => b.value - a.value);

    const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280', '#ec4899', '#14b8a6'];

    // 2. Bar Chart Data: Monthly Trend Stacked by Category
    const categories = Array.from(new Set(subscriptions.map(sub => sub.category))).filter(Boolean);

    // Get current date for calculation
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-11
    const currentYear = currentDate.getFullYear();

    // Generate data for the selected month range
    const trendData = Array.from({ length: monthRange }, (_, i) => {
        const monthOffset = monthRange - 1 - i; // Start from (monthRange - 1) months ago
        const date = new Date(currentYear, currentMonth - monthOffset, 1);
        const monthName = `${date.getMonth() + 1}月`;

        // Format: YYYY-MM-DD for the first day of the month
        const monthStartDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;

        // Last day of the month for comparison
        const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const monthEndDate = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(nextMonth.getDate()).padStart(2, '0')}`;

        const monthData: Record<string, number | string> = { name: monthName };

        // Initialize all categories to 0
        categories.forEach(cat => {
            monthData[cat] = 0;
        });

        // Include subscriptions based on their first_payment_date and end_date
        subscriptions
            .filter(sub => {
                // 1. ステータスチェック: 契約中またはトライアル中のみ
                const isActiveStatus =
                    sub.status === 'active' ||
                    sub.status === '利用中' ||
                    sub.status === 'trial';

                if (!isActiveStatus) return false;

                // 2. 金額チェック: 1円以上のみ集計対象
                const amount = typeof sub.amount === 'string'
                    ? parseInt(sub.amount.replace(/[^0-9]/g, ""))
                    : sub.amount;

                if (!amount || amount < 1) return false;

                // 3. その月に契約が有効だったかチェック
                // 3-1. 開始日チェック
                if (sub.first_payment_date) {
                    // 契約開始日がこの月より後なら除外
                    if (sub.first_payment_date > monthEndDate) {
                        return false;
                    }
                }

                // 3-2. 終了日チェック
                if (sub.end_date) {
                    // 終了日がこの月より前なら除外
                    if (sub.end_date < monthStartDate) {
                        return false;
                    }
                }

                return true;
            })
            .forEach(sub => {
                const amount = typeof sub.amount === 'string'
                    ? parseInt(sub.amount.replace(/[^0-9]/g, ""))
                    : sub.amount;

                let amountToCount = 0;

                // 月額の場合: 毎月全額計上
                if (sub.cycle === '月額' || sub.cycle === 'monthly') {
                    amountToCount = amount;
                } else {
                    // 年額の場合: 実際の請求月のみ計上
                    let shouldCountThisMonth = false;

                    // next_payment_date がこの月の範囲内にあるかチェック
                    if (sub.next_payment_date &&
                        sub.next_payment_date >= monthStartDate &&
                        sub.next_payment_date <= monthEndDate) {
                        shouldCountThisMonth = true;
                    } else if (sub.first_payment_date) {
                        // next_payment_date がない場合、first_payment_date の月と同じかチェック
                        const firstDate = new Date(sub.first_payment_date);
                        const currentMonthDate = new Date(monthStartDate);

                        // 年と月が一致する場合のみ計上
                        if (firstDate.getFullYear() === currentMonthDate.getFullYear() &&
                            firstDate.getMonth() === currentMonthDate.getMonth()) {
                            shouldCountThisMonth = true;
                        }
                    }

                    if (shouldCountThisMonth) {
                        amountToCount = amount; // 年額を全額計上
                    }
                }

                // カテゴリ別に集計
                if (amountToCount > 0 && sub.category && categories.includes(sub.category)) {
                    const currentAmount = typeof monthData[sub.category] === 'number'
                        ? monthData[sub.category] as number
                        : 0;
                    monthData[sub.category] = currentAmount + amountToCount;
                }
            });

        return monthData;
    });


    return (
        <div className="space-y-4">
            {/* Mobile Tabs */}
            <div className="flex p-1 bg-muted rounded-lg md:hidden">
                <button
                    onClick={() => setActiveTab('service')}
                    className={cn(
                        "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                        activeTab === 'service' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    サービス別
                </button>
                <button
                    onClick={() => setActiveTab('category_trend')}
                    className={cn(
                        "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                        activeTab === 'category_trend' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    カテゴリ推移
                </button>
            </div>

            {/* Desktop Grid / Mobile Active Tab */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Pie Chart: Active Subscriptions */}
                <div className={cn("p-3 md:p-6 rounded-xl border bg-card shadow-sm", activeTab === 'service' ? "block" : "hidden md:block")}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">当月の契約中のサブスクリプション (月額)</h3>
                    <div className="h-[280px] md:h-[350px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 40, right: 20, bottom: 20, left: 20 }}>
                                <Pie
                                    data={serviceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="55%"
                                    outerRadius="70%"
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ cx, cy, midAngle, outerRadius, percent, fill }: {
                                        cx?: number;
                                        cy?: number;
                                        midAngle?: number;
                                        outerRadius?: number;
                                        percent?: number;
                                        fill?: string;
                                    }) => {
                                        if (!midAngle || !percent || !cx || !cy || !outerRadius || !fill) return null;
                                        const RADIAN = Math.PI / 180;
                                        const radius = outerRadius + 25;
                                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                        return (
                                            <text
                                                x={x}
                                                y={y}
                                                fill={fill}
                                                textAnchor={x > cx ? 'start' : 'end'}
                                                dominantBaseline="central"
                                                className="text-xs font-medium"
                                            >
                                                {`${(percent * 100).toFixed(0)}%`}
                                            </text>
                                        );
                                    }}
                                    labelLine={{
                                        stroke: 'hsl(var(--border))',
                                        strokeWidth: 1,
                                    }}
                                >
                                    {serviceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload || !payload.length) return null;
                                        const data = payload[0].payload;

                                        return (
                                            <div className="relative z-50 bg-card border border-border rounded-lg shadow-xl p-3 min-w-[150px]">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full"
                                                        style={{ backgroundColor: data.fill }}
                                                    />
                                                    <p className="font-semibold text-sm text-foreground">
                                                        {data.name}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between gap-4 text-xs">
                                                    <span className="text-muted-foreground">金額</span>
                                                    <span className="font-medium text-foreground tabular-nums">
                                                        ¥{data.value.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }}
                                    cursor={{ fill: 'rgba(128, 128, 128, 0.15)' }}
                                    wrapperStyle={{ outline: 'none', zIndex: 100 }}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', top: 0 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-12">
                            <div className="text-xs md:text-sm font-medium text-muted-foreground mb-1">今月の合計</div>
                            <div className="text-2xl md:text-3xl font-bold tracking-tight">
                                ¥{serviceData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>


                {/* Bar Chart: Category Trend */}
                <div className={cn("p-3 md:p-6 rounded-xl border bg-card shadow-sm", activeTab === 'category_trend' ? "block" : "hidden md:block")}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground">カテゴリ別支出の推移</h3>
                        <select
                            value={monthRange}
                            onChange={(e) => setMonthRange(parseInt(e.target.value) as 3 | 6 | 12)}
                            className="text-xs px-2 py-1 rounded-md border border-input bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            <option value={3}>3ヶ月</option>
                            <option value={6}>6ヶ月</option>
                            <option value={12}>12ヶ月</option>
                        </select>
                    </div>
                    <div className="h-[200px] md:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <XAxis
                                    dataKey="name"
                                    stroke="#888888"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `¥${value}`}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload || !payload.length) return null;

                                        return (
                                            <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
                                                <p className="font-semibold text-sm mb-2 text-foreground">
                                                    {payload[0].payload.name}
                                                </p>
                                                <div className="space-y-1.5">
                                                    {payload.map((entry: { name: string; value: number; color: string }, index: number) => (
                                                        <div key={index} className="flex items-center justify-between gap-4 text-xs">
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className="w-2.5 h-2.5 rounded-full"
                                                                    style={{ backgroundColor: entry.color }}
                                                                />
                                                                <span className="text-muted-foreground">{entry.name}</span>
                                                            </div>
                                                            <span className="font-medium text-foreground tabular-nums">
                                                                ¥{entry.value.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }}
                                    cursor={{ fill: 'rgba(128, 128, 128, 0.15)' }}
                                />
                                <Legend
                                    verticalAlign="top"
                                    height={36}
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                                    formatter={(value) => <span className="text-xs">{value}</span>}
                                />
                                {categories.map((category, index) => (
                                    <Bar
                                        key={category}
                                        dataKey={category}
                                        stackId="a"
                                        fill={COLORS[index % COLORS.length]}
                                        radius={index === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
