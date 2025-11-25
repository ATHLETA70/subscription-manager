"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    getCalendarDays,
    getSubscriptionsForDate,
    getYearMonthDisplay,
} from "@/lib/calendar-utils";
import { CalendarTooltip } from "@/components/ui/calendar-tooltip";
import { Subscription } from "@/types/subscription";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

// サブスクリプションアイコンコンポーネント
function SubscriptionIcon({ subscription }: { subscription: Subscription }) {
    const [imageError, setImageError] = useState(false);

    return (
        <Link
            href={`/subscriptions/detail?id=${subscription.id}`}
            className="flex flex-row items-center gap-1 md:gap-1.5 px-1 md:px-2 py-0.5 md:py-1 rounded-md shadow-sm group relative bg-card border border-border/40 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer w-full overflow-hidden"
            title={`${subscription.name} - ${subscription.amount}`}
        >
            {/* アイコン */}
            {subscription.image_url && !imageError ? (
                <div className="w-3.5 h-3.5 md:w-5 md:h-5 rounded bg-white flex items-center justify-center overflow-hidden p-0.5 shrink-0">
                    <img
                        src={subscription.image_url}
                        alt={subscription.name}
                        className="w-full h-full object-contain"
                        onError={() => setImageError(true)}
                    />
                </div>
            ) : (
                <div
                    className={cn(
                        "w-3.5 h-3.5 md:w-5 md:h-5 rounded flex items-center justify-center text-white text-[8px] md:text-[10px] font-bold shrink-0",
                        // Default color if none provided
                        "bg-primary"
                    )}
                >
                    {subscription.name.charAt(0)}
                </div>
            )}

            {/* サービス名 - 横並びで表示 */}
            <span className="text-[10px] md:text-xs font-medium truncate text-left flex-1">
                {subscription.name}
            </span>

            {/* ホバー時のツールチップ */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border">
                <div className="font-medium">{subscription.name}</div>
                <div className="text-muted-foreground">¥{subscription.amount.toLocaleString()}</div>
            </div>
        </Link>
    );
}

export function Calendar({ subscriptions }: { subscriptions: Subscription[] }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const calendarDays = getCalendarDays(year, month);

    // アクティブなサブスクリプションのみフィルター
    const activeSubscriptions = subscriptions.filter(
        (sub) => sub.status === "active" || sub.status === "利用中"
    );

    // 前月へ移動
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    // 次月へ移動
    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    // 今月の総支払額を計算
    const getTotalForMonth = () => {
        let total = 0;
        calendarDays.forEach((day) => {
            if (day.isCurrentMonth) {
                const subs = getSubscriptionsForDate(day.date, activeSubscriptions);
                subs.forEach((sub) => {
                    const rawAmount = sub.amount;
                    const amount = typeof rawAmount === 'string' ? parseInt(rawAmount.replace(/[^0-9]/g, "")) : (rawAmount || 0);
                    total += amount;
                });
            }
        });
        return total;
    };

    const monthTotal = getTotalForMonth();

    return (
        <div className="space-y-4">
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">
                        {getYearMonthDisplay(year, month)}
                    </h2>
                    {monthTotal > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                            今月の支払い予定: ¥{monthTotal.toLocaleString()}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPreviousMonth}
                        className="p-2 rounded-lg hover:bg-accent transition-colors"
                        aria-label="前月"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-accent transition-colors"
                    >
                        今月
                    </button>
                    <button
                        onClick={goToNextMonth}
                        className="p-2 rounded-lg hover:bg-accent transition-colors"
                        aria-label="次月"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* カレンダーグリッド */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                {/* 曜日ヘッダー */}
                <div className="grid grid-cols-7 bg-muted/50">
                    {WEEKDAYS.map((day, index) => (
                        <div
                            key={day}
                            className={`py-3 text-center text-sm font-medium ${index === 0
                                ? "text-red-500"
                                : index === 6
                                    ? "text-blue-500"
                                    : "text-muted-foreground"
                                }`}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* 日付グリッド */}
                <div className="grid grid-cols-7">
                    {calendarDays.map((calDay, index) => {
                        const subscriptionsForDay = getSubscriptionsForDate(
                            calDay.date,
                            activeSubscriptions
                        );
                        const isWeekend = index % 7 === 0 || index % 7 === 6;
                        const hasMultiple = subscriptionsForDay.length > 1;
                        const displaySub = subscriptionsForDay[0];

                        return (
                            <div
                                key={index}
                                className={`min-h-[75px] md:min-h-[120px] p-1 md:p-2 border-r border-b ${!calDay.isCurrentMonth
                                    ? "bg-muted/20"
                                    : calDay.isToday
                                        ? "bg-primary/5"
                                        : ""
                                    } ${index % 7 === 6 ? "border-r-0" : ""} ${index >= 35 ? "border-b-0" : ""
                                    }`}
                            >
                                {/* 日付 */}
                                <div
                                    className={`text-xs md:text-sm font-medium mb-1 ${!calDay.isCurrentMonth
                                        ? "text-muted-foreground/50"
                                        : calDay.isToday
                                            ? "text-primary font-bold"
                                            : isWeekend && index % 7 === 0
                                                ? "text-red-500"
                                                : isWeekend && index % 7 === 6
                                                    ? "text-blue-500"
                                                    : ""
                                        }`}
                                >
                                    {calDay.day}
                                </div>

                                {/* サブスクリプション - 1つだけ表示 + 残り数 */}
                                <div className="flex flex-col gap-1">
                                    {subscriptionsForDay.length > 0 && (
                                        <div className="flex items-center gap-1">
                                            <div className="flex-1 min-w-0">
                                                <SubscriptionIcon
                                                    subscription={displaySub}
                                                />
                                            </div>
                                            {hasMultiple && (
                                                <CalendarTooltip subscriptions={subscriptionsForDay.slice(1)}>
                                                    <span className="text-[10px] font-bold text-primary shrink-0 cursor-pointer select-none">
                                                        +{subscriptionsForDay.length - 1}
                                                    </span>
                                                </CalendarTooltip>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 凡例 */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-primary/20 border border-primary"></div>
                    <span>今日</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-600"></div>
                    <span>Netflix</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span>Spotify</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-600"></div>
                    <span>Adobe CC</span>
                </div>
            </div>
        </div>
    );
}
