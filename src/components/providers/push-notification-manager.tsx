"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { registerDeviceToken } from "@/actions/devices";
import { toast } from "sonner";

export function PushNotificationManager() {
    useEffect(() => {
        // Only run on native platforms (iOS/Android)
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        const registerPush = async () => {
            try {
                // Check permissions
                let permStatus = await PushNotifications.checkPermissions();

                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive !== 'granted') {
                    console.log("Push notification permission denied");
                    return;
                }

                // Register for push notifications
                await PushNotifications.register();

                // Add listeners
                await PushNotifications.addListener('registration', async token => {
                    console.log('Push registration success, token: ' + token.value);
                    const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';

                    const result = await registerDeviceToken(token.value, platform);
                    if (!result.success) {
                        console.error('Failed to register device token:', result.error);
                    }
                });

                await PushNotifications.addListener('registrationError', err => {
                    console.error('Push registration failed: ', err.error);
                });

                await PushNotifications.addListener('pushNotificationReceived', notification => {
                    console.log('Push received: ', notification);
                    toast.info(notification.title || "新しい通知", {
                        description: notification.body
                    });
                });

                await PushNotifications.addListener('pushNotificationActionPerformed', notification => {
                    console.log('Push action performed: ', notification);
                    // Handle deep links here if needed
                });

            } catch (error) {
                console.error("Error initializing push notifications:", error);
            }
        };

        registerPush();

        // Cleanup listeners on unmount
        return () => {
            if (Capacitor.isNativePlatform()) {
                PushNotifications.removeAllListeners();
            }
        };
    }, []);

    // This component doesn't render anything visible
    return null;
}
