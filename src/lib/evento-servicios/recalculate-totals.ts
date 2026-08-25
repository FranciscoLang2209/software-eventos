import "server-only";

import { sumOrdinaryPayments } from "@/lib/pagos/calculos";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/errors";

export async function recalculateEventoServicioTotals(
  eventoServicioId: string,
) {
  const supabase = await createClient();
  const { data: servicio, error: servicioError } = await supabase
    .from("evento_servicios")
    .select("id")
    .eq("id", eventoServicioId)
    .maybeSingle();

  if (servicioError) {
    logSupabaseError(
      "recalculateEventoServicioTotals obtener servicio",
      servicioError,
    );
    return;
  }

  if (!servicio) {
    return;
  }

  const totalPagado = await getTotalPagadoEventoServicio(eventoServicioId);
  const { error } = await supabase
    .from("evento_servicios")
    .update({
      total_pagado: totalPagado,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventoServicioId);

  if (error) {
    logSupabaseError("recalculateEventoServicioTotals actualizar", error);
  }
}

export async function getTotalPagadoEventoServicio(
  eventoServicioId: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagos")
    .select(
      "es_garantia, importe_en_pesos, importe_moneda_original",
    )
    .eq("evento_servicio_id", eventoServicioId)
    .is("deleted_at", null);

  if (error) {
    logSupabaseError("getTotalPagadoEventoServicio", error);
    return 0;
  }

  return sumOrdinaryPayments(data);
}
