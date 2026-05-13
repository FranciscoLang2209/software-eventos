"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/salones/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkboxClassName, FormAlert } from "@/components/ui/form";
import { emptySalonAssignmentsFormState } from "@/lib/salones/asignaciones-validation";
import type { SalonAssignmentsFormState } from "@/lib/salones/asignaciones-validation";
import type { Salon, Vendedor } from "@/lib/salones/queries";

type SalonAssignmentsFormProps = {
  action: (
    previousState: SalonAssignmentsFormState,
    formData: FormData,
  ) => Promise<SalonAssignmentsFormState>;
  assignedSalonIds: string[];
  salones: Salon[];
  vendedor: Vendedor;
};

export function SalonAssignmentsForm({
  action,
  assignedSalonIds,
  salones,
  vendedor,
}: SalonAssignmentsFormProps) {
  const [state, formAction] = useActionState(
    action,
    emptySalonAssignmentsFormState,
  );
  const assignedSalonSet = new Set(assignedSalonIds);

  return (
    <form action={formAction}>
      <input name="usuario_id" type="hidden" value={vendedor.id} />
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{vendedor.full_name}</CardTitle>
            <p className="mt-1 text-sm text-slate-500">{vendedor.email}</p>
          </div>
          <Badge variant="primary">
            {assignedSalonIds.length === 1
              ? "1 salon"
              : `${assignedSalonIds.length} salones`}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {salones.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {salones.map((salon) => (
                <label
                  key={salon.id}
                  className="flex min-h-20 items-start gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm transition hover:border-slate-300 hover:bg-white"
                >
                  <input
                    name="salon_ids"
                    type="checkbox"
                    value={salon.id}
                    defaultChecked={assignedSalonSet.has(salon.id)}
                    className={checkboxClassName}
                  />
                  <span>
                    <span className="block font-medium text-slate-950">
                      {salon.nombre}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      {getSalonDetail(salon)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No hay salones activos disponibles para asignar.
            </div>
          )}

          {state.formError ? <FormAlert>{state.formError}</FormAlert> : null}
          {state.successMessage ? (
            <FormAlert variant="success">{state.successMessage}</FormAlert>
          ) : null}

          <div className="flex justify-end">
            <SubmitButton pendingLabel="Guardando...">
              Guardar asignaciones
            </SubmitButton>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function getSalonDetail(salon: Salon) {
  const details = [
    salon.direccion,
    salon.capacidad !== null ? `${salon.capacidad} personas` : null,
  ].filter(Boolean);

  return details.length > 0 ? details.join(" - ") : "Sin detalles cargados";
}
