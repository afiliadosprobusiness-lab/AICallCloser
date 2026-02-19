"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Loader2, PhoneOutgoing, UploadCloud } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type BridgeCustomer = {
  id: string;
  customerName: string;
  customerId: string | null;
};

type BridgeLead = {
  id: string;
  customerId: string;
  externalId: string;
  clientName: string | null;
  phoneE164: string;
  objective: "CLOSE_SALE" | "BOOK_MEET" | "BOOK_IN_PERSON" | "SCHEDULE_FOLLOWUP";
  status: "new" | "queued" | "calling" | "completed" | "failed";
  lastCallSid: string | null;
  collectedInfo: Record<string, unknown> | null;
  preferredTimes: Array<{ date: string; time: string; timezone: string }> | null;
  updatedAt: string;
  customer: {
    customerName: string;
    customerId: string | null;
  };
};

type BridgeLeadsResponse = {
  ok: boolean;
  data?: {
    items: BridgeLead[];
    customers: BridgeCustomer[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: {
    message?: string;
  };
};

type ImportResponse = {
  ok: boolean;
  data?: {
    customer: BridgeCustomer;
    imported: number;
    updated: number;
    totalLeads: number;
    errors: Array<{ code: string; message: string; path?: string }>;
  };
  error?: {
    message?: string;
    errors?: Array<{ code: string; message: string; path?: string }>;
  };
};

const objectiveLabel: Record<BridgeLead["objective"], { es: string; en: string }> = {
  CLOSE_SALE: { es: "Cerrar venta", en: "Close sale" },
  BOOK_MEET: { es: "Agendar Google Meet", en: "Book Google Meet" },
  BOOK_IN_PERSON: { es: "Agendar presencial", en: "Book in person" },
  SCHEDULE_FOLLOWUP: { es: "Programar seguimiento", en: "Schedule follow-up" },
};

export function BridgeSettingsPanel(props: {
  initialCustomers: BridgeCustomer[];
  initialLeads: BridgeLead[];
}) {
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [isCalling, startCallingTransition] = useTransition();

  const [customers, setCustomers] = useState<BridgeCustomer[]>(props.initialCustomers);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("all");
  const [leads, setLeads] = useState<BridgeLead[]>(props.initialLeads);
  const [file, setFile] = useState<File | null>(null);
  const [previewMeta, setPreviewMeta] = useState<{ customerName: string; count: number } | null>(null);
  const [jsonPreviewError, setJsonPreviewError] = useState<string>("");
  const [status, setStatus] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [importErrors, setImportErrors] = useState<Array<{ code: string; message: string; path?: string }>>([]);
  const [callingLeadId, setCallingLeadId] = useState<string | null>(null);
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);

  const refreshLeads = useCallback(async (customerId: string) => {
    const query = customerId === "all" ? "" : `?customerId=${encodeURIComponent(customerId)}`;
    const response = await fetch(`/api/bridge/leads${query}`, { cache: "no-store" });
    const result = (await response.json().catch(() => null)) as BridgeLeadsResponse | null;

    if (!response.ok || !result?.ok || !result.data) {
      setStatus({
        type: "error",
        message: result?.error?.message ?? t("No se pudieron cargar leads puente.", "Could not load bridge leads."),
      });
      return;
    }

    setLeads(result.data.items);
    setCustomers(result.data.customers);
  }, [t]);

  useEffect(() => {
    startTransition(async () => {
      await refreshLeads(selectedCustomerId);
    });
  }, [refreshLeads, selectedCustomerId]);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null;
    setFile(next);
    setImportErrors([]);
    setStatus(null);
    setJsonPreviewError("");
    setPreviewMeta(null);

    if (!next) {
      return;
    }

    const content = await next.text();
    try {
      const parsed = JSON.parse(content) as {
        customer?: { customerName?: string };
        leads?: unknown[];
      };

      setPreviewMeta({
        customerName: parsed.customer?.customerName ?? t("Sin nombre", "Unnamed"),
        count: Array.isArray(parsed.leads) ? parsed.leads.length : 0,
      });
    } catch {
      setJsonPreviewError(t("JSON inválido. Corrige el archivo antes de importar.", "Invalid JSON. Fix the file before importing."));
    }
  }

  function importJson() {
    if (!file) {
      setStatus({
        type: "error",
        message: t("Selecciona un archivo JSON primero.", "Select a JSON file first."),
      });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/bridge/import", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json().catch(() => null)) as ImportResponse | null;

      if (!response.ok || !result) {
        setStatus({
          type: "error",
          message: t("No se pudo importar el JSON.", "Could not import JSON."),
        });
        return;
      }

      if (!result.ok || !result.data) {
        setImportErrors(result.error?.errors ?? []);
        setStatus({
          type: "error",
          message: result.error?.message ?? t("Importación inválida.", "Invalid import payload."),
        });
        return;
      }

      const importedData = result.data;
      setImportErrors(importedData.errors ?? []);
      setSelectedCustomerId(importedData.customer.id);
      setStatus({
        type: importedData.errors.length > 0 ? "error" : "success",
        message: t(
          `Importado ${importedData.imported}, actualizados ${importedData.updated} de ${importedData.totalLeads}.`,
          `Imported ${importedData.imported}, updated ${importedData.updated} from ${importedData.totalLeads}.`,
        ),
      });

      await refreshLeads(importedData.customer.id);
    });
  }

  function callLead(lead: BridgeLead) {
    setStatus(null);
    setCallingLeadId(lead.id);

    startCallingTransition(async () => {
      const response = await fetch(`/api/bridge/leads/${lead.id}/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: lead.phoneE164 }),
      });

      const result = (await response.json().catch(() => null)) as
        | { ok?: boolean; data?: { callSid?: string }; error?: { message?: string } }
        | null;

      if (!response.ok || !result?.ok) {
        setStatus({
          type: "error",
          message:
            result?.error?.message ??
            t("No se pudo iniciar la llamada outbound.", "Could not start outbound call."),
        });
        setCallingLeadId(null);
        return;
      }

      setLeads((previous) =>
        previous.map((item) =>
          item.id === lead.id
            ? {
                ...item,
                status: "calling",
                lastCallSid: result.data?.callSid ?? item.lastCallSid,
              }
            : item,
        ),
      );
      setStatus({
        type: "success",
        message: result.data?.callSid
          ? t(`Llamada iniciada. SID: ${result.data.callSid}`, `Call started. SID: ${result.data.callSid}`)
          : t("Llamada iniciada.", "Call started."),
      });
      setCallingLeadId(null);
    });
  }

  const sortedLeads = useMemo(
    () => [...leads].sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1)),
    [leads],
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-[#A7A296]">Puente</p>
        <h2 className="mt-1 text-lg font-semibold text-[#F5F3EE]">
          {t("Importador JSON de leads", "JSON lead importer")}
        </h2>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="bridge-json-file">{t("Archivo .json", "JSON file")}</Label>
          <Input
            id="bridge-json-file"
            type="file"
            accept=".json,application/json"
            onChange={onFileChange}
            className="h-11 rounded-xl border-white/15 bg-black/20"
          />
          {previewMeta ? (
            <p className="text-xs text-[#B9B4A9]">
              {t("Cliente", "Customer")}: {previewMeta.customerName} | Leads: {previewMeta.count}
            </p>
          ) : null}
          {jsonPreviewError ? <p className="text-xs text-red-300">{jsonPreviewError}</p> : null}
        </div>

        <div className="flex items-end">
          <Button
            type="button"
            onClick={importJson}
            disabled={isPending || !file}
            className="h-11 rounded-xl bg-[#C9A227] px-5 text-[#18140D] hover:bg-[#E5C76B]"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {t("Importar", "Import")}
          </Button>
        </div>
      </div>

      {status ? (
        <p className={`text-sm ${status.type === "error" ? "text-red-300" : "text-emerald-300"}`}>
          {status.message}
        </p>
      ) : null}

      {importErrors.length > 0 ? (
        <div className="rounded-2xl border border-red-300/20 bg-red-300/10 p-3 text-xs text-red-100">
          <p className="mb-2 font-semibold">{t("Errores de validación", "Validation errors")}</p>
          <ul className="space-y-1">
            {importErrors.slice(0, 12).map((error, index) => (
              <li key={`${error.code}-${index}`}>
                {error.path ? `${error.path}: ` : ""}
                {error.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          <Label>{t("Cliente", "Customer")}</Label>
          <select
            value={selectedCustomerId}
            onChange={(event) => setSelectedCustomerId(event.target.value)}
            className="h-11 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-sm text-[#F5F3EE]"
          >
            <option value="all">{t("Todos", "All")}</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.customerName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end text-xs text-[#A7A296]">
          {isPending ? t("Actualizando lista...", "Refreshing list...") : `${sortedLeads.length} leads`}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-sm">
            <thead className="bg-white/5 text-left text-[#CFCAC0]">
              <tr>
                <th className="px-3 py-2">{t("Lead", "Lead")}</th>
                <th className="px-3 py-2">{t("Teléfono", "Phone")}</th>
                <th className="px-3 py-2">{t("Objetivo", "Objective")}</th>
                <th className="px-3 py-2">{t("Estado", "Status")}</th>
                <th className="px-3 py-2">{t("Acciones", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {sortedLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-5 text-[#A7A296]">
                    {t("No hay leads importados.", "No imported leads yet.")}
                  </td>
                </tr>
              ) : (
                sortedLeads.map((lead) => (
                  <tr key={lead.id} className="border-t border-white/10 align-top">
                    <td className="px-3 py-3">
                      <p className="text-[#F5F3EE]">{lead.clientName ?? "Unknown lead"}</p>
                      <p className="text-xs text-[#A7A296]">{lead.externalId}</p>
                      <p className="text-xs text-[#A7A296]">{lead.customer.customerName}</p>
                    </td>
                    <td className="px-3 py-3 text-[#D8D3C7]">{lead.phoneE164}</td>
                    <td className="px-3 py-3 text-[#D8D3C7]">
                      {t(objectiveLabel[lead.objective].es, objectiveLabel[lead.objective].en)}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1 text-xs text-[#E5C76B]">
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={isCalling && callingLeadId === lead.id}
                          onClick={() => callLead(lead)}
                          className="h-9 rounded-lg bg-[#C9A227] px-3 text-[#18140D] hover:bg-[#E5C76B]"
                        >
                          {isCalling && callingLeadId === lead.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <PhoneOutgoing className="h-4 w-4" />
                          )}
                          {t("Llamar ahora", "Call now")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setOpenLeadId((prev) => (prev === lead.id ? null : lead.id))}
                          className="h-9 rounded-lg border-white/20 bg-black/20 text-[#F5F3EE]"
                        >
                          {openLeadId === lead.id ? t("Ocultar", "Hide") : t("Detalle", "Details")}
                        </Button>
                      </div>

                      {openLeadId === lead.id ? (
                        <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-2 text-xs text-[#CFCAC0]">
                          <p className="font-medium text-[#F5F3EE]">collectedInfo</p>
                          <Textarea
                            rows={5}
                            readOnly
                            value={JSON.stringify(lead.collectedInfo ?? {}, null, 2)}
                            className="mt-1 border-white/10 bg-black/30 font-mono text-[11px]"
                          />
                          <p className="mt-2 font-medium text-[#F5F3EE]">preferredTimes</p>
                          <Textarea
                            rows={4}
                            readOnly
                            value={JSON.stringify(lead.preferredTimes ?? [], null, 2)}
                            className="mt-1 border-white/10 bg-black/30 font-mono text-[11px]"
                          />
                          {lead.lastCallSid ? (
                            <p className="mt-1 text-[#A7A296]">Call SID: {lead.lastCallSid}</p>
                          ) : null}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
