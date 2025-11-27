import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    // Verify cron secret if needed (e.g. for Vercel Cron)
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return new NextResponse('Unauthorized', { status: 401 });
    // }

    const supabase = await createClient();

    try {
        // 1. Get all users with notification preferences
        const { data: preferences } = await supabase
            .from("notification_preferences")
            .select("*");

        if (!preferences) {
            return NextResponse.json({ message: "No preferences found" });
        }

        const results = [];

        for (const pref of preferences) {
            // 2. Calculate target date for billing notification
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + pref.days_before_billing);
            const targetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD

            // 3. Find subscriptions matching the target date
            // Note: This is a simplified logic. In production, you might want to handle billing cycles more robustly.
            const { data: subscriptions } = await supabase
                .from("subscriptions")
                .select("*")
                .eq("user_id", pref.user_id)
                .eq("billing_date", targetDateStr);

            if (subscriptions && subscriptions.length > 0) {
                // 4. Send notifications
                for (const sub of subscriptions) {
                    // Email Notification
                    if (pref.email_notifications) {
                        // TODO: Send email via Resend
                        console.log(`[Email] Sending notification to user ${pref.user_id} for ${sub.name}`);
                    }

                    // Push Notification
                    if (pref.push_notifications) {
                        // Get user devices
                        const { data: devices } = await supabase
                            .from("user_devices")
                            .select("fcm_token")
                            .eq("user_id", pref.user_id);

                        if (devices && devices.length > 0) {
                            // TODO: Send push via Firebase Admin
                            console.log(`[Push] Sending notification to user ${pref.user_id} for ${sub.name} to ${devices.length} devices`);

                            // Example payload structure for FCM
                            const payload = {
                                title: "支払日が近づいています",
                                body: `${sub.name}の支払日が${pref.days_before_billing}日後です`,
                                data: {
                                    subscriptionId: sub.id
                                }
                            };
                        }
                    }
                }
                results.push({ userId: pref.user_id, count: subscriptions.length });
            }
        }

        return NextResponse.json({ success: true, processed: results });

    } catch (error) {
        console.error("Error processing notifications:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
