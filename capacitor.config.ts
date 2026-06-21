import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.samir.chatapp",
  appName: "chat-app",
  server: {
    url: "https://chat-app-samir.vercel.app",
    cleartext: false,
  },
};

export default config;