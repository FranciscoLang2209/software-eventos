"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/components/salones/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  checkboxClassName,
  FieldError,
  FormAlert,
  Input,
  Label,
  Textarea,
} from "@/components/ui/form";
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
    <form action={formAction} className="max-w-4xl" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Datos del salon</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Estos datos se usan para identificar la unidad operativa y su
            disponibilidad comercial.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                type="text"
                required
                defaultValue={state.fields.nombre}
                aria-invalid={Boolean(state.errors.nombre)}
                aria-describedby={
                  state.errors.nombre ? "nombre-error" : undefined
                }
              />
              {state.errors.nombre ? (
                <FieldError id="nombre-error">{state.errors.nombre}</FieldError>
              ) : null}
            </div>

            <div>
              <Label htmlFor="capacidad">Capacidad</Label>
              <Input
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
              />
              {state.errors.capacidad ? (
                <FieldError id="capacidad-error">
                  {state.errors.capacidad}
                </FieldError>
              ) : null}
            </div>

            <div>
              <Label htmlFor="direccion">Direccion</Label>
              <Input
                id="direccion"
                name="direccion"
                type="text"
                defaultValue={state.fields.direccion}
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="descripcion">Descripcion</Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                rows={4}
                defaultValue={state.fields.descripcion}
              />
            </div>

            <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700">
              <input
                name="activo"
                type="checkbox"
                defaultChecked={state.fields.activo}
                className={checkboxClassName}
              />
              Salon activo
            </label>
          </div>

          {state.formError ? (
            <div className="mt-5">
              <FormAlert>{state.formError}</FormAlert>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/salones"
          className={buttonVariants({ variant: "secondary" })}
        >
          Cancelar
        </Link>
        <SubmitButton pendingLabel={pendingLabel}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
