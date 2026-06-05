import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/errors";
import type { Enums, TablesInsert } from "@/types/database.types";

export type ImportPreciosServiciosState = {
  errors: string[];
  formError: string | null;
  successMessage: string | null;
  summary: {
    inserted: number;
    updated: number;
    rows: number;
  } | null;
};

type ServicioCatalogoPrecio = {
  categoria: Enums<"categoria_servicio">;
  id: string;
  nombre: string;
};

type SalonPrecio = {
  id: string;
  nombre: string;
};

type PrecioMensual = {
  iva_porcentaje: number;
  moneda: Enums<"moneda">;
  precio_base: number;
};

type ValidImportRow = {
  iva_porcentaje: number;
  moneda: Enums<"moneda">;
  periodo: string;
  precio_base: number;
  salon_id: string | null;
  servicio_id: string;
};

type ApplyEventoPreciosResult = {
  inserted: number;
  missing: string[];
};

const TARGET_SERVICE_NAMES = [
  "salon",
  "tecnica pack",
  "ambientacion pack",
  "foto y video pack",
];

const MONTH_NAMES = new Map([
  ["enero", 1],
  ["febrero", 2],
  ["marzo", 3],
  ["abril", 4],
  ["mayo", 5],
  ["junio", 6],
  ["julio", 7],
  ["agosto", 8],
  ["septiembre", 9],
  ["setiembre", 9],
  ["octubre", 10],
  ["noviembre", 11],
  ["diciembre", 12],
]);

const ALLOWED_MONEDAS = new Set<Enums<"moneda">>(["ARS", "USD", "EUR"]);

export const emptyImportPreciosServiciosState: ImportPreciosServiciosState = {
  errors: [],
  formError: null,
  successMessage: null,
  summary: null,
};

