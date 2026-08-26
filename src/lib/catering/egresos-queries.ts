import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/errors";
import type { Tables } from "@/types/database.types";

export type EgresoCatering = Pick<
  Tables<"egresos">,
  | "categoria"
  | "concepto"
  | "created_at"
  | "fecha_egreso"
  | "forma_pago"
  | "id"
  | "importe_en_pesos"
  | "importe_moneda_original"
  | "moneda"
  | "notas"
  | "proveedor"
>;

export type CateringEgresos = {
  cantidadEgresos: number;
  egresos: EgresoCatering[];
  totalEgresos: number;
};

export async function getCateringEgresos(
  cateringContratoId: string,
): Promise<CateringEgresos> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("egresos")
    .select(
      "id, categoria, concepto, created_at, fecha_egreso, forma_pago, importe_en_pesos, importe_moneda_original, moneda, notas, proveedor",
    )
    .eq("catering_contrato_id", cateringContratoId)
    .is("deleted_at", null)
    .order("fecha_egreso", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    logSupabaseError("getCateringEgresos egresos", error);
    throw new Error("No se pudieron obtener los egresos del catering.");
  }

  const egresos = data as EgresoCatering[];
  const totalEgresos = egresos.reduce(
    (total, egreso) =>
      total + toMoneyNumber(egreso.importe_en_pesos ?? egreso.importe_moneda_original),
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
