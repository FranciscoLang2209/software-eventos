import type { Json } from "../../types/database.types";

export type AuditJsonObject = Record<string, Json | undefined>;

const TABLE_LABELS: Record<string, string> = {
  actualizaciones_ipc: "Actualizaciones por IPC",
  catering_contratos: "Contratos de catering",
  catering_items: "Items de catering",
  egresos: "Egresos",
  evento_servicios: "Servicios del evento",
  eventos: "Eventos",
  ipc_indices: "Índices IPC",
  pagos: "Ingresos o pagos",
  salones: "Salones",
  servicio_precios_mensuales: "Precios mensuales de servicios",
  servicios_catalogo: "Catalogo de servicios",
  usuario_salon: "Asignaciones de salones",
  usuarios: "Usuarios",
};

const FIELD_LABELS: Record<string, string> = {
  activo: "Estado activo",
  adicionales_monto: "Monto de adicionales",
  banco: "Banco",
  capacidad: "Capacidad",
  categoria: "Categoria",
  cliente_ciudad: "Ciudad del cliente",
  cliente_contacto: "Contacto del cliente",
  cliente_cuit_dni: "CUIT o DNI del cliente",
  cliente_direccion: "Direccion del cliente",
  cliente_direccion_factura: "Direccion de facturacion",
  cliente_nombre: "Cliente",
  cliente_razon_social: "Razon social",
  concepto: "Concepto",
  created_at: "Fecha de creacion",
  deleted_at: "Fecha de eliminacion",
  descripcion: "Descripcion",
  direccion: "Direccion",
  email: "Email",
  emite_factura: "Emite factura",
  es_garantia: "Es garantia",
  espacio: "Espacio",
  estado: "Estado",
  evento_id: "Evento",
  evento_servicio_id: "Servicio del evento",
  factura_cuit: "CUIT de facturacion",
  fecha_carga: "Fecha de carga",
  fecha_contrato: "Fecha de contrato",
  fecha_egreso: "Fecha de egreso",
  fecha_evento: "Fecha del evento",
  fecha_pago: "Fecha de pago",
  forma_pago: "Forma de pago",
  full_name: "Nombre completo",
  id: "ID",
  importe_en_pesos: "Importe en pesos",
  importe_moneda_original: "Importe en moneda original",
  iva_porcentaje: "IVA",
  ipc_indice_id: "Índice IPC",
  moneda: "Moneda",
  nombre: "Nombre",
  nombre_evento: "Nombre del evento",
  notas: "Notas",
  observaciones: "Observaciones",
  organizador_email: "Email del organizador",
  organizador_nombre: "Organizador",
  organizador_telefono: "Telefono del organizador",
  pax_adultos: "Adultos",
  pax_bebes: "Bebes",
  pax_final: "Pax final",
  pax_jovenes: "Jovenes",
  pax_menores: "Menores",
  periodo: "Periodo",
  precio_base: "Precio base",
  proveedor: "Proveedor",
  registrado_por: "Registrado por",
  rol: "Rol",
  saldo_pendiente: "Saldo pendiente",
  salon_id: "Salon",
  salon_ids: "Salones asignados",
  servicio_id: "Servicio",
  tipo_cambio: "Tipo de cambio",
  tipo_evento: "Tipo de evento",
  total_con_iva: "Total con IVA",
  total_pagado: "Total pagado",
  total_sin_iva: "Total sin IVA",
  usuario_id: "Usuario",
  vendedor_id: "Vendedor",
};

export type AuditDisplayAction =
  | "INSERT"
  | "UPDATE"
  | "DELETE"
  | "SOFT_DELETE"
  | "RESTORE"
  | "ASSIGN"
  | "UNASSIGN";

export type AuditChange = {
  field: string;
  label: string;
  before: Json | undefined;
  after: Json | undefined;
};

export function getTableLabel(table: string) {
  return TABLE_LABELS[table] ?? humanizeIdentifier(table);
}

export function getFieldLabel(field: string) {
  return FIELD_LABELS[field] ?? humanizeIdentifier(field);
}

export function getAuditObject(value: Json | null): AuditJsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  return {};
}

export function getAuditChanges(
  beforeValue: Json | null,
  afterValue: Json | null,
): AuditChange[] {
  const before = getAuditObject(beforeValue);
  const after = getAuditObject(afterValue);
  const fields = Array.from(
    new Set([...Object.keys(before), ...Object.keys(after)]),
  ).filter((field) => !jsonValuesEqual(before[field], after[field]));

  return fields.sort().map((field) => ({
    after: after[field],
    before: before[field],
    field,
    label: getFieldLabel(field),
  }));
}

export function getDisplayAction({
  action,
  afterValue,
  beforeValue,
  table,
}: {
  action: string;
  afterValue: Json | null;
  beforeValue: Json | null;
  table: string;
}): AuditDisplayAction {
  if (
    action === "SOFT_DELETE" ||
    action === "RESTORE" ||
    action === "ASSIGN" ||
    action === "UNASSIGN"
  ) {
    return action;
  }

  if (table === "usuario_salon" && action === "INSERT") return "ASSIGN";
  if (table === "usuario_salon" && action === "DELETE") return "UNASSIGN";

  const before = getAuditObject(beforeValue);
  const after = getAuditObject(afterValue);
  const beforeDeletedAt = before.deleted_at;
  const afterDeletedAt = after.deleted_at;

  if (
    (action === "UPDATE" || action === "DELETE") &&
    !beforeDeletedAt &&
    typeof afterDeletedAt === "string" &&
    afterDeletedAt.length > 0
  ) {
    return "SOFT_DELETE";
  }

  if (
    action === "UPDATE" &&
    typeof beforeDeletedAt === "string" &&
    beforeDeletedAt.length > 0 &&
    !afterDeletedAt
  ) {
    return "RESTORE";
  }

  if (action === "INSERT" || action === "DELETE") return action;
  return "UPDATE";
}

export function getActionLabel(action: AuditDisplayAction) {
  const labels: Record<AuditDisplayAction, string> = {
    ASSIGN: "Asignacion",
    DELETE: "Eliminacion",
    INSERT: "Creacion",
    RESTORE: "Restauracion",
    SOFT_DELETE: "Eliminacion logica",
    UNASSIGN: "Desasignacion",
    UPDATE: "Edicion",
  };

  return labels[action];
}

export function getAuditSummary(
  beforeValue: Json | null,
  afterValue: Json | null,
) {
  const changes = getAuditChanges(beforeValue, afterValue);
  if (changes.length === 0) return "Sin campos funcionales para mostrar";

  const labels = changes.slice(0, 3).map((change) => change.label);
  const remaining = changes.length - labels.length;
  return `${labels.join(", ")}${remaining > 0 ? ` y ${remaining} mas` : ""}`;
}

export function formatAuditValue(value: Json | undefined) {
  if (value === null || value === undefined || value === "") return "Sin valor";
  if (typeof value === "boolean") return value ? "Si" : "No";
  if (typeof value === "object") return safeJsonStringify(value);
  return String(value);
}

export function safeJsonStringify(value: Json | null) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "No se pudo representar el JSON original.";
  }
}

function humanizeIdentifier(value: string) {
  const normalized = value.replaceAll("_", " ").trim();
  return normalized
    ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
    : "Sin identificar";
}

function jsonValuesEqual(left: Json | undefined, right: Json | undefined) {
  if (left === right) return true;
  if (left === undefined || right === undefined) return false;
  return safeJsonStringify(left) === safeJsonStringify(right);
}
