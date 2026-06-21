"use client"
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyB_r1-IIiap0Vig04jJSCk4TUp8eFk44qg",
  authDomain: "chat-app-3b927.firebaseapp.com",
  projectId: "chat-app-3b927",
  storageBucket: "chat-app-3b927.firebasestorage.app",
  messagingSenderId: "787750367154",
  appId: "1:787750367154:web:96c0ed87b7493b2566feab",
  measurementId: "G-V2SBQZ0FNF"
};

const app = initializeApp(firebaseConfig);
let messaging = null;

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  messaging = getMessaging(app);
}

export { messaging };

export const generateToken = async () => {
  if (!messaging) return null;

  const permission = await Notification.requestPermission();

  if (permission !== "granted") return null;

  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
    });

    return token;
  } catch (err) {
    console.log("Token error:", err);
    return null;
  }
};