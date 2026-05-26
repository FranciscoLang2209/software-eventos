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
import {
  egresoFormaPagoOptions,
  type EgresoFormState,
} from "@/lib/egresos/validation";
import type { EventoServicioPagoOption } from "@/lib/evento-servicios/queries";

type EgresoFormProps = {
  action: (
    previousState: EgresoFormState,
    formData: FormData,
  ) => Promise<EgresoFormState>;
  initialState: EgresoFormState;
  servicios: EventoServicioPagoOption[];
};

export function EgresoForm({
  action,
  initialState,
  servicios,
}: EgresoFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const formaPagoValue = state.successMessage
    ? initialState.fields.forma_pago
    : state.fields.forma_pago || "sin_especificar";
  const eventoServicioValue = state.successMessage
    ? "sin_asociar"
    : state.fields.evento_servicio_id || "sin_asociar";

  useEffect(() => {
    if (state.successMessage) {
      formRef.current?.reset();
    }
  }, [state.successMessage]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5" noValidate>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor="categoria">Categoria</Label>
          <Input
            id="categoria"
            name="categoria"
            type="text"
            required
            defaultValue={state.fields.categoria}
            placeholder="Catering, DJ, proveedor..."
            aria-invalid={Boolean(state.errors.categoria)}
            aria-describedby={
              state.errors.categoria ? "categoria-error" : undefined
            }
          />
          {state.errors.categoria ? (
            <FieldError id="categoria-error">
              {state.errors.categoria}
            </FieldError>
          ) : null}
        </div>

        <div>
          <Label htmlFor="concepto">Concepto</Label>
          <Input
            id="concepto"
            name="concepto"
            type="text"
            required
            defaultValue={state.fields.concepto}
            aria-invalid={Boolean(state.errors.concepto)}
            aria-describedby={
              state.errors.concepto ? "concepto-error" : undefined
            }
          />
          {state.errors.concepto ? (
            <FieldError id="concepto-error">{state.errors.concepto}</FieldError>
          ) : null}
        </div>

        <div>
          <Label htmlFor="monto">Monto del gasto</Label>
          <Input
            id="monto"
            name="monto"
            type="number"
            min="0.01"
            step="0.01"
            required
            defaultValue={state.fields.monto}
            aria-invalid={Boolean(state.errors.monto)}
            aria-describedby={state.errors.monto ? "monto-error" : undefined}
          />
          {state.errors.monto ? (
            <FieldError id="monto-error">{state.errors.monto}</FieldError>
          ) : null}
        </div>

        <div>
          <Label htmlFor="fecha_egreso">Fecha de egreso</Label>
          <Input
            id="fecha_egreso"
            name="fecha_egreso"
            type="date"
            required
            defaultValue={state.fields.fecha_egreso}
            aria-invalid={Boolean(state.errors.fecha_egreso)}
            aria-describedby={
              state.errors.fecha_egreso ? "fecha_egreso-error" : undefined
            }
          />
          {state.errors.fecha_egreso ? (
            <FieldError id="fecha_egreso-error">
              {state.errors.fecha_egreso}
            </FieldError>
          ) : null}
        </div>

        <div>
          <Label htmlFor="forma_pago_egreso">Forma de pago</Label>
          <Select
            name="forma_pago"
            defaultValue={formaPagoValue}
            key={`forma-egreso-${formaPagoValue}`}
          >
            <SelectTrigger
              id="forma_pago_egreso"
              aria-invalid={Boolean(state.errors.forma_pago)}
              aria-describedby={
                state.errors.forma_pago ? "forma_pago_egreso-error" : undefined
              }
            >
              <SelectValue placeholder="Seleccionar forma de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sin_especificar">Sin especificar</SelectItem>
              {egresoFormaPagoOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {getFormaPagoLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.errors.forma_pago ? (
            <FieldError id="forma_pago_egreso-error">
              {state.errors.forma_pago}
            </FieldError>
          ) : null}
        </div>

        <div>
          <Label htmlFor="proveedor">Proveedor</Label>
          <Input
            id="proveedor"
            name="proveedor"
            type="text"
            defaultValue={state.fields.proveedor}
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="egreso_evento_servicio_id">Servicio asociado</Label>
          <Select
            name="evento_servicio_id"
            defaultValue={eventoServicioValue}
            key={`servicio-egreso-${eventoServicioValue}`}
          >
            <SelectTrigger id="egreso_evento_servicio_id">
              <SelectValue placeholder="Sin asociar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sin_asociar">Sin asociar</SelectItem>
              {servicios.map((servicio) => (
                <SelectItem key={servicio.id} value={servicio.id}>
                  {servicio.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="notas_egreso">Notas</Label>
          <Textarea
            id="notas_egreso"
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
        <SubmitButton pendingLabel="Registrando...">
          Registrar egreso
        </SubmitButton>
      </div>
    </form>
  );
}

function getFormaPagoLabel(value: string) {
  const labels: Record<string, string> = {
    cheque: "Cheque",
    efectivo_pesos: "Efectivo pesos",
    retenciones: "Retenciones",
    transferencia: "Transferencia",
  };

  return labels[value] ?? value;
}
