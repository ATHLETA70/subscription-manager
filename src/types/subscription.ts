export interface Subscription {
    id: string; // uuid in database
    name: string;
    category: string;
    amount: number | string;
    cycle: 'monthly' | 'yearly' | '月額' | '年額';
    next_payment_date: string | null;
    status: 'active' | 'inactive' | '利用中' | '解約済' | '解約中' | 'trial';
    image_url: string | null;
    user_id?: string;
    created_at?: string;
    updated_at?: string;
    first_payment_date?: string;
    end_date?: string | null;
    // Legacy fields for backwards compatibility
    nextBilling?: string;
    startDate?: string;
    memo?: string;
}
