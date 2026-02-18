"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type OutboundCallerIdFormProps = {
  settingsEndpoint?: string;
  providerLabel?: string;
  initialValue?: string;
};

type NumberFormApiError = {
  ok?: boolean;
  error?: {
    message?: string;
    formErrors?: string[];
    fieldErrors?: Record<string, string[]>;
  };
};

export function OutboundCallerIdForm(props: OutboundCallerIdFormProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [phoneNumber, setPhoneNumber] = useState(props.initialValue ?? "");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const settingsEndpoint = props.settingsEndpoint ?? "/api/settings/twilio";
  const providerLabel = props.providerLabel ?? "Twilio";

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    startTransition(async () => {
      const response = await fetch(settingsEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          setOutbound: true,
          isActive: true,
        }),
      });

      const result = (await response.json().catch(() => null)) as NumberFormApiError | null;
      const fallbackText = result
        ? ""
        : await response
            .text()
            .then((text) => text.trim())
            .catch(() => "");

      if (!response.ok) {
        const fallbackFieldError = result?.error?.fieldErrors
          ? Object.values(result.error.fieldErrors).flat().find(Boolean)
          : undefined;
        const messageCandidates = [
          result?.error?.message,
          result?.error?.formErrors?.[0],
          fallbackFieldError,
          fallbackText,
          t(
            `No se pudo guardar el numero outbound de ${providerLabel}.`,
            `Could not save the outbound ${providerLabel} number.`,
          ),
        ];

        setStatus({
          type: "error",
          message: messageCandidates.find(
            (candidate): candidate is string => Boolean(candidate && candidate.trim()),
          )!,
        });
        return;
      }

      setStatus({
        type: "success",
        message: t(
          `Numero outbound de ${providerLabel} guardado.`,
          `Outbound ${providerLabel} number saved.`,
        ),
      });
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
      <Input
        value={phoneNumber}
        onChange={(event) => setPhoneNumber(event.target.value)}
        placeholder="+15752550685"
        required
        className="h-11 rounded-xl border-white/15 bg-white/5"
      />
      <Button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-xl bg-[#6FA8FF] px-5 text-[#0C1A33] hover:bg-[#8AB8FF]"
      >
        {isPending ? t("Guardando", "Saving") : t("Usar para salida", "Use for outbound")}
      </Button>
      {status ? (
        <p
          className={`text-xs ${status.type === "error" ? "text-red-300" : "text-emerald-300"} md:col-span-2`}
        >
          {status.message}
        </p>
      ) : (
        <p className="text-xs text-[#A7A296] md:col-span-2">
          {t(
            "Este numero se usara en Test Call outbound antes de TWILIO_NUMBER.",
            "This number is used for outbound Test Call before TWILIO_NUMBER.",
          )}
        </p>
      )}
    </form>
  );
}
