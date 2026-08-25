import type { Enums } from "@/types/database.types";

export type PagoFormaPago = Enums<"forma_pago">;

export const pagoFormaPagoOptions = [
  "efectivo_pesos",
  "transferencia",
  "cheque",
  "retenciones",
] as const satisfies readonly PagoFormaPago[];

export type PagoFormFields = {
  monto: string;
  fecha_pago: string;
  forma_pago: string;
  evento_servicio_id: string;
  concepto: string;
  notas: string;
};

export type PagoFormErrors = Partial<Record<keyof PagoFormFields, string>>;

export type PagoFormState = {
  fields: PagoFormFields;
  errors: PagoFormErrors;
  formError: string | null;
  successMessage: string | null;
};

export type PagoPayload = {
  monto: number;
  fecha_pago: string;
  forma_pago: (typeof pagoFormaPagoOptions)[number];
  evento_servicio_id: string | null;
  concepto: string | null;
  notas: string | null;
};

export function getEmptyPagoFormState(): PagoFormState {
  return {
    fields: {
      monto: "",
      fecha_pago: getTodayInputValue(),
      forma_pago: "transferencia",
      evento_servicio_id: "",
      concepto: "",
      notas: "",
    },
    errors: {},
    formError: null,
    successMessage: null,
  };
}

export function validatePagoForm(formData: FormData): {
  state: PagoFormState;
  payload: PagoPayload | null;
} {
  const fields = getPagoFields(formData);
  const errors: PagoFormErrors = {};
  const monto = parseRequiredAmount(fields.monto, errors);
  const fechaPago = fields.fecha_pago.trim();
  const formaPago = fields.forma_pago.trim();
  const formaPagoPermitida = isAllowedFormaPago(formaPago) ? formaPago : null;

  if (!fechaPago) {
    errors.fecha_pago = "Ingresa la fecha de pago.";
  } else if (!isDateInputValue(fechaPago)) {
    errors.fecha_pago = "Ingresa una fecha valida.";
  }

  if (!formaPagoPermitida) {
    errors.forma_pago = "Selecciona una forma de pago valida.";
  }

  if (Object.keys(errors).length > 0 || monto === null || !formaPagoPermitida) {
    return {
      state: {
        fields,
        errors,
        formError: "Revisa los campos marcados.",
        successMessage: null,
      },
      payload: null,
    };
  }

  return {
    state: {
      fields,
      errors: {},
      formError: null,
      successMessage: null,
    },
    payload: {
      monto,
      fecha_pago: fechaPago,
      forma_pago: formaPagoPermitida,
      evento_servicio_id: nullableSelectValue(fields.evento_servicio_id),
      concepto: nullableTrim(fields.concepto),
      notas: nullableTrim(fields.notas),
    },
  };
}

function getPagoFields(formData: FormData): PagoFormFields {
  return {
    monto: getString(formData, "monto"),
    fecha_pago: getString(formData, "fecha_pago"),
    forma_pago: getString(formData, "forma_pago"),
    evento_servicio_id: getString(formData, "evento_servicio_id"),
    concepto: getString(formData, "concepto"),
    notas: getString(formData, "notas"),
  };
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function parseRequiredAmount(value: string, errors: PagoFormErrors) {
  const text = value.trim().replace(",", ".");

  if (!text) {
    errors.monto = "Ingresa el monto cobrado.";
    return null;
  }

  const numberValue = Number(text);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    errors.monto = "El monto debe ser mayor a 0.";
    return null;
  }

  return numberValue;
}

function isAllowedFormaPago(value: string): value is PagoPayload["forma_pago"] {
  return pagoFormaPagoOptions.some((option) => option === value);
}

function nullableTrim(value: string) {
  const trimmed = value.trim();

  return trimmed || null;
}

function nullableSelectValue(value: string) {
  const trimmed = value.trim();

  if (!trimmed || trimmed === "sin_asociar") {
    return null;
  }

  return trimmed;
}

function getTodayInputValue() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function isDateInputValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}
