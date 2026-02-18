"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyBWX157yv9x97iJE4SiWKZg110MElCqo-I",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "ai-call-closer.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "ai-call-closer",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "ai-call-closer.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "637669949144",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:637669949144:web:9b868822c9715596b5e1ad",
};

let firebaseApp: FirebaseApp | null = null;

export function getFirebaseApp() {
  if (typeof window === "undefined") {
    return null;
  }

  if (firebaseApp) {
    return firebaseApp;
  }

  firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

  return firebaseApp;
}
