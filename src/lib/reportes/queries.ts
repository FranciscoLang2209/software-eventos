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

export type ReportesFinancierosMetricas = {
  egresos_pagados: number;
  eventos_incluidos: number;
  garantias_registradas: number;
  ingresos_cobrados: number;
  margen_porcentaje: number | null;
  pendiente_cobro: number;
  resultado_neto: number;
  total_vendido: number;
};

export type ReportesFinancierosSalonRow = {
  egresos_pagados: number;
  eventos: number;
  id: string;
  ingresos_cobrados: number;
  label: string;
  margen_porcentaje: number | null;
  pendiente_cobro: number;
  resultado_neto: number;
};

export type ReportesFinancierosEventoRow = {
  egresos_pagados: number;
  evento: string;
  fecha_evento: string;
  id: string;
  ingresos_cobrados: number;
  margen_porcentaje: number | null;
  pendiente_cobro: number;
  resultado_neto: number;
  salon: string;
  total_vendido: number;
};

export type ReportesFinancierosMesRow = {
  egresos_pagados: number;
  ingresos_cobrados: number;
  key: string;
  label: string;
  resultado_neto: number;
};

export type ReportesFinancierosData = {
  evolucionMensual: ReportesFinancierosMesRow[];
  metricas: ReportesFinancierosMetricas;
  porEvento: ReportesFinancierosEventoRow[];
  porSalon: ReportesFinancierosSalonRow[];
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
    garantiasRegistradas: number;
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
  financieros: ReportesFinancierosData;
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

type ReportePago = Pick<
  Tables<"pagos">,
  "es_garantia" | "evento_id" | "fecha_pago" | "importe_en_pesos"
>;

type ReporteEgreso = Pick<
  Tables<"egresos">,
  "evento_id" | "fecha_egreso" | "importe_en_pesos"
>;

type MovimientoPagoRow = ReportePago & {
  eventos: Pick<
    Tables<"eventos">,
    "deleted_at" | "estado" | "salon_id" | "vendedor_id"
  > | null;
};

type MovimientoEgresoRow = ReporteEgreso & {
  eventos: Pick<
    Tables<"eventos">,
    "deleted_at" | "estado" | "salon_id" | "vendedor_id"
  > | null;
};

type ImporteRow = {
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

  const [eventosResult, pagosMovimientos, egresosMovimientos] = await Promise.all([
    getEventosReporte({ allowedSalonIds, filters }),
    getPagosReporte({ allowedSalonIds, filters }),
    getEgresosReporte({ allowedSalonIds, filters }),
  ]);

  const eventos = eventosResult;
  const eventoIds = eventos.map((evento) => evento.id);
  const [resumen, pagosEventos, egresosEventos] = await Promise.all([
    getResumenEventos(eventoIds),
    getPagosEventosReporte(eventoIds),
    getEgresosEventosReporte(eventoIds),
  ]);
  const resumenByEvento = new Map(
    resumen
      .filter((row) => row.id)
      .map((row) => [row.id as string, row] as const),
  );
  const totalIngresos = sumIngresosCobrados(pagosMovimientos);
  const garantiasRegistradas = sumGarantiasRegistradas(pagosMovimientos);
  const totalEgresos = sumImporteEnPesos(egresosMovimientos);
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
      garantiasRegistradas,
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
    financieros: buildReportesFinancieros({
      egresosEventos,
      egresosMovimientos,
      eventos,
      pagosEventos,
      pagosMovimientos,
      resumenByEvento,
    }),
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
      "evento_id, fecha_pago, importe_en_pesos, es_garantia, eventos!inner(salon_id, vendedor_id, estado, deleted_at)",
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

  return data as MovimientoPagoRow[];
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
      "evento_id, fecha_egreso, importe_en_pesos, eventos!inner(salon_id, vendedor_id, estado, deleted_at)",
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

  return data as MovimientoEgresoRow[];
}

async function getPagosEventosReporte(eventoIds: string[]) {
  if (eventoIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagos")
    .select("evento_id, fecha_pago, importe_en_pesos, es_garantia")
    .in("evento_id", eventoIds)
    .is("deleted_at", null);

  if (error) {
    logSupabaseError("getReportesGenerales pagos eventos", error);
    throw new Error("No se pudieron obtener los pagos por evento del reporte.");
  }

  return data as ReportePago[];
}

async function getEgresosEventosReporte(eventoIds: string[]) {
  if (eventoIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("egresos")
    .select("evento_id, fecha_egreso, importe_en_pesos")
    .in("evento_id", eventoIds)
    .is("deleted_at", null);

  if (error) {
    logSupabaseError("getReportesGenerales egresos eventos", error);
    throw new Error("No se pudieron obtener los egresos por evento del reporte.");
  }

  return data as ReporteEgreso[];
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

function buildReportesFinancieros({
  egresosEventos,
  egresosMovimientos,
  eventos,
  pagosEventos,
  pagosMovimientos,
  resumenByEvento,
}: {
  egresosEventos: ReporteEgreso[];
  egresosMovimientos: MovimientoEgresoRow[];
  eventos: ReporteEvento[];
  pagosEventos: ReportePago[];
  pagosMovimientos: MovimientoPagoRow[];
  resumenByEvento: Map<string, ResumenEventoRow>;
}): ReportesFinancierosData {
  const ingresos_cobrados = sumIngresosCobrados(pagosMovimientos);
  const egresos_pagados = sumImporteEnPesos(egresosMovimientos);
  const resultado_neto = roundMoney(ingresos_cobrados - egresos_pagados);
  const total_vendido = roundMoney(
    eventos.reduce((total, evento) => {
      const resumen = resumenByEvento.get(evento.id);

      return total + getTotalVendidoEstimado(resumen);
    }, 0),
  );
  const pendiente_cobro = roundMoney(
    eventos.reduce((total, evento) => {
      const resumen = resumenByEvento.get(evento.id);

      return total + getPendienteCobroEstimado(resumen);
    }, 0),
  );

  return {
    evolucionMensual: getEvolucionMensual(pagosMovimientos, egresosMovimientos),
    metricas: {
      egresos_pagados,
      eventos_incluidos: eventos.length,
      garantias_registradas: sumGarantiasRegistradas(pagosMovimientos),
      ingresos_cobrados,
      margen_porcentaje: getMargenPorcentaje(resultado_neto, ingresos_cobrados),
      pendiente_cobro,
      resultado_neto,
      total_vendido,
    },
    porEvento: getFinancierosPorEvento({
      egresosEventos,
      eventos,
      pagosEventos,
      resumenByEvento,
    }),
    porSalon: getFinancierosPorSalon({
      egresosEventos,
      eventos,
      pagosEventos,
      resumenByEvento,
    }),
  };
}

function getFinancierosPorEvento({
  egresosEventos,
  eventos,
  pagosEventos,
  resumenByEvento,
}: {
  egresosEventos: ReporteEgreso[];
  eventos: ReporteEvento[];
  pagosEventos: ReportePago[];
  resumenByEvento: Map<string, ResumenEventoRow>;
}): ReportesFinancierosEventoRow[] {
  const ingresosByEvento = groupImportesByEvento(
    pagosEventos.filter((pago) => !pago.es_garantia),
  );
  const egresosByEvento = groupImportesByEvento(egresosEventos);

  return eventos.map((evento) => {
    const ingresos_cobrados = ingresosByEvento.get(evento.id) ?? 0;
    const egresos_pagados = egresosByEvento.get(evento.id) ?? 0;
    const resultado_neto = roundMoney(ingresos_cobrados - egresos_pagados);
    const resumen = resumenByEvento.get(evento.id);

    return {
      egresos_pagados,
      evento: evento.nombre_evento ?? evento.cliente_nombre,
      fecha_evento: evento.fecha_evento,
      id: evento.id,
      ingresos_cobrados,
      margen_porcentaje: getMargenPorcentaje(resultado_neto, ingresos_cobrados),
      pendiente_cobro: getPendienteCobroEstimado(resumen),
      resultado_neto,
      salon: evento.salones?.nombre ?? "Salon sin nombre",
      total_vendido: getTotalVendidoEstimado(resumen),
    };
  });
}

function getFinancierosPorSalon({
  egresosEventos,
  eventos,
  pagosEventos,
  resumenByEvento,
}: {
  egresosEventos: ReporteEgreso[];
  eventos: ReporteEvento[];
  pagosEventos: ReportePago[];
  resumenByEvento: Map<string, ResumenEventoRow>;
}): ReportesFinancierosSalonRow[] {
  const ingresosByEvento = groupImportesByEvento(
    pagosEventos.filter((pago) => !pago.es_garantia),
  );
  const egresosByEvento = groupImportesByEvento(egresosEventos);
  const groups = new Map<string, ReportesFinancierosSalonRow>();

  for (const evento of eventos) {
    const current = groups.get(evento.salon_id) ?? {
      egresos_pagados: 0,
      eventos: 0,
      id: evento.salon_id,
      ingresos_cobrados: 0,
      label: evento.salones?.nombre ?? "Salon sin nombre",
      margen_porcentaje: null,
      pendiente_cobro: 0,
      resultado_neto: 0,
    };

    current.eventos += 1;
    current.ingresos_cobrados = roundMoney(
      current.ingresos_cobrados + (ingresosByEvento.get(evento.id) ?? 0),
    );
    current.egresos_pagados = roundMoney(
      current.egresos_pagados + (egresosByEvento.get(evento.id) ?? 0),
    );
    current.pendiente_cobro = roundMoney(
      current.pendiente_cobro +
        getPendienteCobroEstimado(resumenByEvento.get(evento.id)),
    );
    current.resultado_neto = roundMoney(
      current.ingresos_cobrados - current.egresos_pagados,
    );
    current.margen_porcentaje = getMargenPorcentaje(
      current.resultado_neto,
      current.ingresos_cobrados,
    );

    groups.set(evento.salon_id, current);
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (b.resultado_neto !== a.resultado_neto) {
      return b.resultado_neto - a.resultado_neto;
    }

    return a.label.localeCompare(b.label, "es");
  });
}

function getEvolucionMensual(
  pagos: MovimientoPagoRow[],
  egresos: MovimientoEgresoRow[],
): ReportesFinancierosMesRow[] {
  const months = new Map<string, ReportesFinancierosMesRow>();

  for (const pago of pagos) {
    if (pago.es_garantia) {
      continue;
    }

    const month = getMonthRow(months, pago.fecha_pago);
    month.ingresos_cobrados = roundMoney(
      month.ingresos_cobrados + toMoneyNumber(pago.importe_en_pesos),
    );
    month.resultado_neto = roundMoney(
      month.ingresos_cobrados - month.egresos_pagados,
    );
  }

  for (const egreso of egresos) {
    const month = getMonthRow(months, egreso.fecha_egreso);
    month.egresos_pagados = roundMoney(
      month.egresos_pagados + toMoneyNumber(egreso.importe_en_pesos),
    );
    month.resultado_neto = roundMoney(
      month.ingresos_cobrados - month.egresos_pagados,
    );
  }

  return Array.from(months.values()).sort((a, b) => a.key.localeCompare(b.key));
}

function getMonthRow(
  months: Map<string, ReportesFinancierosMesRow>,
  date: string,
) {
  const key = date.slice(0, 7);
  const current = months.get(key) ?? {
    egresos_pagados: 0,
    ingresos_cobrados: 0,
    key,
    label: formatMonthLabel(key),
    resultado_neto: 0,
  };

  months.set(key, current);

  return current;
}

function formatMonthLabel(key: string) {
  const [year, month] = key.split("-");

  return new Intl.DateTimeFormat("es-AR", {
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${year}-${month}-01T00:00:00.000Z`));
}

function groupImportesByEvento<T extends ImporteRow & { evento_id: string }>(
  rows: T[],
) {
  const groups = new Map<string, number>();

  for (const row of rows) {
    const current = groups.get(row.evento_id) ?? 0;

    groups.set(
      row.evento_id,
      roundMoney(current + toMoneyNumber(row.importe_en_pesos)),
    );
  }

  return groups;
}

function getTotalVendidoEstimado(row: ResumenEventoRow | undefined) {
  return roundMoney(
    toMoneyNumber(row?.total_catering) + toMoneyNumber(row?.total_servicios),
  );
}

function getPendienteCobroEstimado(row: ResumenEventoRow | undefined) {
  return roundMoney(
    toMoneyNumber(row?.saldo_catering) + toMoneyNumber(row?.saldo_servicios),
  );
}

function getMargenPorcentaje(resultadoNeto: number, ingresosCobrados: number) {
  if (ingresosCobrados <= 0) {
    return null;
  }

  return roundMoney((resultadoNeto / ingresosCobrados) * 100);
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
      garantiasRegistradas: 0,
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
    financieros: {
      evolucionMensual: [],
      metricas: {
        egresos_pagados: 0,
        eventos_incluidos: 0,
        garantias_registradas: 0,
        ingresos_cobrados: 0,
        margen_porcentaje: null,
        pendiente_cobro: 0,
        resultado_neto: 0,
        total_vendido: 0,
      },
      porEvento: [],
      porSalon: [],
    },
    porEstado: [],
    porSalon: [],
    porVendedor: [],
    profile,
  };
}

function sumIngresosCobrados(rows: ReportePago[]) {
  return sumImporteEnPesos(rows.filter((row) => !row.es_garantia));
}

function sumGarantiasRegistradas(rows: ReportePago[]) {
  return sumImporteEnPesos(rows.filter((row) => row.es_garantia));
}

function sumImporteEnPesos(rows: ImporteRow[]) {
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
