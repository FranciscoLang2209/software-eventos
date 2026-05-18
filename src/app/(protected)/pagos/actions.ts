"use server";

import { recalculateEventoServicioTotals } from "@/app/(protected)/evento-servicios/actions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile, type CurrentProfile } from "@/lib/auth";
import {
  getEmptyPagoFormState,
  type PagoFormState,
  validatePagoForm,
} from "@/lib/pagos/validation";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/errors";

type AuthorizedEvento = {
  id: string;
  salon_id: string;
};

export type DeletePagoState = {
  formError?: string;
};

const CREATE_PAGO_ERROR =
  "No se pudo registrar el pago. Verifica los datos e intenta nuevamente.";
const DELETE_PAGO_ERROR =
  "No se pudo eliminar el pago. Verifica los datos e intenta nuevamente.";

export async function createPagoAction(
  eventoId: string,
  _previousState: PagoFormState,
  formData: FormData,
): Promise<PagoFormState> {
  const profile = await getCurrentProfile();

  if (!profile?.activo) {
    redirect("/dashboard");
  }

  const { state, payload } = validatePagoForm(formData);

  if (!payload) {
    return state;
  }

  const evento = await getAuthorizedActiveEvento(eventoId, profile);

  if (!evento) {
    return {
      ...state,
      formError: CREATE_PAGO_ERROR,
    };
  }

  const eventoServicioId =
    payload.evento_servicio_id ??
    (await getEventoServicioConMayorSaldo(evento.id));

  if (
    eventoServicioId &&
    !(await isEventoServicioForEvento(eventoServicioId, evento.id))
  ) {
    return {
      ...state,
      formError: CREATE_PAGO_ERROR,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagos")
    .insert({
      concepto: payload.concepto,
      es_garantia: false,
      evento_id: evento.id,
      evento_servicio_id: eventoServicioId,
      fecha_pago: payload.fecha_pago,
      forma_pago: payload.forma_pago,
      importe_moneda_original: payload.monto,
      moneda: "ARS",
      notas: payload.notas,
      registrado_por: profile.id,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    logSupabaseError("createPagoAction insertar pago", error);
    return {
      ...state,
      formError: "No se pudo registrar el pago. Intenta nuevamente.",
    };
  }

  if (!data) {
    return {
      ...state,
      formError: CREATE_PAGO_ERROR,
    };
  }

  if (eventoServicioId) {
    await recalculateEventoServicioTotals(eventoServicioId);
  }

  revalidatePath("/eventos");
  revalidatePath(`/eventos/${evento.id}`);

  return {
    ...getEmptyPagoFormState(),
    successMessage: "Pago registrado correctamente.",
  };
}

export async function deletePagoAction(
  eventoId: string,
  pagoId: string,
  previousState: DeletePagoState,
  formData: FormData,
): Promise<DeletePagoState> {
  void previousState;
  void formData;

  const profile = await getCurrentProfile();

  if (!profile?.activo) {
    redirect("/dashboard");
  }

  const evento = await getAuthorizedActiveEvento(eventoId, profile);

  if (!evento) {
    return {
      formError: DELETE_PAGO_ERROR,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagos")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", pagoId)
    .eq("evento_id", evento.id)
    .is("deleted_at", null)
    .select("id, evento_servicio_id")
    .maybeSingle();

  if (error) {
    logSupabaseError("deletePagoAction eliminar pago", error);
    return {
      formError: "No se pudo eliminar el pago. Intenta nuevamente.",
    };
  }

  if (!data) {
    return {
      formError: DELETE_PAGO_ERROR,
    };
  }

  if (data.evento_servicio_id) {
    await recalculateEventoServicioTotals(data.evento_servicio_id);
  }

  revalidatePath("/eventos");
  revalidatePath(`/eventos/${evento.id}`);

  return {};
}

async function isEventoServicioForEvento(
  eventoServicioId: string,
  eventoId: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("evento_servicios")
    .select("id")
    .eq("id", eventoServicioId)
    .eq("evento_id", eventoId)
    .maybeSingle();

  if (error) {
    logSupabaseError("pagos validar servicio del evento", error);
    return false;
  }

  return Boolean(data);
}

async function getEventoServicioConMayorSaldo(eventoId: string) {
  const supabase = await createClient();
  const [serviciosResult, pagosResult] = await Promise.all([
    supabase
      .from("evento_servicios")
      .select("id, total_con_iva")
      .eq("evento_id", eventoId),
    supabase
      .from("pagos")
      .select("evento_servicio_id, importe_en_pesos, importe_moneda_original")
      .eq("evento_id", eventoId)
      .is("deleted_at", null)
      .not("evento_servicio_id", "is", null),
  ]);

  if (serviciosResult.error) {
    logSupabaseError(
      "pagos obtener servicios para asignacion automatica",
      serviciosResult.error,
    );
    return null;
  }

  if (pagosResult.error) {
    logSupabaseError(
      "pagos obtener pagos para asignacion automatica",
      pagosResult.error,
    );
    return null;
  }

  const pagosPorServicio = new Map<string, number>();

  for (const pago of pagosResult.data) {
    if (!pago.evento_servicio_id) {
      continue;
    }

    const monto = toMoneyNumber(
      pago.importe_en_pesos ?? pago.importe_moneda_original,
    );
    const current = pagosPorServicio.get(pago.evento_servicio_id) ?? 0;

    pagosPorServicio.set(pago.evento_servicio_id, current + monto);
  }

  let selectedServicioId: string | null = null;
  let selectedSaldo = 0;

  for (const servicio of serviciosResult.data) {
    const totalServicio = toMoneyNumber(servicio.total_con_iva);
    const totalPagado = pagosPorServicio.get(servicio.id) ?? 0;
    const saldo = totalServicio - totalPagado;

    if (saldo > selectedSaldo) {
      selectedServicioId = servicio.id;
      selectedSaldo = saldo;
    }
  }

  return selectedServicioId;
}

async function getAuthorizedActiveEvento(
  eventoId: string,
  profile: CurrentProfile,
): Promise<AuthorizedEvento | null> {
  const supabase = await createClient();
  const { data: evento, error: eventoError } = await supabase
    .from("eventos")
    .select("id, salon_id")
    .eq("id", eventoId)
    .is("deleted_at", null)
    .maybeSingle();

  if (eventoError) {
    logSupabaseError("pagos validar evento", eventoError);
    return null;
  }

  if (!evento) {
    return null;
  }

  if (profile.rol === "admin") {
    return evento;
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("usuario_salon")
    .select("usuario_id")
    .eq("usuario_id", profile.id)
    .eq("salon_id", evento.salon_id)
    .maybeSingle();

  if (assignmentError) {
    logSupabaseError("pagos validar asignacion", assignmentError);
    return null;
  }

  return assignment ? evento : null;
}

function toMoneyNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
