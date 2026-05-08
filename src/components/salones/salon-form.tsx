"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/components/salones/submit-button";
import type { SalonFormState } from "@/lib/salones/validation";

type SalonFormProps = {
  action: (
    previousState: SalonFormState,
    formData: FormData,
  ) => Promise<SalonFormState>;
  initialState: SalonFormState;
  submitLabel: string;
  pendingLabel: string;
};

export function SalonForm({
  action,
  initialState,
  submitLabel,
  pendingLabel,
}: SalonFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="max-w-3xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label
            htmlFor="nombre"
            className="block text-sm font-medium text-slate-700"
          >
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            defaultValue={state.fields.nombre}
            aria-invalid={Boolean(state.errors.nombre)}
            aria-describedby={state.errors.nombre ? "nombre-error" : undefined}
            className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
          />
          {state.errors.nombre ? (
            <p id="nombre-error" className="mt-2 text-sm text-red-600">
              {state.errors.nombre}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="capacidad"
            className="block text-sm font-medium text-slate-700"
          >
            Capacidad
          </label>
          <input
            id="capacidad"
            name="capacidad"
            type="number"
            min="0"
            step="1"
            defaultValue={state.fields.capacidad}
            aria-invalid={Boolean(state.errors.capacidad)}
            aria-describedby={
              state.errors.capacidad ? "capacidad-error" : undefined
            }
            className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
          />
          {state.errors.capacidad ? (
            <p id="capacidad-error" className="mt-2 text-sm text-red-600">
              {state.errors.capacidad}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="direccion"
            className="block text-sm font-medium text-slate-700"
          >
            Direccion
          </label>
          <input
            id="direccion"
            name="direccion"
            type="text"
            defaultValue={state.fields.direccion}
            className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="descripcion"
            className="block text-sm font-medium text-slate-700"
          >
            Descripcion
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            rows={4}
            defaultValue={state.fields.descripcion}
            className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
          />
        </div>

        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input
            name="activo"
            type="checkbox"
            defaultChecked={state.fields.activo}
            className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
          />
          Salon activo
        </label>
      </div>

      {state.formError ? (
        <div
          role="alert"
          className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.formError}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/salones"
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancelar
        </Link>
        <SubmitButton pendingLabel={pendingLabel}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
