"use client";

import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import { SubmitButton } from "@/components/salones/submit-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import type { IpcFormState, IpcSummary } from "@/lib/ipc/validation";

type IpcApplicationFormProps = {
  applyAction: (
    previousState: IpcFormState,
    formData: FormData,
  ) => Promise<IpcFormState>;
  emptyState: IpcFormState;
  previewAction: (
    previousState: IpcFormState,
    formData: FormData,
  ) => Promise<IpcFormState>;
};

export function IpcApplicationForm({
  applyAction,
  emptyState,
  previewAction,
}: IpcApplicationFormProps) {
  const [previewState, previewFormAction] = useActionState(
    previewAction,
    emptyState,
  );
  const [applyState, applyFormAction] = useActionState(applyAction, emptyState);
  const state = applyState.successMessage ? applyState : previewState;
  const shouldConfirm = Boolean(previewState.summary) && !applyState.successMessage;

  return (
    <div className="space-y-5">
      <form action={previewFormAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ipc-periodo">Período</Label>
            <input
              id="ipc-periodo"
              name="periodo"
              type="month"
              required
              defaultValue={state.fields.periodo}
              aria-invalid={Boolean(state.errors.periodo)}
              aria-describedby={
                state.errors.periodo ? "ipc-periodo-error" : undefined
              }
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm shadow-slate-950/5 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
            />
            {state.errors.periodo ? (
              <p id="ipc-periodo-error" className="text-sm text-red-700">
                {state.errors.periodo}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ipc-variacion">Variación IPC (%)</Label>
            <input
              id="ipc-variacion"
              name="variacion_porcentual"
              type="text"
              inputMode="decimal"
              placeholder="Ej.: 2,5"
              required
              defaultValue={state.fields.variacion_porcentual}
              aria-invalid={Boolean(state.errors.variacion_porcentual)}
              aria-describedby={
                state.errors.variacion_porcentual
                  ? "ipc-variacion-error"
                  : undefined
              }
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm shadow-slate-950/5 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
            />
            {state.errors.variacion_porcentual ? (
              <p id="ipc-variacion-error" className="text-sm text-red-700">
                {state.errors.variacion_porcentual}
              </p>
            ) : null}
          </div>
        </div>

        {state.formError ? <Alert variant="destructive">{state.formError}</Alert> : null}

        <SubmitButton pendingLabel="Calculando impacto...">
          Previsualizar impacto
        </SubmitButton>
      </form>

      {shouldConfirm && previewState.summary ? (
        <Confirmation
          fields={previewState.fields}
          formAction={applyFormAction}
          summary={previewState.summary}
        />
      ) : null}

      {applyState.successMessage && applyState.summary ? (
        <Alert variant="success">
          <AlertTitle>{applyState.successMessage}</AlertTitle>
          <AlertDescription>
            Se actualizaron {applyState.summary.cantidadServicios} servicios de{" "}
            {applyState.summary.cantidadEventos} eventos.
          </AlertDescription>
          <Summary summary={applyState.summary} />
        </Alert>
      ) : null}
    </div>
  );
}

function Confirmation({
  fields,
  formAction,
  summary,
}: {
  fields: IpcFormState["fields"];
  formAction: (formData: FormData) => void;
  summary: IpcSummary;
}) {
  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4"
    >
      <input name="periodo" type="hidden" value={fields.periodo} />
      <input
        name="variacion_porcentual"
        type="hidden"
        value={fields.variacion_porcentual}
      />
      <div>
        <h3 className="text-sm font-semibold text-amber-950">
          Confirmar aplicación para {formatPeriod(fields.periodo)}
        </h3>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          La aplicación recalcula precios contractuales de servicios sin pagos
          ordinarios. Los pagos, garantías, adicionales y comisiones no cambian.
        </p>
      </div>
      <Summary summary={summary} />
      <label className="flex items-start gap-2 text-sm text-amber-950">
        <input
          name="confirmar"
          type="checkbox"
          value="true"
          required
          className="mt-1 size-4 rounded border-amber-300 text-teal-700 focus:ring-teal-600"
        />
        <span>Confirmo que deseo aplicar este IPC de forma definitiva.</span>
      </label>
      <SubmitButton
        pendingLabel="Aplicando IPC..."
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-amber-800 bg-amber-700 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-amber-950/15 transition hover:border-amber-900 hover:bg-amber-800 focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ShieldCheck aria-hidden="true" className="size-4" />
        Aplicar IPC definitivamente
      </SubmitButton>
    </form>
  );
}

function Summary({ summary }: { summary: IpcSummary }) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <SummaryItem label="Servicios alcanzados" value={String(summary.cantidadServicios)} />
      <SummaryItem label="Eventos alcanzados" value={String(summary.cantidadEventos)} />
      <SummaryItem
        label="Precio base"
        value={`${formatMoney(summary.montoPrecioBaseAnterior)} → ${formatMoney(summary.montoPrecioBaseActualizado)}`}
      />
      <SummaryItem
        label="Total con IVA"
        value={`${formatMoney(summary.montoTotalConIvaAnterior)} → ${formatMoney(summary.montoTotalConIvaActualizado)}`}
      />
    </dl>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/80 bg-white/70 px-3 py-2">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function formatPeriod(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) return value;

  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}-01T00:00:00.000Z`));
}
