import type { TablesInsert } from "@/types/database.types";

export type EventoFormFields = {
  salon_id: string;
  vendedor_id: string;
  cliente_nombre: string;
  cliente_razon_social: string;
  cliente_cuit_dni: string;
  cliente_direccion: string;
  cliente_ciudad: string;
  cliente_direccion_factura: string;
  cliente_contacto: string;
  fecha_evento: string;
  fecha_contrato: string;
  tipo_evento: string;
  espacio: string;
  pax_adultos: string;
  pax_jovenes: string;
  pax_menores: string;
  pax_bebes: string;
  organizador_externo: string;
  comision_organizador: string;
  observaciones: string;
};

export type EventoFormErrors = Partial<Record<keyof EventoFormFields, string>>;

export type EventoFormState = {
  fields: EventoFormFields;
  errors: EventoFormErrors;
  formError: string | null;
};

export type EventoPayload = Omit<
  TablesInsert<"eventos">,
  "estado" | "vendedor_id"
> & {
  vendedor_id?: string;
};

export const emptyEventoFormState: EventoFormState = {
  fields: {
    salon_id: "",
    vendedor_id: "",
    cliente_nombre: "",
    cliente_razon_social: "",
    cliente_cuit_dni: "",
    cliente_direccion: "",
    cliente_ciudad: "",
    cliente_direccion_factura: "",
    cliente_contacto: "",
    fecha_evento: "",
    fecha_contrato: "",
    tipo_evento: "",
    espacio: "",
    pax_adultos: "",
    pax_jovenes: "",
    pax_menores: "",
    pax_bebes: "",
    organizador_externo: "",
    comision_organizador: "",
    observaciones: "",
  },
  errors: {},
  formError: null,
};

export function validateEventoForm(formData: FormData): {
  state: EventoFormState;
  payload: EventoPayload | null;
} {
  const fields = getEventoFields(formData);
  const errors: EventoFormErrors = {};
  const salonId = fields.salon_id.trim();
  const vendedorId = fields.vendedor_id.trim();
  const clienteNombre = fields.cliente_nombre.trim();
  const fechaEvento = fields.fecha_evento.trim();
  const fechaContrato = fields.fecha_contrato.trim();

  if (!salonId) {
    errors.salon_id = "Selecciona un salon.";
  }

  if (!clienteNombre) {
    errors.cliente_nombre = "Ingresa el nombre del cliente.";
  }

  if (!fechaEvento) {
    errors.fecha_evento = "Ingresa la fecha del evento.";
  } else if (!isDateInputValue(fechaEvento)) {
    errors.fecha_evento = "Ingresa una fecha valida.";
  }

  if (fechaContrato && !isDateInputValue(fechaContrato)) {
    errors.fecha_contrato = "Ingresa una fecha valida.";
  }

  const paxAdultos = parseOptionalInteger(
    fields.pax_adultos,
    "pax_adultos",
    errors,
  );
  const paxJovenes = parseOptionalInteger(
    fields.pax_jovenes,
    "pax_jovenes",
    errors,
  );
  const paxMenores = parseOptionalInteger(
    fields.pax_menores,
    "pax_menores",
    errors,
  );
  const paxBebes = parseOptionalInteger(
    fields.pax_bebes,
    "pax_bebes",
    errors,
  );
  const comisionOrganizador = parseOptionalNumber(
    fields.comision_organizador,
    "comision_organizador",
    errors,
  );

  if (Object.keys(errors).length > 0) {
    return {
      state: {
        fields,
        errors,
        formError: "Revisa los campos marcados.",
      },
      payload: null,
    };
  }

  return {
    state: {
      fields,
      errors: {},
      formError: null,
    },
    payload: {
      salon_id: salonId,
      vendedor_id: vendedorId || undefined,
      cliente_nombre: clienteNombre,
      cliente_razon_social: nullableTrim(fields.cliente_razon_social),
      cliente_cuit_dni: nullableTrim(fields.cliente_cuit_dni),
      cliente_direccion: nullableTrim(fields.cliente_direccion),
      cliente_ciudad: nullableTrim(fields.cliente_ciudad),
      cliente_direccion_factura: nullableTrim(
        fields.cliente_direccion_factura,
      ),
      cliente_contacto: nullableTrim(fields.cliente_contacto),
      fecha_evento: fechaEvento,
      fecha_contrato: fechaContrato || null,
      tipo_evento: nullableTrim(fields.tipo_evento),
      espacio: nullableTrim(fields.espacio),
      pax_adultos: paxAdultos,
      pax_jovenes: paxJovenes,
      pax_menores: paxMenores,
      pax_bebes: paxBebes,
      organizador_externo: nullableTrim(fields.organizador_externo),
      comision_organizador: comisionOrganizador,
      observaciones: nullableTrim(fields.observaciones),
    },
  };
}

function getEventoFields(formData: FormData): EventoFormFields {
  return {
    salon_id: getString(formData, "salon_id"),
    vendedor_id: getString(formData, "vendedor_id"),
    cliente_nombre: getString(formData, "cliente_nombre"),
    cliente_razon_social: getString(formData, "cliente_razon_social"),
    cliente_cuit_dni: getString(formData, "cliente_cuit_dni"),
    cliente_direccion: getString(formData, "cliente_direccion"),
    cliente_ciudad: getString(formData, "cliente_ciudad"),
    cliente_direccion_factura: getString(
      formData,
      "cliente_direccion_factura",
    ),
    cliente_contacto: getString(formData, "cliente_contacto"),
    fecha_evento: getString(formData, "fecha_evento"),
    fecha_contrato: getString(formData, "fecha_contrato"),
    tipo_evento: getString(formData, "tipo_evento"),
    espacio: getString(formData, "espacio"),
    pax_adultos: getString(formData, "pax_adultos"),
    pax_jovenes: getString(formData, "pax_jovenes"),
    pax_menores: getString(formData, "pax_menores"),
    pax_bebes: getString(formData, "pax_bebes"),
    organizador_externo: getString(formData, "organizador_externo"),
    comision_organizador: getString(formData, "comision_organizador"),
    observaciones: getString(formData, "observaciones"),
  };
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function nullableTrim(value: string) {
  const trimmed = value.trim();

  return trimmed || null;
}

function parseOptionalInteger(
  value: string,
  key: keyof EventoFormFields,
  errors: EventoFormErrors,
) {
  const text = value.trim();

  if (!text) {
    return null;
  }

  const numberValue = Number(text);

  if (!Number.isInteger(numberValue) || numberValue < 0) {
    errors[key] = "Debe ser un numero entero mayor o igual a 0.";
    return null;
  }

  return numberValue;
}

function parseOptionalNumber(
  value: string,
  key: keyof EventoFormFields,
  errors: EventoFormErrors,
) {
  const text = value.trim();

  if (!text) {
    return null;
  }

  const numberValue = Number(text);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    errors[key] = "Debe ser un numero mayor o igual a 0.";
    return null;
  }

  return numberValue;
}

function isDateInputValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}
