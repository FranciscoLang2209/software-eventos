import { redirect } from "next/navigation";
import { getCurrentProfile, type CurrentProfile } from "@/lib/auth";
import { getAssignedActiveSalones } from "@/lib/eventos/queries";
import { logSupabaseError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type { Enums, Tables } from "@/types/database.types";

type EstadoEvento = Enums<"estado_evento">;

export type ReportesGeneralesFilters = {
  estado?: EstadoEvento;
  fechaDesde?: string;
  fechaHasta?: string;
  salonId?: string;
  vendedorId?: string;
};

export type ReportesGeneralesSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type ReportesGeneralesRow = {
  cantidad: number;
  id: string;
  label: string;
};

export type ReportesGeneralesPendiente = {
  cliente: string;
  fechaEvento: string;
  id: string;
  saldoPendiente: number;
  salon: string;
  totalEstimado: number;
  vendedor: string;
};

export type ReportesGeneralesData = {
  filters: ReportesGeneralesFilters;
  metrics: {
    balanceSimple: number;
    eventosTotal: number;
    saldoPendiente: number;
    totalEgresos: number;
    totalEstimadoVendido: number;
    totalIngresos: number;
  };
  options: {
    estados: EstadoEvento[];
    salones: Pick<Tables<"salones">, "id" | "nombre">[];
    vendedores: Pick<Tables<"usuarios">, "id" | "full_name" | "email">[];
  };
  pendientes: ReportesGeneralesPendiente[];
  porEstado: ReportesGeneralesRow[];
  porSalon: ReportesGeneralesRow[];
  porVendedor: ReportesGeneralesRow[];
  profile: CurrentProfile;
};

type ReporteEvento = Pick<
  Tables<"eventos">,
  | "cliente_nombre"
  | "estado"
  | "fecha_evento"
  | "id"
  | "nombre_evento"
  | "salon_id"
  | "vendedor_id"
> & {
  salones: Pick<Tables<"salones">, "nombre"> | null;
  usuarios: Pick<Tables<"usuarios">, "full_name" | "email"> | null;
};

type MovimientoRow = {
  importe_en_pesos: number | null;
};

type FilterQuery = {
  eq: (column: string, value: string) => unknown;
  gte: (column: string, value: string) => unknown;
  lte: (column: string, value: string) => unknown;
};

type ResumenEventoRow = Pick<
  Tables<"v_resumen_evento">,
  | "id"
  | "saldo_catering"
  | "saldo_servicios"
  | "total_catering"
  | "total_servicios"
>;

const ESTADOS_EVENTO: EstadoEvento[] = [
  "borrador",
  "confirmado",
  "realizado",
  "cancelado",
];

export async function getReportesGenerales(
  searchParams: ReportesGeneralesSearchParams = {},
): Promise<ReportesGeneralesData> {
  const profile = await getActiveProfile();
  const isAdmin = profile.rol === "admin";
  const filters = parseFilters(searchParams, isAdmin);

  const [salones, vendedores] = await Promise.all([
    getSalonesOptions(profile),
    isAdmin ? getVendedoresOptions() : Promise.resolve([]),
  ]);
  const allowedSalonIds = isAdmin ? null : salones.map((salon) => salon.id);

  if (allowedSalonIds !== null && allowedSalonIds.length === 0) {
    return getEmptyReport({ filters, profile, salones, vendedores });
  }

  if (
    filters.salonId &&
    allowedSalonIds !== null &&
    !allowedSalonIds.includes(filters.salonId)
  ) {
    return getEmptyReport({ filters, profile, salones, vendedores });
  }

  const [eventosResult, pagosResult, egresosResult] = await Promise.all([
    getEventosReporte({ allowedSalonIds, filters }),
    getPagosReporte({ allowedSalonIds, filters }),
    getEgresosReporte({ allowedSalonIds, filters }),
  ]);

  const eventos = eventosResult;
  const resumen = await getResumenEventos(eventos.map((evento) => evento.id));
  const resumenByEvento = new Map(
    resumen
      .filter((row) => row.id)
      .map((row) => [row.id as string, row] as const),
  );
  const totalIngresos = sumImporteEnPesos(pagosResult);
  const totalEgresos = sumImporteEnPesos(egresosResult);
  const totalEstimadoVendido = roundMoney(
    resumen.reduce(
      (total, row) =>
        total +
        toMoneyNumber(row.total_catering) +
        toMoneyNumber(row.total_servicios),
      0,
    ),
  );
  const saldoPendiente = roundMoney(
    resumen.reduce(
      (total, row) =>
        total +
        toMoneyNumber(row.saldo_catering) +
        toMoneyNumber(row.saldo_servicios),
      0,
    ),
  );

  return {
    filters,
    metrics: {
      balanceSimple: roundMoney(totalIngresos - totalEgresos),
      eventosTotal: eventos.length,
      saldoPendiente,
      totalEgresos,
      totalEstimadoVendido,
      totalIngresos,
    },
    options: {
      estados: ESTADOS_EVENTO,
      salones,
      vendedores,
    },
    pendientes: getEventosPendientes(eventos, resumenByEvento),
    porEstado: groupEventos(eventos, (evento) => ({
      id: evento.estado,
      label: getEstadoLabel(evento.estado),
    })),
    porSalon: groupEventos(eventos, (evento) => ({
      id: evento.salon_id,
      label: evento.salones?.nombre ?? "Salon sin nombre",
    })),
    porVendedor: isAdmin
      ? groupEventos(eventos, (evento) => ({
          id: evento.vendedor_id,
          label:
            evento.usuarios?.full_name ?? evento.usuarios?.email ?? "Sin vendedor",
        }))
      : [],
    profile,
  };
}

function parseFilters(
  searchParams: ReportesGeneralesSearchParams,
  includeVendedor: boolean,
): ReportesGeneralesFilters {
  const estado = getSingleValue(searchParams.estado);

  return {
    estado: isEstadoEvento(estado) ? estado : undefined,
    fechaDesde: getDateValue(searchParams.desde),
    fechaHasta: getDateValue(searchParams.hasta),
    salonId: getUuidLikeValue(searchParams.salon),
    vendedorId: includeVendedor
      ? getUuidLikeValue(searchParams.vendedor)
      : undefined,
  };
}

async function getActiveProfile() {
  const profile = await getCurrentProfile();

  if (!profile?.activo) {
    redirect("/dashboard");
  }

  return profile;
}

async function getSalonesOptions(profile: CurrentProfile) {
  if (profile.rol === "vendedor") {
    const salones = await getAssignedActiveSalones(profile.id);

    return salones.map(({ id, nombre }) => ({ id, nombre }));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("salones")
    .select("id, nombre")
    .eq("activo", true)
    .is("deleted_at", null)
    .order("nombre", { ascending: true });

  if (error) {
    logSupabaseError("getReportesGenerales salones", error);
    throw new Error("No se pudo obtener el listado de salones.");
  }

  return data;
}

async function getVendedoresOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, full_name, email")
    .eq("rol", "vendedor")
    .eq("activo", true)
    .order("full_name", { ascending: true });

  if (error) {
    logSupabaseError("getReportesGenerales vendedores", error);
    throw new Error("No se pudo obtener el listado de vendedores.");
  }

  return data;
}

async function getEventosReporte({
  allowedSalonIds,
  filters,
}: {
  allowedSalonIds: string[] | null;
  filters: ReportesGeneralesFilters;
}) {
  const supabase = await createClient();
  const query = supabase
    .from("eventos")
    .select(
      "id, cliente_nombre, estado, fecha_evento, nombre_evento, salon_id, vendedor_id, salones(nombre), usuarios(full_name, email)",
    )
    .is("deleted_at", null)
    .order("fecha_evento", { ascending: true });

  applyEventoFilters(query, filters);

  if (allowedSalonIds !== null) {
    query.in("salon_id", allowedSalonIds);
  }

  const { data, error } = await query;

  if (error) {
    logSupabaseError("getReportesGenerales eventos", error);
    throw new Error("No se pudieron obtener los eventos del reporte.");
  }

  return data as ReporteEvento[];
}

async function getPagosReporte({
  allowedSalonIds,
  filters,
}: {
  allowedSalonIds: string[] | null;
  filters: ReportesGeneralesFilters;
}) {
  const supabase = await createClient();
  const query = supabase
    .from("pagos")
    .select(
      "importe_en_pesos, eventos!inner(salon_id, vendedor_id, estado, deleted_at)",
    )
    .is("deleted_at", null)
    .is("eventos.deleted_at", null);

  applyMovimientoFilters(query, filters, "fecha_pago");

  if (allowedSalonIds !== null) {
    query.in("eventos.salon_id", allowedSalonIds);
  }

  const { data, error } = await query;

  if (error) {
    logSupabaseError("getReportesGenerales pagos", error);
    throw new Error("No se pudieron obtener los ingresos del reporte.");
  }

  return data as MovimientoRow[];
}

async function getEgresosReporte({
  allowedSalonIds,
  filters,
}: {
  allowedSalonIds: string[] | null;
  filters: ReportesGeneralesFilters;
}) {
  const supabase = await createClient();
  const query = supabase
    .from("egresos")
    .select(
      "importe_en_pesos, eventos!inner(salon_id, vendedor_id, estado, deleted_at)",
    )
    .is("deleted_at", null)
    .is("eventos.deleted_at", null);

  applyMovimientoFilters(query, filters, "fecha_egreso");

  if (allowedSalonIds !== null) {
    query.in("eventos.salon_id", allowedSalonIds);
  }

  const { data, error } = await query;

  if (error) {
    logSupabaseError("getReportesGenerales egresos", error);
    throw new Error("No se pudieron obtener los egresos del reporte.");
  }

  return data as MovimientoRow[];
}

async function getResumenEventos(eventoIds: string[]) {
  if (eventoIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_resumen_evento")
    .select("id, total_catering, total_servicios, saldo_catering, saldo_servicios")
    .in("id", eventoIds);

  if (error) {
    logSupabaseError("getReportesGenerales resumen", error);
    throw new Error("No se pudo obtener el resumen financiero del reporte.");
  }

  return data as ResumenEventoRow[];
}

function applyEventoFilters(query: FilterQuery, filters: ReportesGeneralesFilters) {
  if (filters.fechaDesde) {
    query.gte("fecha_evento", filters.fechaDesde);
  }

  if (filters.fechaHasta) {
    query.lte("fecha_evento", filters.fechaHasta);
  }

  if (filters.salonId) {
    query.eq("salon_id", filters.salonId);
  }

  if (filters.vendedorId) {
    query.eq("vendedor_id", filters.vendedorId);
  }

  if (filters.estado) {
    query.eq("estado", filters.estado);
  }
}

function applyMovimientoFilters(
  query: FilterQuery,
  filters: ReportesGeneralesFilters,
  dateColumn: "fecha_egreso" | "fecha_pago",
) {
  if (filters.fechaDesde) {
    query.gte(dateColumn, filters.fechaDesde);
  }

  if (filters.fechaHasta) {
    query.lte(dateColumn, filters.fechaHasta);
  }

  if (filters.salonId) {
    query.eq("eventos.salon_id", filters.salonId);
  }

  if (filters.vendedorId) {
    query.eq("eventos.vendedor_id", filters.vendedorId);
  }

  if (filters.estado) {
    query.eq("eventos.estado", filters.estado);
  }
}

function getEventosPendientes(
  eventos: ReporteEvento[],
  resumenByEvento: Map<string, ResumenEventoRow>,
) {
  const today = getTodayInputValue();

  return eventos
    .map((evento) => {
      const resumen = resumenByEvento.get(evento.id);
      const saldoPendiente = roundMoney(
        toMoneyNumber(resumen?.saldo_catering) +
          toMoneyNumber(resumen?.saldo_servicios),
      );
      const totalEstimado = roundMoney(
        toMoneyNumber(resumen?.total_catering) +
          toMoneyNumber(resumen?.total_servicios),
      );

      return {
        cliente: evento.nombre_evento ?? evento.cliente_nombre,
        fechaEvento: evento.fecha_evento,
        id: evento.id,
        saldoPendiente,
        salon: evento.salones?.nombre ?? "Salon sin nombre",
        totalEstimado,
        vendedor:
          evento.usuarios?.full_name ?? evento.usuarios?.email ?? "Sin vendedor",
      };
    })
    .filter((evento) => evento.fechaEvento >= today && evento.saldoPendiente > 0)
    .sort((a, b) => a.fechaEvento.localeCompare(b.fechaEvento))
    .slice(0, 8);
}

function groupEventos(
  eventos: ReporteEvento[],
  getGroup: (evento: ReporteEvento) => Pick<ReportesGeneralesRow, "id" | "label">,
) {
  const groups = new Map<string, ReportesGeneralesRow>();

  for (const evento of eventos) {
    const group = getGroup(evento);
    const current = groups.get(group.id) ?? {
      cantidad: 0,
      id: group.id,
      label: group.label,
    };

    current.cantidad += 1;
    groups.set(group.id, current);
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (b.cantidad !== a.cantidad) {
      return b.cantidad - a.cantidad;
    }

    return a.label.localeCompare(b.label, "es");
  });
}

function getEmptyReport({
  filters,
  profile,
  salones,
  vendedores,
}: {
  filters: ReportesGeneralesFilters;
  profile: CurrentProfile;
  salones: Pick<Tables<"salones">, "id" | "nombre">[];
  vendedores: Pick<Tables<"usuarios">, "id" | "full_name" | "email">[];
}): ReportesGeneralesData {
  return {
    filters,
    metrics: {
      balanceSimple: 0,
      eventosTotal: 0,
      saldoPendiente: 0,
      totalEgresos: 0,
      totalEstimadoVendido: 0,
      totalIngresos: 0,
    },
    options: {
      estados: ESTADOS_EVENTO,
      salones,
      vendedores,
    },
    pendientes: [],
    porEstado: [],
    porSalon: [],
    porVendedor: [],
    profile,
  };
}

function sumImporteEnPesos(rows: MovimientoRow[]) {
  return roundMoney(
    rows.reduce((total, row) => total + toMoneyNumber(row.importe_en_pesos), 0),
  );
}

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getDateValue(value: string | string[] | undefined) {
  const date = getSingleValue(value);

  return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
}

function getUuidLikeValue(value: string | string[] | undefined) {
  const id = getSingleValue(value);

  return id && id !== "all" ? id : undefined;
}

function isEstadoEvento(value: string | undefined): value is EstadoEvento {
  return Boolean(value && ESTADOS_EVENTO.includes(value as EstadoEvento));
}

function getEstadoLabel(estado: EstadoEvento) {
  const labels: Record<EstadoEvento, string> = {
    borrador: "Borrador",
    cancelado: "Cancelado",
    confirmado: "Confirmado",
    realizado: "Realizado",
  };

  return labels[estado];
}

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function toMoneyNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
