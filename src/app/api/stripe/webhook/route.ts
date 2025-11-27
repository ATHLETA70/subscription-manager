import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const subscription = event.data.object as Stripe.Subscription;

    const supabase = await createClient();

    if (event.type === 'checkout.session.completed') {
        if (!session?.metadata?.userId) {
            return new NextResponse('User id is missing', { status: 400 });
        }

        const subscriptionId = session.subscription as string;

        // Retrieve the subscription details from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

        await supabase.from('user_plans').upsert({
            user_id: session.metadata.userId,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: session.customer as string,
            plan_type: 'premium',
            subscription_status: stripeSubscription.status,
            current_period_start: new Date((stripeSubscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((stripeSubscription as any).current_period_end * 1000).toISOString(),
        });
    }

    if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as Stripe.Subscription;
        await supabase
            .from('user_plans')
            .update({
                subscription_status: subscription.status,
                current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
                current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
            })
            .eq('stripe_subscription_id', subscription.id);
    }

    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription;
        await supabase
            .from('user_plans')
            .update({
                subscription_status: 'canceled',
                plan_type: 'free',
                cancel_at_period_end: false,
            })
            .eq('stripe_subscription_id', subscription.id);
    }

    return new NextResponse(null, { status: 200 });
}
