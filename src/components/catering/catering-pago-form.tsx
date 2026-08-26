"use client";

import { useActionState, useEffect, useRef } from "react";
import { SubmitButton } from "@/components/salones/submit-button";
import { DatePickerField } from "@/components/ui/date-picker-field";
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
import { pagoFormaPagoOptions, type PagoFormState } from "@/lib/pagos/validation";

type CateringPagoFormProps = {
  action: (
    previousState: PagoFormState,
    formData: FormData,
  ) => Promise<PagoFormState>;
  initialState: PagoFormState;
};

export function CateringPagoForm({ action, initialState }: CateringPagoFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.successMessage) {
      formRef.current?.reset();
    }
  }, [state.successMessage]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5" noValidate>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor="monto">Monto cobrado</Label>
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
          <Label htmlFor="fecha_pago">Fecha de pago</Label>
          <DatePickerField
            key={`fecha-pago-${state.fields.fecha_pago}`}
            id="fecha_pago"
            name="fecha_pago"
            required
            defaultValue={state.fields.fecha_pago}
            aria-invalid={Boolean(state.errors.fecha_pago)}
            aria-describedby={
              state.errors.fecha_pago ? "fecha_pago-error" : undefined
            }
          />
          {state.errors.fecha_pago ? (
            <FieldError id="fecha_pago-error">{state.errors.fecha_pago}</FieldError>
          ) : null}
        </div>

        <div>
          <Label htmlFor="forma_pago">Forma de pago</Label>
          <Select
            name="forma_pago"
            required
            defaultValue={state.fields.forma_pago}
            key={`forma-${state.fields.forma_pago}`}
          >
            <SelectTrigger
              id="forma_pago"
              aria-invalid={Boolean(state.errors.forma_pago)}
              aria-describedby={
                state.errors.forma_pago ? "forma_pago-error" : undefined
              }
            >
              <SelectValue placeholder="Seleccionar forma de pago" />
            </SelectTrigger>
            <SelectContent>
              {pagoFormaPagoOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {getFormaPagoLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.errors.forma_pago ? (
            <FieldError id="forma_pago-error">{state.errors.forma_pago}</FieldError>
          ) : null}
        </div>

        <div>
          <Label htmlFor="concepto">Concepto</Label>
          <Input
            id="concepto"
            name="concepto"
            type="text"
            defaultValue={state.fields.concepto}
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="notas">Notas</Label>
          <Textarea
            id="notas"
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
        <SubmitButton pendingLabel="Registrando...">Registrar pago</SubmitButton>
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