export async function importPreciosMensualesFromExcel({
  file,
  importedBy,
}: {
  file: File;
  importedBy: string;
}): Promise<ImportPreciosServiciosState> {
  const rows = await getWorkbookRows(file);

  if (rows.length === 0) {
    return {
      ...emptyImportPreciosServiciosState,
      formError: "La planilla no tiene filas para importar.",
    };
  }

  const supabase = await createClient();
  const [serviciosResult, salonesResult] = await Promise.all([
    supabase
      .from("servicios_catalogo")
      .select("id, nombre, categoria")
      .eq("activo", true),
    supabase
      .from("salones")
      .select("id, nombre")
      .eq("activo", true)
      .is("deleted_at", null),
  ]);

  if (serviciosResult.error) {
    logSupabaseError("importPreciosMensuales servicios", serviciosResult.error);
    return {
      ...emptyImportPreciosServiciosState,
      formError: "No se pudo obtener el catalogo de servicios.",
    };
  }

  if (salonesResult.error) {
    logSupabaseError("importPreciosMensuales salones", salonesResult.error);
    return {
      ...emptyImportPreciosServiciosState,
      formError: "No se pudo obtener el listado de salones.",
    };
  }

  const servicios = serviciosResult.data as ServicioCatalogoPrecio[];
  const salones = salonesResult.data as SalonPrecio[];
  const parsed = validateImportRows(rows, servicios, salones);

  if (parsed.errors.length > 0) {
    return {
      ...emptyImportPreciosServiciosState,
      errors: parsed.errors,
      formError: "No se importo la planilla porque hay filas con errores.",
    };
  }

  let inserted = 0;
  let updated = 0;

  for (const row of parsed.rows) {
    const existing = await findExistingPrecioMensual(row);

    if (existing.error) {
      logSupabaseError("importPreciosMensuales buscar existente", existing.error);
      return {
        ...emptyImportPreciosServiciosState,
        formError: "No se pudo validar si el precio ya existe.",
      };
    }

    if (existing.id) {
      const { error } = await supabase
        .from("servicio_precios_mensuales")
        .update({
          importado_por: importedBy,
          iva_porcentaje: row.iva_porcentaje,
          moneda: row.moneda,
          precio_base: row.precio_base,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        logSupabaseError("importPreciosMensuales actualizar", error);
        return {
          ...emptyImportPreciosServiciosState,
          formError: "No se pudo actualizar uno de los precios mensuales.",
        };
      }

      updated += 1;
      continue;
    }

    const payload: TablesInsert<"servicio_precios_mensuales"> = {
      importado_por: importedBy,
      iva_porcentaje: row.iva_porcentaje,
      moneda: row.moneda,
      periodo: row.periodo,
      precio_base: row.precio_base,
      salon_id: row.salon_id,
      servicio_id: row.servicio_id,
    };
    const { error } = await supabase.from("servicio_precios_mensuales").insert(payload);

    if (error) {
      logSupabaseError("importPreciosMensuales insertar", error);
      return {
        ...emptyImportPreciosServiciosState,
        formError: "No se pudo insertar uno de los precios mensuales.",
      };
    }

    inserted += 1;
  }

  return {
    errors: [],
    formError: null,
    successMessage: "Precios mensuales importados correctamente.",
    summary: {
      inserted,
      rows: parsed.rows.length,
      updated,
    },
  };
}

export async function applyMonthlyServicePricesToEvento({
  eventoId,
  referenceDate,
  salonId,
}: {
  eventoId: string;
  referenceDate: string;
  salonId: string;
}): Promise<ApplyEventoPreciosResult> {
  const supabase = await createClient();
  const targetServicios = await getTargetServicios();

  if (targetServicios.length === 0) {
    return {
      inserted: 0,
      missing: TARGET_SERVICE_NAMES,
    };
  }

  const targetServiceIds = targetServicios.map((servicio) => servicio.id);
  const { data: existingRows, error: existingError } = await supabase
    .from("evento_servicios")
    .select("servicio_id")
    .eq("evento_id", eventoId)
    .in("servicio_id", targetServiceIds);

  if (existingError) {
    logSupabaseError("applyMonthlyServicePrices existing", existingError);
    return {
      inserted: 0,
      missing: targetServicios.map((servicio) => servicio.nombre),
    };
  }

  const existingServiceIds = new Set(existingRows.map((row) => row.servicio_id));
  const missing: string[] = [];
  const inserts: TablesInsert<"evento_servicios">[] = [];
  const period = getPeriodFromDate(referenceDate);

  for (const servicio of targetServicios) {
    if (existingServiceIds.has(servicio.id)) {
      continue;
    }

    const precio = await getPrecioVigenteForServicio({
      period,
      salonId,
      servicio,
    });

    if (!precio) {
      missing.push(servicio.nombre);
      continue;
    }

    inserts.push({
      adicionales_monto: 0,
      evento_id: eventoId,
      iva_porcentaje: precio.iva_porcentaje,
      notas: `Autocompletado desde precios mensuales (${period.slice(0, 7)}).`,
      precio_base: precio.precio_base,
      servicio_id: servicio.id,
    });
  }

  if (inserts.length === 0) {
    return {
      inserted: 0,
      missing,
    };
  }

  const { error } = await supabase.from("evento_servicios").insert(inserts);

  if (error) {
    logSupabaseError("applyMonthlyServicePrices insert", error);
    return {
      inserted: 0,
      missing: targetServicios
        .filter((servicio) => !existingServiceIds.has(servicio.id))
        .map((servicio) => servicio.nombre),
    };
  }

  return {
    inserted: inserts.length,
    missing,
  };
}

async function getWorkbookRows(file: File) {
  const bytes = await file.arrayBuffer();
  const workbook = XLSX.read(bytes, {
    cellDates: true,
    type: "array",
  });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const worksheet = workbook.Sheets[firstSheetName];

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
  });
}

