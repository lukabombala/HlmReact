importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCLAoFs4_6dT48jMyZjkNHIbkdXBf8z6Go",
  authDomain: "hlmr-a1e89.firebaseapp.com",
  projectId: "hlmr-a1e89",
  storageBucket: "hlmr-a1e89.appspot.com",
  messagingSenderId: "191886950976",
  appId: "1:191886950976:web:4dbc9dc43381610f26d5a5"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png' // Zmień na własną ikonę
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});