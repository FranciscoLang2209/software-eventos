import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/errors";
import type { Tables } from "@/types/database.types";

export type EgresoEvento = Pick<
  Tables<"egresos">,
  | "categoria"
  | "concepto"
  | "created_at"
  | "evento_servicio_id"
  | "fecha_egreso"
  | "forma_pago"
  | "id"
  | "importe_en_pesos"
  | "importe_moneda_original"
  | "moneda"
  | "notas"
  | "proveedor"
> & {
  evento_servicios: {
    servicios_catalogo: Pick<Tables<"servicios_catalogo">, "nombre"> | null;
  } | null;
};

export type EventoEgresos = {
  cantidadEgresos: number;
  egresos: EgresoEvento[];
  totalEgresos: number;
};

export async function getEventoEgresos(
  eventoId: string,
): Promise<EventoEgresos> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("egresos")
    .select(
      "id, categoria, concepto, created_at, evento_servicio_id, fecha_egreso, forma_pago, importe_en_pesos, importe_moneda_original, moneda, notas, proveedor, evento_servicios(servicios_catalogo(nombre))",
    )
    .eq("evento_id", eventoId)
    .is("deleted_at", null)
    .order("fecha_egreso", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    logSupabaseError("getEventoEgresos egresos", error);
    throw new Error("No se pudieron obtener los egresos del evento.");
  }

  const egresos = data as EgresoEvento[];
  const totalEgresos = egresos.reduce(
    (total, egreso) =>
      total +
      toMoneyNumber(egreso.importe_en_pesos ?? egreso.importe_moneda_original),
    0,
  );

  return {
    cantidadEgresos: egresos.length,
    egresos,
    totalEgresos,
  };
}

function toMoneyNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
