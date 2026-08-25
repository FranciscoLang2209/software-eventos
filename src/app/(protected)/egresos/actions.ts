"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthorizedActiveEvento, getCurrentProfile } from "@/lib/auth";
import {
  getEmptyEgresoFormState,
  type EgresoFormState,
  validateEgresoForm,
} from "@/lib/egresos/validation";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/errors";

export type DeleteEgresoState = {
  formError?: string;
};

const CREATE_EGRESO_ERROR =
  "No se pudo registrar el egreso. Verifica los datos e intenta nuevamente.";
const DELETE_EGRESO_ERROR =
  "No se pudo eliminar el egreso. Verifica los datos e intenta nuevamente.";

export async function createEgresoAction(
  eventoId: string,
  _previousState: EgresoFormState,
  formData: FormData,
): Promise<EgresoFormState> {
  const profile = await getCurrentProfile();

  if (!profile?.activo) {
    redirect("/dashboard");
  }

  const { state, payload } = validateEgresoForm(formData);

  if (!payload) {
    return state;
  }

  const evento = await getAuthorizedActiveEvento(eventoId, profile);

  if (!evento) {
    return {
      ...state,
      formError: CREATE_EGRESO_ERROR,
    };
  }

  if (
    payload.evento_servicio_id &&
    !(await isEventoServicioForEvento(payload.evento_servicio_id, evento.id))
  ) {
    return {
      ...state,
      formError: CREATE_EGRESO_ERROR,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("egresos")
    .insert({
      categoria: payload.categoria,
      concepto: payload.concepto,
      evento_id: evento.id,
      evento_servicio_id: payload.evento_servicio_id,
      fecha_egreso: payload.fecha_egreso,
      forma_pago: payload.forma_pago,
      importe_en_pesos: payload.monto,
      importe_moneda_original: payload.monto,
      moneda: "ARS",
      notas: payload.notas,
      proveedor: payload.proveedor,
      registrado_por: profile.id,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    logSupabaseError("createEgresoAction insertar egreso", error);
    return {
      ...state,
      formError: "No se pudo registrar el egreso. Intenta nuevamente.",
    };
  }

  if (!data) {
    return {
      ...state,
      formError: CREATE_EGRESO_ERROR,
    };
  }

  revalidateEventoPaths(evento.id);

  return {
    ...getEmptyEgresoFormState(),
    successMessage: "Egreso registrado correctamente.",
  };
}

export async function deleteEgresoAction(
  eventoId: string,
  egresoId: string,
  previousState: DeleteEgresoState,
  formData: FormData,
): Promise<DeleteEgresoState> {
  void previousState;
  void formData;

  const profile = await getCurrentProfile();

  if (!profile?.activo) {
    redirect("/dashboard");
  }

  const evento = await getAuthorizedActiveEvento(eventoId, profile);

  if (!evento) {
    return {
      formError: DELETE_EGRESO_ERROR,
    };
  }

  const deletedAt = new Date().toISOString();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("egresos")
    .update({
      deleted_at: deletedAt,
      updated_at: deletedAt,
    })
    .eq("id", egresoId)
    .eq("evento_id", evento.id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    logSupabaseError("deleteEgresoAction eliminar egreso", error);
    return {
      formError: "No se pudo eliminar el egreso. Intenta nuevamente.",
    };
  }

  if (!data) {
    return {
      formError: DELETE_EGRESO_ERROR,
    };
  }

  revalidateEventoPaths(evento.id);

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
    logSupabaseError("egresos validar servicio del evento", error);
    return false;
  }

  return Boolean(data);
}

function revalidateEventoPaths(eventoId: string) {
  revalidatePath("/eventos");
  revalidatePath(`/eventos/${eventoId}`);
  revalidatePath(`/eventos/${eventoId}/egresos`);
}
