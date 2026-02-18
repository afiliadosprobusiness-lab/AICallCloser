"use client";

import { useState, useTransition } from "react";
import { Loader2, PhoneOutgoing } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type OutboundCallLauncherProps = {
  endpoint: string;
  providerLabel: string;
};

type OutboundCallResult = {
  ok?: boolean;
  error?: {
    message?: string;
    formErrors?: string[];
    fieldErrors?: Record<string, string[]>;
  };
  data?: Record<string, unknown>;
};

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

function extractCallReference(payload: OutboundCallResult | null) {
  if (!payload?.data) {
    return undefined;
  }

  const root = payload.data;
  const telnyxData = root.data as Record<string, unknown> | undefined;

  return (
    (root.sid as string | undefined) ??
    (root.requestUuid as string | undefined) ??
    (root.request_uuid as string | undefined) ??
    (telnyxData?.call_control_id as string | undefined) ??
    undefined
  );
}

export function OutboundCallLauncher(props: OutboundCallLauncherProps) {
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [toNumber, setToNumber] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const normalizedTo = toNumber.trim();

    if (!E164_REGEX.test(normalizedTo)) {
      setStatus({
        type: "error",
        message: t("Usa formato internacional E.164. Ejemplo: +51924464410", "Use international E.164 format. Example: +51924464410"),
      });
      return;
    }

    startTransition(async () => {
      const response = await fetch(props.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: normalizedTo,
          answerText: answerText.trim() || undefined,
        }),
      });

      const result = (await response.json().catch(() => null)) as OutboundCallResult | null;

      if (!response.ok) {
        const fieldError = result?.error?.fieldErrors
          ? Object.values(result.error.fieldErrors).flat().find(Boolean)
          : undefined;

        setStatus({
          type: "error",
          message:
            result?.error?.message ??
            result?.error?.formErrors?.[0] ??
            fieldError ??
            t("No se pudo iniciar la llamada.", "The call could not be started."),
        });
        return;
      }

      const reference = extractCallReference(result);
      setStatus({
        type: "success",
        message: reference
          ? t(`Llamada iniciada. Ref: ${reference}`, `Call started. Ref: ${reference}`)
          : t("Llamada iniciada correctamente.", "Call started successfully."),
      });
    });
  }

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs uppercase tracking-[0.12em] text-[#A7A296]">{t("Llamada de prueba", "Test call")}</p>
      <p className="mt-1 text-sm text-[#F5F3EE]">{t(`Marca desde la plataforma con ${props.providerLabel}.`, `Dial from the platform with ${props.providerLabel}.`)}</p>

      <form onSubmit={onSubmit} className="mt-3 space-y-2">
        <Input
          value={toNumber}
          onChange={(event) => setToNumber(event.target.value)}
          placeholder="+51924464410"
          autoComplete="tel"
          inputMode="tel"
          className="h-11 rounded-xl border-white/15 bg-white/5"
        />
        <Input
          value={answerText}
          onChange={(event) => setAnswerText(event.target.value)}
          placeholder={t("Mensaje inicial opcional", "Optional opening message")}
          className="h-11 rounded-xl border-white/15 bg-white/5"
        />

        <Button
          type="submit"
          disabled={isPending}
          className="h-11 w-full rounded-xl bg-[#C9A227] px-5 text-[#18140D] hover:bg-[#E5C76B]"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("Llamando...", "Calling...")}
            </>
          ) : (
            <>
              <PhoneOutgoing className="h-4 w-4" />
              {t("Iniciar llamada", "Start call")}
            </>
          )}
        </Button>
      </form>

      {status ? (
        <p className={`mt-2 text-xs ${status.type === "error" ? "text-red-300" : "text-emerald-300"}`}>
          {status.message}
        </p>
      ) : (
        <p className="mt-2 text-xs text-[#A7A296]">
          {t("Tip: usa formato completo con +codigo de pais.", "Tip: use full format with +country code.")}
        </p>
      )}
    </div>
  );
}

