"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CallSimulator({ callId }: { callId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      await fetch(`/api/calls/${callId}/process-turn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      setText("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
      <Input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Simular frase del lead..."
        required
        className="h-11 rounded-xl border-white/15 bg-white/5"
      />
      <Button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-xl bg-[#C9A227] px-5 text-[#18140D] hover:bg-[#E5C76B]"
      >
        {isPending ? "Procesando" : "Enviar a IA"}
      </Button>
    </form>
  );
}
