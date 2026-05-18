"use client";

import { useActionState, useEffect, useRef } from "react";
import { SubmitButton } from "@/components/salones/submit-button";
import {
  FieldError,
  FormAlert,
  Input,
  Label,
  Textarea,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ServicioCatalogoOption } from "@/lib/evento-servicios/queries";
import type { EventoServicioFormState } from "@/lib/evento-servicios/validation";
import type { Enums } from "@/types/database.types";

type EventoServicioFormProps = {
  action: (
    previousState: EventoServicioFormState,
    formData: FormData,
  ) => Promise<EventoServicioFormState>;
  catalogo: ServicioCatalogoOption[];
  formId: string;
  initialState: EventoServicioFormState;
  resetOnSuccess?: boolean;
  submitLabel: string;
  submittingLabel: string;
};

export function EventoServicioForm({
  action,
  catalogo,
  formId,
  initialState,
  resetOnSuccess = false,
  submitLabel,
  submittingLabel,
}: EventoServicioFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const isCatalogoEmpty = catalogo.length === 0;
  const servicioSelectValue =
    resetOnSuccess && state.successMessage ? "" : state.fields.servicio_id;

  useEffect(() => {
    if (resetOnSuccess && state.successMessage) {
      formRef.current?.reset();
    }
  }, [resetOnSuccess, state.successMessage]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5" noValidate>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor={`${formId}-servicio_id`}>Servicio</Label>
          <Select
            name="servicio_id"
            required
            defaultValue={servicioSelectValue}
            disabled={isCatalogoEmpty}
            key={`${formId}-${servicioSelectValue || "empty"}`}
          >
            <SelectTrigger
              id={`${formId}-servicio_id`}
              aria-invalid={Boolean(state.errors.servicio_id)}
              aria-describedby={
                state.errors.servicio_id
                  ? `${formId}-servicio_id-error`
                  : undefined
              }
            >
              <SelectValue
                placeholder={
                  isCatalogoEmpty
                    ? "No hay servicios activos"
                    : "Seleccionar servicio"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {catalogo.map((servicio) => (
                <SelectItem key={servicio.id} value={servicio.id}>
                  {servicio.nombre} · {getCategoriaServicioLabel(servicio.categoria)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.errors.servicio_id ? (
            <FieldError id={`${formId}-servicio_id-error`}>
              {state.errors.servicio_id}
            </FieldError>
          ) : null}
        </div>

        <div>
          <Label htmlFor={`${formId}-proveedor`}>Proveedor</Label>
          <Input
            id={`${formId}-proveedor`}
            name="proveedor"
            type="text"
            defaultValue={state.fields.proveedor}
          />
        </div>

        <div>
          <Label htmlFor={`${formId}-precio_base`}>Precio base</Label>
          <Input
            id={`${formId}-precio_base`}
            name="precio_base"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={state.fields.precio_base}
            aria-invalid={Boolean(state.errors.precio_base)}
            aria-describedby={
              state.errors.precio_base
                ? `${formId}-precio_base-error`
                : undefined
            }
          />
          {state.errors.precio_base ? (
            <FieldError id={`${formId}-precio_base-error`}>
              {state.errors.precio_base}
            </FieldError>
          ) : null}
        </div>

        <div>
          <Label htmlFor={`${formId}-adicionales_monto`}>Adicionales</Label>
          <Input
            id={`${formId}-adicionales_monto`}
            name="adicionales_monto"
            type="number"
            min="0"
            step="0.01"
            defaultValue={state.fields.adicionales_monto}
            aria-invalid={Boolean(state.errors.adicionales_monto)}
            aria-describedby={
              state.errors.adicionales_monto
                ? `${formId}-adicionales_monto-error`
                : undefined
            }
          />
          {state.errors.adicionales_monto ? (
            <FieldError id={`${formId}-adicionales_monto-error`}>
              {state.errors.adicionales_monto}
            </FieldError>
          ) : null}
        </div>

        <div>
          <Label htmlFor={`${formId}-iva_porcentaje`}>IVA %</Label>
          <Input
            id={`${formId}-iva_porcentaje`}
            name="iva_porcentaje"
            type="number"
            min="0"
            max="100"
            step="0.01"
            defaultValue={state.fields.iva_porcentaje}
            aria-invalid={Boolean(state.errors.iva_porcentaje)}
            aria-describedby={
              state.errors.iva_porcentaje
                ? `${formId}-iva_porcentaje-error`
                : undefined
            }
          />
          {state.errors.iva_porcentaje ? (
            <FieldError id={`${formId}-iva_porcentaje-error`}>
              {state.errors.iva_porcentaje}
            </FieldError>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor={`${formId}-notas`}>Notas</Label>
          <Textarea
            id={`${formId}-notas`}
            name="notas"
            rows={3}
            defaultValue={state.fields.notas}
          />
        </div>
      </div>

      {state.formError ? <FormAlert>{state.formError}</FormAlert> : null}
      {state.successMessage ? (
        <FormAlert variant="success">{state.successMessage}</FormAlert>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton pendingLabel={submittingLabel}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

function getCategoriaServicioLabel(value: Enums<"categoria_servicio">) {
  const labels: Record<Enums<"categoria_servicio">, string> = {
    ambientacion: "Ambientacion",
    catering: "Catering",
    dj: "DJ",
    estacionamiento: "Estacionamiento",
    fotografo: "Fotografo",
    garantia: "Garantia",
    sadaic: "SADAIC",
    salon: "Salon",
    sillas_tiffany: "Sillas Tiffany",
    varios: "Varios",
  };

  return labels[value] ?? value;
}
