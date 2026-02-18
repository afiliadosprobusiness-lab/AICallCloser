"use client";

import { useEffect } from "react";

import { getFirebaseApp } from "@/lib/firebase/client";

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    getFirebaseApp();
  }, []);

  return <>{children}</>;
}
