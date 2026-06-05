"use client";

import { useActionState, useState } from "react";
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
import type {
  MonthlyServicePriceSuggestion,
  MonthlyServicePriceSuggestions,
} from "@/lib/precios-servicios/precios-mensuales";
import type { Enums } from "@/types/database.types";

type EventoServicioFormProps = {
  action: (
    previousState: EventoServicioFormState,
    formData: FormData,
  ) => Promise<EventoServicioFormState>;
  catalogo: ServicioCatalogoOption[];
  formId: string;
  initialState: EventoServicioFormState;
  monthlyPriceSuggestions?: MonthlyServicePriceSuggestions;
  resetOnSuccess?: boolean;
  submitLabel: string;
  submittingLabel: string;
};

export function EventoServicioForm({
  action,
  catalogo,
  formId,
  initialState,
  monthlyPriceSuggestions = {},
  resetOnSuccess = false,
  submitLabel,
  submittingLabel,
}: EventoServicioFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const renderedState =
    resetOnSuccess && state.successMessage
      ? getResetSuccessState(state.successMessage)
      : state;

  return (
    <EventoServicioFormFields
      key={getFormStateKey(renderedState)}
      catalogo={catalogo}
      formAction={formAction}
      formId={formId}
      monthlyPriceSuggestions={monthlyPriceSuggestions}
      state={renderedState}
      submitLabel={submitLabel}
      submittingLabel={submittingLabel}
    />
  );
}

function EventoServicioFormFields({
  catalogo,
  formAction,
  formId,
  monthlyPriceSuggestions,
  state,
  submitLabel,
  submittingLabel,
}: {
  catalogo: ServicioCatalogoOption[];
  formAction: (formData: FormData) => void;
  formId: string;
  monthlyPriceSuggestions: MonthlyServicePriceSuggestions;
  state: EventoServicioFormState;
  submitLabel: string;
  submittingLabel: string;
}) {
  const isCatalogoEmpty = catalogo.length === 0;
  const servicioSelectValue = state.fields.servicio_id;
  const initialSuggestedFields = getSuggestedPriceFields({
    fields: state.fields,
    monthlyPriceSuggestions,
    servicioId: servicioSelectValue,
  });
  const [servicioId, setServicioId] = useState(servicioSelectValue);
  const [precioBase, setPrecioBase] = useState(
    initialSuggestedFields.precio_base,
  );
  const [ivaPorcentaje, setIvaPorcentaje] = useState(
    initialSuggestedFields.iva_porcentaje,
  );
  const selectedSuggestion = servicioId
    ? (monthlyPriceSuggestions[servicioId] ?? null)
    : null;

  function handleServicioChange(value: string) {
    setServicioId(value);

    const suggestion = monthlyPriceSuggestions[value];

    if (suggestion && isFillablePrecioBase(precioBase)) {
      setPrecioBase(formatFormNumber(suggestion.precio_base));
      setIvaPorcentaje(formatFormNumber(suggestion.iva_porcentaje));
    }
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor={`${formId}-servicio_id`}>Servicio</Label>
          <Select
            name="servicio_id"
            required
            value={servicioId}
            onValueChange={handleServicioChange}
            disabled={isCatalogoEmpty}
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
            value={precioBase}
            onChange={(event) => setPrecioBase(event.target.value)}
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
          <MonthlyPriceHint
            formId={formId}
            hasSelectedService={Boolean(servicioId)}
            suggestion={selectedSuggestion}
          />
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
            value={ivaPorcentaje}
            onChange={(event) => setIvaPorcentaje(event.target.value)}
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

function getResetSuccessState(
  successMessage: string,
): EventoServicioFormState {
  return {
    errors: {},
    fields: {
      adicionales_monto: "0",
      iva_porcentaje: "0",
      notas: "",
      precio_base: "",
      proveedor: "",
      servicio_id: "",
    },
    formError: null,
    successMessage,
  };
}

function getFormStateKey(state: EventoServicioFormState) {
  return JSON.stringify({
    errors: state.errors,
    fields: state.fields,
    formError: state.formError,
    successMessage: state.successMessage,
  });
}

function MonthlyPriceHint({
  formId,
  hasSelectedService,
  suggestion,
}: {
  formId: string;
  hasSelectedService: boolean;
  suggestion: MonthlyServicePriceSuggestion | null;
}) {
  if (!hasSelectedService) {
    return null;
  }

  if (!suggestion) {
    return (
      <p
        id={`${formId}-precio-sugerido`}
        className="mt-2 text-xs text-amber-700"
      >
        Sin precio mensual cargado para este periodo.
      </p>
    );
  }

  const scopeText =
    suggestion.scope === "salon" ? "especifica del salon" : "global";

  return (
    <p
      id={`${formId}-precio-sugerido`}
      className="mt-2 text-xs text-teal-700"
    >
      Precio sugerido desde lista mensual de {suggestion.periodLabel} (
      {scopeText}).
    </p>
  );
}

function isFillablePrecioBase(value: string) {
  return value.trim() === "";
}

function getSuggestedPriceFields({
  fields,
  monthlyPriceSuggestions,
  servicioId,
}: {
  fields: EventoServicioFormState["fields"];
  monthlyPriceSuggestions: MonthlyServicePriceSuggestions;
  servicioId: string;
}) {
  const suggestion = servicioId ? monthlyPriceSuggestions[servicioId] : null;

  if (!suggestion || !isFillablePrecioBase(fields.precio_base)) {
    return {
      iva_porcentaje: fields.iva_porcentaje,
      precio_base: fields.precio_base,
    };
  }

  return {
    iva_porcentaje: formatFormNumber(suggestion.iva_porcentaje),
    precio_base: formatFormNumber(suggestion.precio_base),
  };
}

function formatFormNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(value);
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
