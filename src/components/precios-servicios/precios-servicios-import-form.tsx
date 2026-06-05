"use client";

import { Upload } from "lucide-react";
import { useActionState } from "react";
import { SubmitButton } from "@/components/salones/submit-button";
import { Alert } from "@/components/ui/alert";

type ImportPreciosServiciosState = {
  errors: string[];
  formError: string | null;
  successMessage: string | null;
  summary: {
    inserted: number;
    updated: number;
    rows: number;
  } | null;
};

type PreciosServiciosImportFormProps = {
  action: (
    previousState: ImportPreciosServiciosState,
    formData: FormData,
  ) => Promise<ImportPreciosServiciosState>;
};

const emptyImportPreciosServiciosState: ImportPreciosServiciosState = {
  errors: [],
  formError: null,
  successMessage: null,
  summary: null,
};

export function PreciosServiciosImportForm({
  action,
}: PreciosServiciosImportFormProps) {
  const [state, formAction] = useActionState(
    action,
    emptyImportPreciosServiciosState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="archivo"
          className="text-sm font-medium text-slate-950"
        >
          Planilla mensual
        </label>
        <input
          id="archivo"
          name="archivo"
          type="file"
          accept=".xlsx,.xls,.csv"
          required
          className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm shadow-slate-950/5 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/15"
        />
        <p className="text-xs leading-5 text-slate-500">
          Formatos aceptados: .xlsx, .xls o .csv. La importacion reemplaza el
          precio del mismo periodo si ya existe.
        </p>
      </div>

      {state.formError ? (
        <Alert variant="destructive">{state.formError}</Alert>
      ) : null}

      {state.errors.length > 0 ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">
            Errores de validacion
          </p>
          <ul className="mt-2 max-h-72 space-y-1 overflow-auto text-sm text-red-700">
            {state.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {state.successMessage ? (
        <Alert variant="success">
          {state.successMessage}
          {state.summary ? (
            <span className="mt-1 block">
              {state.summary.rows} filas procesadas: {state.summary.inserted} nuevas y{" "}
              {state.summary.updated} actualizadas.
            </span>
          ) : null}
        </Alert>
      ) : null}

      <div className="border-t border-slate-100 pt-4">
        <SubmitButton
          pendingLabel="Importando..."
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-teal-700 bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm shadow-teal-950/10 transition hover:border-teal-800 hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Upload aria-hidden="true" className="size-4" />
          Importar precios
        </SubmitButton>
      </div>
    </form>
  );
}
