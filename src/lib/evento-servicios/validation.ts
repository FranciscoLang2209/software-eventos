export type EventoServicioFormFields = {
  servicio_id: string;
  precio_base: string;
  adicionales_monto: string;
  iva_base_imponible: string;
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
  iva_base_imponible: number;
  iva_porcentaje: number;
  proveedor: string | null;
  notas: string | null;
  total_sin_iva: number;
  total_con_iva: number;
};

const IVA_RATE_SCALE = 4;

export function calculateEventoServicioTotals({
  adicionalesMonto,
  ivaBaseImponible,
  ivaPorcentaje,
  precioBase,
}: {
  adicionalesMonto: number;
  ivaBaseImponible: number;
  ivaPorcentaje: number;
  precioBase: number;
}) {
  const totalSinIva = roundMoney(precioBase + adicionalesMonto);
  const ivaMonto = roundMoney(ivaBaseImponible * (ivaPorcentaje / 100));
  const totalConIva = roundMoney(totalSinIva + ivaMonto);

  return {
    totalConIva,
    totalSinIva,
  };
}

export function getEmptyEventoServicioFormState(): EventoServicioFormState {
  return {
    fields: {
      servicio_id: "",
      precio_base: "",
      adicionales_monto: "0",
      iva_base_imponible: "0",
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
  const ivaBaseImponible = parseOptionalMoney(
    fields.iva_base_imponible,
    "iva_base_imponible",
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
    precioBase !== null &&
    adicionalesMonto !== null &&
    ivaBaseImponible !== null &&
    ivaBaseImponible > precioBase + adicionalesMonto
  ) {
    errors.iva_base_imponible =
      "La base imponible de IVA no puede superar el subtotal.";
  }

  if (
    Object.keys(errors).length > 0 ||
    !servicioId ||
    precioBase === null ||
    adicionalesMonto === null ||
    ivaBaseImponible === null ||
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

  const { totalConIva, totalSinIva } = calculateEventoServicioTotals({
    adicionalesMonto,
    ivaBaseImponible,
    ivaPorcentaje,
    precioBase,
  });
  const ivaTasa = percentageToRate(ivaPorcentaje);

  return {
    state: {
      fields,
      errors: {},
      formError: null,
      successMessage: null,
    },
    payload: {
      adicionales_monto: adicionalesMonto,
      iva_base_imponible: ivaBaseImponible,
      iva_porcentaje: ivaTasa,
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
    iva_base_imponible: getString(formData, "iva_base_imponible"),
    iva_porcentaje: getString(formData, "iva_porcentaje"),
    notas: getString(formData, "notas"),
    precio_base: getString(formData, "precio_base"),
    proveedor: getString(formData, "proveedor"),
    servicio_id: getString(formData, "servicio_id"),
  };
}

export function getEventoServicioFieldsFromValues({
  adicionales_monto,
  iva_base_imponible,
  iva_porcentaje,
  notas,
  precio_base,
  proveedor,
  servicio_id,
}: {
  adicionales_monto: number | null;
  iva_base_imponible: number | null;
  iva_porcentaje: number | null;
  notas: string | null;
  precio_base: number | null;
  proveedor: string | null;
  servicio_id: string;
}): EventoServicioFormFields {
  return {
    adicionales_monto: formatFormNumber(adicionales_monto ?? 0),
    iva_base_imponible: formatFormNumber(iva_base_imponible ?? 0),
    iva_porcentaje: formatFormNumber(rateToPercentage(iva_porcentaje ?? 0)),
    notas: notas ?? "",
    precio_base: precio_base === null ? "" : formatFormNumber(precio_base),
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
  field: "adicionales_monto" | "iva_base_imponible",
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

function percentageToRate(value: number) {
  return roundToScale(value / 100, IVA_RATE_SCALE);
}

function rateToPercentage(value: number) {
  return roundMoney(value * 100);
}

function roundToScale(value: number, scale: number) {
  const multiplier = 10 ** scale;

  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

function formatFormNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(value);
}
