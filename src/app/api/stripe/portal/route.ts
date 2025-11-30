import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Get the user's Stripe customer ID from user_plans table
        const { data: userPlan, error: planError } = await supabase
            .from('user_plans')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single();

        if (planError || !userPlan?.stripe_customer_id) {
            console.error('Error fetching user plan or no customer ID:', planError);
            return new NextResponse('No subscription found', { status: 404 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        const session = await stripe.billingPortal.sessions.create({
            customer: userPlan.stripe_customer_id,
            return_url: `${baseUrl}/settings`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Error creating portal session:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
