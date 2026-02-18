"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { getFirebaseApp } from "@/lib/firebase/client";

type GoogleState = "enabled" | "disabled";

type FirebaseAuthError = {
  code?: string;
};

const DOMAIN_SETUP_CODES = new Set(["auth/unauthorized-domain", "auth/auth-domain-config-required"]);

const REDIRECT_FALLBACK_CODES = new Set([
  "auth/popup-blocked",
  "auth/cancelled-popup-request",
  "auth/operation-not-supported-in-this-environment",
]);

const USER_CANCELED_CODES = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request"]);

function getGoogleAuthErrorMessage(code: string, t: (es: string, en: string) => string) {
  if (DOMAIN_SETUP_CODES.has(code)) {
    if (typeof window !== "undefined") {
      const host = window.location.host;
      return t(
        `Google no esta habilitado para este dominio: ${host}. Agregalo en Firebase Console > Authentication > Settings > Authorized domains.`,
        `Google sign-in is not enabled for this domain: ${host}. Add it in Firebase Console > Authentication > Settings > Authorized domains.`,
      );
    }

    return t(
      "Google no esta habilitado para este dominio. Agregalo en Firebase Console > Authentication > Settings > Authorized domains.",
      "Google sign-in is not enabled for this domain. Add it in Firebase Console > Authentication > Settings > Authorized domains.",
    );
  }

  return t("No se pudo autenticar con Google.", "Google authentication failed.");
}

export function GoogleAuthButton({
  callbackUrl,
  label,
}: {
  callbackUrl: string;
  label: string;
}) {
  const app = getFirebaseApp();
  const googleState: GoogleState = app ? "enabled" : "disabled";
  const router = useRouter();
  const { t } = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const completeNextAuthSignIn = useCallback(
    async (idToken: string) => {
      const result = await signIn("firebase-google", {
        idToken,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("NEXTAUTH_SIGNIN_FAILED");
      }

      router.push(result?.url ?? callbackUrl);
      router.refresh();
    },
    [callbackUrl, router],
  );

  useEffect(() => {
    if (googleState === "disabled") {
      return;
    }

    if (!app) {
      return;
    }

    const auth = getAuth(app);

    let active = true;

    void getRedirectResult(auth)
      .then(async (result) => {
        if (!active || !result?.user) {
          return;
        }

        const token = await result.user.getIdToken(true);
        await completeNextAuthSignIn(token);
      })
      .catch((rawError) => {
        if (!active) {
          return;
        }

        const errorData = rawError as FirebaseAuthError;
        setError(getGoogleAuthErrorMessage(errorData.code ?? "", t));
      });

    return () => {
      active = false;
    };
  }, [app, completeNextAuthSignIn, googleState, t]);

  const handleGoogleSignIn = () => {
    setError(null);

    startTransition(async () => {
      const app = getFirebaseApp();
      if (!app) {
        setError(
          t(
            "Configura Firebase para habilitar Google.",
            "Configure Firebase to enable Google sign-in.",
          ),
        );
        return;
      }

      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      try {
        const result = await signInWithPopup(auth, provider);
        const token = await result.user.getIdToken(true);
        await completeNextAuthSignIn(token);
      } catch (rawError) {
        const errorData = rawError as FirebaseAuthError;
        const code = errorData.code ?? "";

        if (USER_CANCELED_CODES.has(code)) {
          return;
        }

        if (REDIRECT_FALLBACK_CODES.has(code)) {
          await signInWithRedirect(auth, provider);
          return;
        }

        setError(getGoogleAuthErrorMessage(code, t));
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="iridescent-border rounded-xl">
        <Button
          type="button"
          variant="ghost"
          disabled={isPending || googleState !== "enabled"}
          onClick={handleGoogleSignIn}
          className="iridescent-surface h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] text-[#ECE8DE] hover:text-[#F7F4EC] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <GoogleGlyph />
          {isPending ? t("Conectando...", "Connecting...") : label}
        </Button>
      </div>

      {googleState === "disabled" ? (
        <p className="text-xs text-amber-200/85">
          {t(
            "Habilita Firebase Google Auth y las variables NEXT_PUBLIC_FIREBASE_*.",
            "Enable Firebase Google Auth and NEXT_PUBLIC_FIREBASE_* variables.",
          )}
        </p>
      ) : null}

      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden="true">
      <path
        d="M21.805 10.023h-9.62v3.947h5.53c-.238 1.27-.952 2.344-2.023 3.07v2.55h3.273c1.916-1.764 3.023-4.362 3.023-7.457 0-.706-.063-1.385-.183-2.11z"
        fill="#4285F4"
      />
      <path
        d="M12.185 22c2.73 0 5.02-.904 6.692-2.41l-3.273-2.55c-.904.607-2.06.964-3.419.964-2.635 0-4.867-1.779-5.662-4.17H3.143v2.629A10.1 10.1 0 0 0 12.185 22z"
        fill="#34A853"
      />
      <path
        d="M6.523 13.834a6.061 6.061 0 0 1-.317-1.95c0-.678.119-1.332.317-1.95V7.306H3.143a10.1 10.1 0 0 0 0 9.156l3.38-2.628z"
        fill="#FBBC05"
      />
      <path
        d="M12.185 5.765c1.486 0 2.816.512 3.864 1.521l2.901-2.901C17.2 2.767 14.913 1.75 12.185 1.75a10.1 10.1 0 0 0-9.042 5.556l3.38 2.628c.795-2.391 3.027-4.17 5.662-4.17z"
        fill="#EA4335"
      />
    </svg>
  );
}
