"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";

import { getFirebaseWebConfig, isFirebaseWebConfigReady } from "@/lib/firebase/config";

let firebaseApp: FirebaseApp | null = null;

export function getFirebaseApp() {
  if (typeof window === "undefined") {
    return null;
  }

  if (firebaseApp) {
    return firebaseApp;
  }

  if (!isFirebaseWebConfigReady()) {
    return null;
  }

  const firebaseConfig = getFirebaseWebConfig();
  firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return firebaseApp;
}
