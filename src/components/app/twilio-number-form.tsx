"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type VoiceNumberFormProps = {
  settingsEndpoint?: string;
  providerLabel?: string;
};

export function TwilioNumberForm(props: VoiceNumberFormProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [friendlyName, setFriendlyName] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const settingsEndpoint = props.settingsEndpoint ?? "/api/settings/telnyx";
  const providerLabel = props.providerLabel ?? "Telnyx";

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    startTransition(async () => {
      const response = await fetch(settingsEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, friendlyName }),
      });

      if (!response.ok) {
        setStatus({
          type: "error",
          message: t(
            `No se pudo guardar el numero de ${providerLabel}. Verifica formato y permisos.`,
            `Could not save the ${providerLabel} number. Verify format and permissions.`,
          ),
        });
        return;
      }

      setPhoneNumber("");
      setFriendlyName("");
      setStatus({
        type: "success",
        message: t(
          `Numero de ${providerLabel} guardado correctamente.`,
          `${providerLabel} number saved successfully.`,
        ),
      });
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
      <Input
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        placeholder="+15551234567"
        required
        className="h-11 rounded-xl border-white/15 bg-white/5"
      />
      <Input
        value={friendlyName}
        onChange={(e) => setFriendlyName(e.target.value)}
        placeholder={t("Inbound principal", "Main inbound")}
        className="h-11 rounded-xl border-white/15 bg-white/5"
      />
      <Button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-xl bg-[#C9A227] px-5 text-[#18140D] hover:bg-[#E5C76B]"
      >
        {isPending ? t("Guardando", "Saving") : t("Agregar", "Add")}
      </Button>
      {status ? (
        <p
          className={`text-xs ${status.type === "error" ? "text-red-300" : "text-emerald-300"} md:col-span-3`}
        >
          {status.message}
        </p>
      ) : null}
    </form>
  );
}
