import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.subscriptionmanager.app',
  appName: 'Subscription Manager',
  webDir: 'out',
  server: {
    // Replace with your production URL
    // url: 'https://your-app.vercel.app',
    cleartext: true
  }
};

export default config;
