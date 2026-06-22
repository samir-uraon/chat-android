import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.samir.chatapp',
  appName: 'Chat App',
  server: {
    url: 'https://chat-app-samir.vercel.app',
    cleartext: false,
    androidScheme: 'https'
  }
};

export default config;