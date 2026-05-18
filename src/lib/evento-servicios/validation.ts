export type EventoServicioFormFields = {
  servicio_id: string;
  precio_base: string;
  adicionales_monto: string;
  iva_porcentaje: string;
  proveedor: string;
  notas: string;
};

export type EventoServicioFormErrors = Partial<
  Record<keyof EventoServicioFormFields, string>
>;

export type EventoServicioFormState = {
  fields: EventoServicioFormFields;
  errors: EventoServicioFormErrors;
  formError: string | null;
  successMessage: string | null;
};

export type EventoServicioPayload = {
  servicio_id: string;
  precio_base: number;
  adicionales_monto: number;
  iva_porcentaje: number;
  proveedor: string | null;
  notas: string | null;
  total_sin_iva: number;
  total_con_iva: number;
};

export function getEmptyEventoServicioFormState(): EventoServicioFormState {
  return {
    fields: {
      servicio_id: "",
      precio_base: "",
      adicionales_monto: "0",
      iva_porcentaje: "0",
      proveedor: "",
      notas: "",
    },
    errors: {},
    formError: null,
    successMessage: null,
  };
}

export function getEventoServicioFormState(
  fields: EventoServicioFormFields,
): EventoServicioFormState {
  return {
    fields,
    errors: {},
    formError: null,
    successMessage: null,
  };
}

export function validateEventoServicioForm(formData: FormData): {
  state: EventoServicioFormState;
  payload: EventoServicioPayload | null;
} {
  const fields = getEventoServicioFields(formData);
  const errors: EventoServicioFormErrors = {};
  const servicioId = fields.servicio_id.trim();
  const precioBase = parseRequiredMoney(
    fields.precio_base,
    "precio_base",
    "Ingresa el precio base.",
    errors,
  );
  const adicionalesMonto = parseOptionalMoney(
    fields.adicionales_monto,
    "adicionales_monto",
    errors,
  );
  const ivaPorcentaje = parseOptionalPercentage(
    fields.iva_porcentaje,
    errors,
  );

  if (!servicioId) {
    errors.servicio_id = "Selecciona un servicio.";
  }

  if (
    precioBase !== null &&
    adicionalesMonto !== null &&
    precioBase + adicionalesMonto <= 0
  ) {
    errors.precio_base = "El total del servicio debe ser mayor a 0.";
  }

  if (
    Object.keys(errors).length > 0 ||
    !servicioId ||
    precioBase === null ||
    adicionalesMonto === null ||
    ivaPorcentaje === null
  ) {
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

  const totalSinIva = roundMoney(precioBase + adicionalesMonto);
  const totalConIva = roundMoney(totalSinIva * (1 + ivaPorcentaje / 100));

  return {
    state: {
      fields,
      errors: {},
      formError: null,
      successMessage: null,
    },
    payload: {
      adicionales_monto: adicionalesMonto,
      iva_porcentaje: ivaPorcentaje,
      notas: nullableTrim(fields.notas),
      precio_base: precioBase,
      proveedor: nullableTrim(fields.proveedor),
      servicio_id: servicioId,
      total_con_iva: totalConIva,
      total_sin_iva: totalSinIva,
    },
  };
}

export function getEventoServicioFields(
  formData: FormData,
): EventoServicioFormFields {
  return {
    adicionales_monto: getString(formData, "adicionales_monto"),
    iva_porcentaje: getString(formData, "iva_porcentaje"),
    notas: getString(formData, "notas"),
    precio_base: getString(formData, "precio_base"),
    proveedor: getString(formData, "proveedor"),
    servicio_id: getString(formData, "servicio_id"),
  };
}

export function getEventoServicioFieldsFromValues({
  adicionales_monto,
  iva_porcentaje,
  notas,
  precio_base,
  proveedor,
  servicio_id,
}: {
  adicionales_monto: number | null;
  iva_porcentaje: number | null;
  notas: string | null;
  precio_base: number | null;
  proveedor: string | null;
  servicio_id: string;
}): EventoServicioFormFields {
  return {
    adicionales_monto: formatFormNumber(adicionales_monto ?? 0),
    iva_porcentaje: formatFormNumber(iva_porcentaje ?? 0),
    notas: notas ?? "",
    precio_base: formatFormNumber(precio_base ?? 0),
    proveedor: proveedor ?? "",
    servicio_id,
  };
}

function parseRequiredMoney(
  value: string,
  field: "precio_base",
  requiredMessage: string,
  errors: EventoServicioFormErrors,
) {
  const text = normalizeNumberText(value);

  if (!text) {
    errors[field] = requiredMessage;
    return null;
  }

  const numberValue = Number(text);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    errors[field] = "Ingresa un monto valido.";
    return null;
  }

  return roundMoney(numberValue);
}

function parseOptionalMoney(
  value: string,
  field: "adicionales_monto",
  errors: EventoServicioFormErrors,
) {
  const text = normalizeNumberText(value);

  if (!text) {
    return 0;
  }

  const numberValue = Number(text);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    errors[field] = "Ingresa un monto valido.";
    return null;
  }

  return roundMoney(numberValue);
}

function parseOptionalPercentage(
  value: string,
  errors: EventoServicioFormErrors,
) {
  const text = normalizeNumberText(value);

  if (!text) {
    return 0;
  }

  const numberValue = Number(text);

  if (!Number.isFinite(numberValue) || numberValue < 0 || numberValue > 100) {
    errors.iva_porcentaje = "Ingresa un porcentaje entre 0 y 100.";
    return null;
  }

  return roundMoney(numberValue);
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function normalizeNumberText(value: string) {
  return value.trim().replace(",", ".");
}

function nullableTrim(value: string) {
  const trimmed = value.trim();

  return trimmed || null;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatFormNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(value);
}