function validateImportRows(
  rows: Record<string, unknown>[],
  servicios: ServicioCatalogoPrecio[],
  salones: SalonPrecio[],
) {
  const serviciosByName = new Map(
    servicios.map((servicio) => [normalizeText(servicio.nombre), servicio]),
  );
  const salonesByName = new Map(
    salones.map((salon) => [normalizeText(salon.nombre), salon]),
  );
  const parsedRows: ValidImportRow[] = [];
  const errors: string[] = [];
  const seenKeys = new Set<string>();

  rows.forEach((rawRow, index) => {
    const rowNumber = index + 2;
    const row = normalizeRow(rawRow);
    const servicioNombre = getRequiredCell(row, "servicio");
    const servicio = servicioNombre
      ? serviciosByName.get(normalizeText(servicioNombre))
      : null;
    const month = parseMonth(getRequiredCell(row, "mes"));
    const year = parseYear(getRequiredCell(row, "ano"));
    const precioBase = parseMoney(row.precio_base);
    const ivaPorcentaje = parsePercentage(row.iva_porcentaje);
    const moneda = parseMoneda(row.moneda);
    const salonNombre = asText(row.salon);
    const salon = salonNombre ? salonesByName.get(normalizeText(salonNombre)) : null;

    if (!servicioNombre) {
      errors.push(`Fila ${rowNumber}: falta la columna servicio.`);
    } else if (!servicio) {
      errors.push(`Fila ${rowNumber}: el servicio "${servicioNombre}" no existe o no esta activo.`);
    }

    if (!month) {
      errors.push(`Fila ${rowNumber}: el mes debe ser un numero de 1 a 12 o nombre de mes.`);
    }

    if (!year) {
      errors.push(`Fila ${rowNumber}: el año debe tener 4 digitos.`);
    }

    if (precioBase === null) {
      errors.push(`Fila ${rowNumber}: precio_base debe ser un monto mayor o igual a 0.`);
    }

    if (ivaPorcentaje === null) {
      errors.push(`Fila ${rowNumber}: iva_porcentaje debe estar entre 0 y 100.`);
    }

    if (!moneda) {
      errors.push(`Fila ${rowNumber}: moneda debe ser ARS, USD o EUR.`);
    }

    if (salonNombre && !salon) {
      errors.push(`Fila ${rowNumber}: el salon "${salonNombre}" no existe o no esta activo.`);
    }

    if (servicio && isSalonService(servicio) && !salon) {
      errors.push(`Fila ${rowNumber}: el servicio Salon requiere una columna salon valida.`);
    }

    if (!servicio || !month || !year || precioBase === null || ivaPorcentaje === null || !moneda) {
      return;
    }

    const periodo = `${year}-${String(month).padStart(2, "0")}-01`;
    const salonId = salon?.id ?? null;
    const uniqueKey = `${servicio.id}:${salonId ?? "global"}:${periodo}`;

    if (seenKeys.has(uniqueKey)) {
      errors.push(
        `Fila ${rowNumber}: ya existe otra fila para el mismo servicio, salon y periodo dentro del archivo.`,
      );
      return;
    }

    seenKeys.add(uniqueKey);
    parsedRows.push({
      iva_porcentaje: ivaPorcentaje,
      moneda,
      periodo,
      precio_base: precioBase,
      salon_id: salonId,
      servicio_id: servicio.id,
    });
  });

  return {
    errors,
    rows: parsedRows,
  };
}

async function findExistingPrecioMensual(row: ValidImportRow) {
  const supabase = await createClient();
  const query = supabase
    .from("servicio_precios_mensuales")
    .select("id")
    .eq("servicio_id", row.servicio_id)
    .eq("periodo", row.periodo);

  if (row.salon_id) {
    query.eq("salon_id", row.salon_id);
  } else {
    query.is("salon_id", null);
  }

  const { data, error } = await query.maybeSingle();

  return {
    error,
    id: data?.id ?? null,
  };
}

