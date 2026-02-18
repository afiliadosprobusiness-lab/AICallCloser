"use client";

import { useEffect, useState, useTransition } from "react";
import { getProviders, signIn } from "next-auth/react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";

type ProvidersMap = Record<string, { id: string; name: string }>;
type GoogleState = "loading" | "enabled" | "disabled";

export function GoogleAuthButton({
  callbackUrl,
  label,
}: {
  callbackUrl: string;
  label: string;
}) {
  const { t } = useLocale();
  const [googleState, setGoogleState] = useState<GoogleState>("loading");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;

    async function loadProviders() {
      const providers = (await getProviders()) as ProvidersMap | null;
      if (!mounted) return;
      setGoogleState(providers?.google ? "enabled" : "disabled");
    }

    void loadProviders();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-2">
      <div className="iridescent-border rounded-xl">
        <Button
          type="button"
          variant="ghost"
          disabled={isPending || googleState !== "enabled"}
          onClick={() =>
            startTransition(async () => {
              await signIn("google", { callbackUrl });
            })
          }
          className="iridescent-surface h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] text-[#ECE8DE] hover:text-[#F7F4EC] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <GoogleGlyph />
          {googleState === "loading"
            ? t("Verificando Google...", "Checking Google...")
            : isPending
              ? t("Conectando...", "Connecting...")
              : label}
        </Button>
      </div>
      {googleState === "disabled" ? (
        <p className="text-xs text-amber-200/85">
          {t(
            "Activa Google con GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.",
            "Enable Google with GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
          )}
        </p>
      ) : null}
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
