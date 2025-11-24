import { createClient } from '@supabase/supabase-js';
import { mockSubscriptions } from '../src/lib/mock-data';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('Seeding data...');

    // 1. Sign up a dummy user to own the data
    const email = `user${Math.floor(Math.random() * 100000)}@demo.com`;
    const password = 'password123';

    console.log(`Attempting to create user: ${email}`);

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError) {
        console.error('Error creating user:', authError);
        return;
    }

    const user = authData.user;
    const session = authData.session;

    if (!user) {
        console.error('Could not get user');
        return;
    }

    console.log(`User created: ${user.email} (${user.id})`);

    if (!session) {
        console.warn('WARNING: No session returned. Email confirmation might be required.');
        console.warn('Cannot seed data without an active session due to RLS.');
        console.warn('Please disable "Confirm email" in Supabase Dashboard > Authentication > Providers > Email, or use a Service Role Key.');
        return;
    }

    console.log('Session active. Proceeding with data insertion...');

    // 2. Map and insert subscriptions
    const subscriptions = mockSubscriptions.map(sub => {
        const amount = parseInt(sub.amount.replace(/[^0-9]/g, ''));
        const cycle = sub.cycle === '月額' ? 'monthly' : 'yearly';
        const status = sub.status === '利用中' ? 'active' : 'inactive';

        return {
            user_id: user.id,
            name: sub.name,
            amount,
            currency: 'JPY',
            cycle,
            category: sub.category,
            first_payment_date: sub.startDate,
            next_payment_date: sub.nextBilling === '-' ? null : sub.nextBilling,
            image_url: sub.image || null,
            status,
        };
    });

    const { error: insertError } = await supabase
        .from('subscriptions')
        .insert(subscriptions);

    if (insertError) {
        console.error('Error inserting subscriptions:', insertError);
    } else {
        console.log(`Successfully inserted ${subscriptions.length} subscriptions.`);
    }
}

seed();
