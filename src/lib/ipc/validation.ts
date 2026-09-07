export type IpcFormFields = {
  periodo: string;
  variacion_porcentual: string;
};

export type IpcFormErrors = Partial<Record<keyof IpcFormFields, string>>;

export type IpcPayload = {
  periodo: string;
  variacionPorcentual: number;
};

export type IpcSummary = {
  cantidadEventos: number;
  cantidadServicios: number;
  montoPrecioBaseAnterior: number;
  montoPrecioBaseActualizado: number;
  montoTotalConIvaAnterior: number;
  montoTotalConIvaActualizado: number;
};

export type IpcFormState = {
  errors: IpcFormErrors;
  fields: IpcFormFields;
  formError: string | null;
  successMessage: string | null;
  summary: IpcSummary | null;
};

export const emptyIpcFormFields: IpcFormFields = {
  periodo: getCurrentMonthValue(),
  variacion_porcentual: "",
};

export function getEmptyIpcFormState(): IpcFormState {
  return {
    errors: {},
    fields: emptyIpcFormFields,
    formError: null,
    successMessage: null,
    summary: null,
  };
}

export function validateIpcForm(formData: FormData): {
  errors: IpcFormErrors;
  fields: IpcFormFields;
  payload: IpcPayload | null;
} {
  const fields: IpcFormFields = {
    periodo: getString(formData, "periodo"),
    variacion_porcentual: getString(formData, "variacion_porcentual"),
  };
  const errors: IpcFormErrors = {};
  const periodo = parsePeriod(fields.periodo);
  const variacionPorcentual = parsePercentage(fields.variacion_porcentual);

  if (!periodo) {
    errors.periodo = "Selecciona un período mensual válido.";
  }

  if (variacionPorcentual === null) {
    errors.variacion_porcentual =
      "Ingresa una variación válida mayor a -100%.";
  }

  if (!periodo || variacionPorcentual === null) {
    return { errors, fields, payload: null };
  }

  return {
    errors,
    fields,
    payload: { periodo, variacionPorcentual },
  };
}

function parsePeriod(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (!Number.isInteger(year) || month < 1 || month > 12) return null;

  return `${match[1]}-${match[2]}-01`;
}

function parsePercentage(value: string) {
  const normalized = value.trim().replace(",", ".");

  if (!normalized) return null;

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed <= -100) return null;

  return Math.round((parsed + Number.EPSILON) * 10_000) / 10_000;
}

function getString(formData: FormData, name: keyof IpcFormFields) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function getCurrentMonthValue() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    month: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}`;
}
