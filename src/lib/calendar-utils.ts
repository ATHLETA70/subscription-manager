/**
 * カレンダー関連のユーティリティ関数
 */

export interface CalendarDay {
    date: Date;
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
}

/**
 * 指定された年月のカレンダー日付配列を生成
 * @param year 年
 * @param month 月 (0-11)
 * @returns カレンダーに表示する日付の配列（前月・当月・翌月を含む）
 */
export function getCalendarDays(year: number, month: number): CalendarDay[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: CalendarDay[] = [];

    // 月の最初の日の曜日（0: 日曜, 1: 月曜, ...）
    const firstDayOfWeek = firstDay.getDay();

    // 前月の日付を追加（日曜日から始まる場合）
    if (firstDayOfWeek > 0) {
        const prevMonthLastDay = new Date(year, month, 0);
        const prevMonthDays = prevMonthLastDay.getDate();

        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonthDays - i;
            const date = new Date(year, month - 1, day);
            date.setHours(0, 0, 0, 0);

            days.push({
                date,
                day,
                isCurrentMonth: false,
                isToday: date.getTime() === today.getTime(),
            });
        }
    }

    // 当月の日付を追加
    const daysInMonth = lastDay.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);

        days.push({
            date,
            day,
            isCurrentMonth: true,
            isToday: date.getTime() === today.getTime(),
        });
    }

    // 翌月の日付を追加（6週分のカレンダーになるように）
    const remainingDays = 42 - days.length; // 6週 × 7日 = 42日
    for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(year, month + 1, day);
        date.setHours(0, 0, 0, 0);

        days.push({
            date,
            day,
            isCurrentMonth: false,
            isToday: date.getTime() === today.getTime(),
        });
    }

    return days;
}

/**
 * 日付を YYYY-MM-DD 形式にフォーマット
 */
export function formatDateYMD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 指定された日付のサブスクリプションを取得
 */
export interface Subscription {
    id: string | number;
    name: string;
    status: string;
    amount?: number;
    category?: string;
    nextBilling?: string;
    next_payment_date?: string;
    first_payment_date?: string;
    startDate?: string;
    cycle?: string;
    image_url?: string;
    memo?: string;
}

export function getSubscriptionsForDate(
    date: Date,
    subscriptions: Subscription[]
) {
    const dateStr = formatDateYMD(date);
    const dayOfMonth = date.getDate();
    const month = date.getMonth(); // 0-11

    return subscriptions.filter(sub => {
        // Check status
        if (sub.status !== 'active' && sub.status !== '利用中') return false;

        // Priority 1: Exact match with next_payment_date
        if (sub.next_payment_date) {
            const nextDate = formatDateYMD(new Date(sub.next_payment_date));
            if (nextDate === dateStr) return true;

            // Don't show on other dates if next_payment_date exists
            // This prevents duplicates
            return false;
        }

        // Priority 2: Legacy nextBilling field
        if (sub.nextBilling === dateStr) return true;

        // Priority 3: Recurrence logic based on first_payment_date
        const startDateStr = sub.first_payment_date || sub.startDate;
        if (!startDateStr) return false;

        const startDate = new Date(startDateStr);
        if (date < startDate) return false;

        const startDay = startDate.getDate();

        if (sub.cycle === 'monthly' || sub.cycle === '月額') {
            return dayOfMonth === startDay;
        } else if (sub.cycle === 'yearly' || sub.cycle === '年額') {
            return dayOfMonth === startDay && month === startDate.getMonth();
        }

        return false;
    });
}

/**
 * 月の名前を取得（日本語）
 */
export function getMonthName(month: number): string {
    return `${month + 1}月`;
}

/**
 * 年月の表示用文字列を取得
 */
export function getYearMonthDisplay(year: number, month: number): string {
    return `${year}年${month + 1}月`;
}