async function getTargetServicios() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("servicios_catalogo")
    .select("id, nombre, categoria")
    .eq("activo", true);

  if (error) {
    logSupabaseError("getTargetServicios", error);
    return [];
  }

  return (data as ServicioCatalogoPrecio[]).filter((servicio) =>
    TARGET_SERVICE_NAMES.includes(normalizeText(servicio.nombre)),
  );
}

async function getPrecioVigenteForServicio({
  period,
  salonId,
  servicio,
}: {
  period: string;
  salonId: string;
  servicio: ServicioCatalogoPrecio;
}): Promise<PrecioMensual | null> {
  const exactSalonPrice = await getPrecioMensual({
    period,
    salonId,
    servicioId: servicio.id,
  });

  if (exactSalonPrice || isSalonService(servicio)) {
    return exactSalonPrice;
  }

  return getPrecioMensual({
    period,
    salonId: null,
    servicioId: servicio.id,
  });
}

async function getPrecioMensual({
  period,
  salonId,
  servicioId,
}: {
  period: string;
  salonId: string | null;
  servicioId: string;
}): Promise<PrecioMensual | null> {
  const supabase = await createClient();
  const query = supabase
    .from("servicio_precios_mensuales")
    .select("precio_base, iva_porcentaje, moneda")
    .eq("servicio_id", servicioId)
    .eq("periodo", period);

  if (salonId) {
    query.eq("salon_id", salonId);
  } else {
    query.is("salon_id", null);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    logSupabaseError("getPrecioMensual", error);
    return null;
  }

  return data as PrecioMensual | null;
}

function normalizeRow(row: Record<string, unknown>) {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    normalized[normalizeHeader(key)] = value;
  }

  return normalized;
}

function normalizeHeader(value: string) {
  const header = normalizeText(value).replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

  if (header === "ano" || header === "anio") {
    return "ano";
  }

  if (header === "precio" || header === "precio_base") {
    return "precio_base";
  }

  if (header === "iva" || header === "iva_porcentaje") {
    return "iva_porcentaje";
  }

  return header;
}

function getRequiredCell(row: Record<string, unknown>, key: string) {
  return asText(row[key]);
}

function asText(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function parseMonth(value: string) {
  const text = normalizeText(value);
  const numeric = Number(text);

  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 12) {
    return numeric;
  }

  return MONTH_NAMES.get(text) ?? null;
}

function parseYear(value: string) {
  const year = Number(value.trim());

  if (Number.isInteger(year) && year >= 2000 && year <= 2100) {
    return year;
  }

  return null;
}

function parseMoney(value: unknown) {
  const text = normalizeNumberText(value);

  if (!text) {
    return null;
  }

  const numberValue = Number(text);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return null;
  }

  return roundMoney(numberValue);
}

function parsePercentage(value: unknown) {
  const text = normalizeNumberText(value);

  if (!text) {
    return 0;
  }

  const numberValue = Number(text);

  if (!Number.isFinite(numberValue) || numberValue < 0 || numberValue > 100) {
    return null;
  }

  return roundMoney(numberValue);
}

function parseMoneda(value: unknown): Enums<"moneda"> | null {
  const text = asText(value).toUpperCase() || "ARS";

  return ALLOWED_MONEDAS.has(text as Enums<"moneda">)
    ? (text as Enums<"moneda">)
    : null;
}

function normalizeNumberText(value: unknown) {
  if (typeof value === "number") {
    return String(value);
  }

  const raw = asText(value).replace(/[^\d,.-]/g, "");

  if (!raw) {
    return "";
  }

  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");

  if (lastComma > -1 && lastDot > -1) {
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandSeparator = decimalSeparator === "," ? "." : ",";

    return raw.replaceAll(thousandSeparator, "").replace(decimalSeparator, ".");
  }

  if (lastComma > -1) {
    return raw.replace(",", ".");
  }

  return raw;
}

function getPeriodFromDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return getPeriodFromDate(new Date().toISOString());
  }

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function isSalonService(servicio: ServicioCatalogoPrecio) {
  return servicio.categoria === "salon" || normalizeText(servicio.nombre) === "salon";
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
