"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateLeadInlineForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [phone, setPhone] = useState("");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      setPhone("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
      <Input
        placeholder="Nuevo lead: telefono"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        required
        className="h-11 rounded-xl border-white/15 bg-white/5"
      />
      <Button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-xl bg-[#C9A227] px-5 text-[#18140D] hover:bg-[#E5C76B]"
      >
        {isPending ? "Guardando" : "Agregar"}
      </Button>
    </form>
  );
}
