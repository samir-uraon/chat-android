importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyB_r1-IIiap0Vig04jJSCk4TUp8eFk44qg",
  authDomain: "chat-app-3b927.firebaseapp.com",
  projectId: "chat-app-3b927",
  storageBucket: "chat-app-3b927.firebasestorage.app",
  messagingSenderId: "787750367154",
  appId: "1:787750367154:web:96c0ed87b7493b2566feab",
  measurementId: "G-V2SBQZ0FNF"
});

const messaging = firebase.messaging();


// ✅ THIS is where it goes
messaging.onBackgroundMessage((payload) => {
  console.log("BG message:", payload);

  const { title, body, url } = payload.data;

  self.registration.showNotification(title, {
    body,
    data: { url }, // passed to click handler
  });
});


// ✅ click handler
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const url = event.notification.data?.url || "/chat";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});