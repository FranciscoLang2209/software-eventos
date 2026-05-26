import type { Enums } from "@/types/database.types";

export type EgresoFormaPago = Enums<"forma_pago">;

export const egresoFormaPagoOptions = [
  "efectivo_pesos",
  "transferencia",
  "cheque",
  "retenciones",
] as const satisfies readonly EgresoFormaPago[];

export type EgresoFormFields = {
  categoria: string;
  concepto: string;
  proveedor: string;
  monto: string;
  fecha_egreso: string;
  forma_pago: string;
  evento_servicio_id: string;
  notas: string;
};

export type EgresoFormErrors = Partial<Record<keyof EgresoFormFields, string>>;

export type EgresoFormState = {
  fields: EgresoFormFields;
  errors: EgresoFormErrors;
  formError: string | null;
  successMessage: string | null;
};

export type EgresoPayload = {
  categoria: string;
  concepto: string;
  proveedor: string | null;
  monto: number;
  fecha_egreso: string;
  forma_pago: (typeof egresoFormaPagoOptions)[number] | null;
  evento_servicio_id: string | null;
  notas: string | null;
};

export function getEmptyEgresoFormState(): EgresoFormState {
  return {
    fields: {
      categoria: "",
      concepto: "",
      proveedor: "",
      monto: "",
      fecha_egreso: getTodayInputValue(),
      forma_pago: "transferencia",
      evento_servicio_id: "",
      notas: "",
    },
    errors: {},
    formError: null,
    successMessage: null,
  };
}

export function validateEgresoForm(formData: FormData): {
  state: EgresoFormState;
  payload: EgresoPayload | null;
} {
  const fields = getEgresoFields(formData);
  const errors: EgresoFormErrors = {};
  const categoria = fields.categoria.trim();
  const concepto = fields.concepto.trim();
  const monto = parseRequiredAmount(fields.monto, errors);
  const fechaEgreso = fields.fecha_egreso.trim();
  const formaPago = fields.forma_pago.trim();
  const formaPagoPermitida =
    !formaPago || formaPago === "sin_especificar"
      ? null
      : isAllowedFormaPago(formaPago)
        ? formaPago
        : undefined;

  if (!categoria) {
    errors.categoria = "Ingresa una categoria.";
  }

  if (!concepto) {
    errors.concepto = "Ingresa el concepto del gasto.";
  }

  if (!fechaEgreso) {
    errors.fecha_egreso = "Ingresa la fecha del egreso.";
  } else if (!isDateInputValue(fechaEgreso)) {
    errors.fecha_egreso = "Ingresa una fecha valida.";
  }

  if (formaPagoPermitida === undefined) {
    errors.forma_pago = "Selecciona una forma de pago valida.";
  }

  if (Object.keys(errors).length > 0 || monto === null) {
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
      categoria,
      concepto,
      proveedor: nullableTrim(fields.proveedor),
      monto,
      fecha_egreso: fechaEgreso,
      forma_pago: formaPagoPermitida ?? null,
      evento_servicio_id: nullableSelectValue(fields.evento_servicio_id),
      notas: nullableTrim(fields.notas),
    },
  };
}

function getEgresoFields(formData: FormData): EgresoFormFields {
  return {
    categoria: getString(formData, "categoria"),
    concepto: getString(formData, "concepto"),
    proveedor: getString(formData, "proveedor"),
    monto: getString(formData, "monto"),
    fecha_egreso: getString(formData, "fecha_egreso"),
    forma_pago: getString(formData, "forma_pago"),
    evento_servicio_id: getString(formData, "evento_servicio_id"),
    notas: getString(formData, "notas"),
  };
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function parseRequiredAmount(value: string, errors: EgresoFormErrors) {
  const text = value.trim().replace(",", ".");

  if (!text) {
    errors.monto = "Ingresa el monto del gasto.";
    return null;
  }

  const numberValue = Number(text);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    errors.monto = "El monto debe ser mayor a 0.";
    return null;
  }

  return numberValue;
}

function isAllowedFormaPago(
  value: string,
): value is NonNullable<EgresoPayload["forma_pago"]> {
  return egresoFormaPagoOptions.some((option) => option === value);
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
