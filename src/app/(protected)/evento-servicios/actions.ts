"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile, type CurrentProfile } from "@/lib/auth";
import {
  getEmptyEventoServicioFormState,
  type EventoServicioFormState,
  validateEventoServicioForm,
} from "@/lib/evento-servicios/validation";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/errors";

type AuthorizedEvento = {
  id: string;
  salon_id: string;
};

export type DeleteEventoServicioState = {
  formError?: string;
};

const CREATE_EVENTO_SERVICIO_ERROR =
  "No se pudo agregar el servicio. Verifica los datos e intenta nuevamente.";
const UPDATE_EVENTO_SERVICIO_ERROR =
  "No se pudo actualizar el servicio. Verifica los datos e intenta nuevamente.";
const DELETE_EVENTO_SERVICIO_ERROR =
  "No se pudo eliminar el servicio. Verifica los datos e intenta nuevamente.";

export async function createEventoServicioAction(
  eventoId: string,
  _previousState: EventoServicioFormState,
  formData: FormData,
): Promise<EventoServicioFormState> {
  const profile = await getCurrentProfile();

  if (!profile?.activo) {
    redirect("/dashboard");
  }

  const { state, payload } = validateEventoServicioForm(formData);

  if (!payload) {
    return state;
  }

  const evento = await getAuthorizedActiveEvento(eventoId, profile);

  if (!evento || !(await isActiveCatalogService(payload.servicio_id))) {
    return {
      ...state,
      formError: CREATE_EVENTO_SERVICIO_ERROR,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("evento_servicios")
    .insert({
      adicionales_monto: payload.adicionales_monto,
      evento_id: evento.id,
      iva_base_imponible: payload.iva_base_imponible,
      iva_porcentaje: payload.iva_porcentaje,
      notas: payload.notas,
      precio_base: payload.precio_base,
      proveedor: payload.proveedor,
      servicio_id: payload.servicio_id,
      total_pagado: 0,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    logSupabaseError("createEventoServicioAction insertar", error);
    return {
      ...state,
      formError: "No se pudo agregar el servicio. Intenta nuevamente.",
    };
  }

  if (!data) {
    return {
      ...state,
      formError: CREATE_EVENTO_SERVICIO_ERROR,
    };
  }

  revalidateEventoPaths(evento.id);

  return {
    ...getEmptyEventoServicioFormState(),
    successMessage: "Servicio agregado correctamente.",
  };
}

export async function updateEventoServicioAction(
  eventoId: string,
  eventoServicioId: string,
  _previousState: EventoServicioFormState,
  formData: FormData,
): Promise<EventoServicioFormState> {
  const profile = await getCurrentProfile();

  if (!profile?.activo) {
    redirect("/dashboard");
  }

  const { state, payload } = validateEventoServicioForm(formData);

  if (!payload) {
    return state;
  }

  const evento = await getAuthorizedActiveEvento(eventoId, profile);

  if (!evento || !(await isActiveCatalogService(payload.servicio_id))) {
    return {
      ...state,
      formError: UPDATE_EVENTO_SERVICIO_ERROR,
    };
  }

  const supabase = await createClient();
  const totalPagado = await getTotalPagadoEventoServicio(eventoServicioId);
  const { data, error } = await supabase
    .from("evento_servicios")
    .update({
      adicionales_monto: payload.adicionales_monto,
      iva_base_imponible: payload.iva_base_imponible,
      iva_porcentaje: payload.iva_porcentaje,
      notas: payload.notas,
      precio_base: payload.precio_base,
      proveedor: payload.proveedor,
      servicio_id: payload.servicio_id,
      total_pagado: totalPagado,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventoServicioId)
    .eq("evento_id", evento.id)
    .select("id")
    .maybeSingle();

  if (error) {
    logSupabaseError("updateEventoServicioAction actualizar", error);
    return {
      ...state,
      formError: "No se pudo actualizar el servicio. Intenta nuevamente.",
    };
  }

  if (!data) {
    return {
      ...state,
      formError: UPDATE_EVENTO_SERVICIO_ERROR,
    };
  }

  revalidateEventoPaths(evento.id);

  return {
    ...state,
    successMessage: "Servicio actualizado correctamente.",
  };
}

export async function deleteEventoServicioAction(
  eventoId: string,
  eventoServicioId: string,
  previousState: DeleteEventoServicioState,
  formData: FormData,
): Promise<DeleteEventoServicioState> {
  void previousState;
  void formData;

  const profile = await getCurrentProfile();

  if (!profile?.activo) {
    redirect("/dashboard");
  }

  const evento = await getAuthorizedActiveEvento(eventoId, profile);

  if (!evento) {
    return {
      formError: DELETE_EVENTO_SERVICIO_ERROR,
    };
  }

  const hasPagos = await hasActivePagos(eventoServicioId);

  if (hasPagos) {
    return {
      formError:
        "No se puede eliminar un servicio que tiene pagos asociados.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("evento_servicios")
    .delete()
    .eq("id", eventoServicioId)
    .eq("evento_id", evento.id)
    .select("id")
    .maybeSingle();

  if (error) {
    logSupabaseError("deleteEventoServicioAction eliminar", error);
    return {
      formError: "No se pudo eliminar el servicio. Intenta nuevamente.",
    };
  }

  if (!data) {
    return {
      formError: DELETE_EVENTO_SERVICIO_ERROR,
    };
  }

  revalidateEventoPaths(evento.id);

  return {};
}

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
    logSupabaseError("evento-servicios validar evento", eventoError);
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
    logSupabaseError("evento-servicios validar asignacion", assignmentError);
    return null;
  }

  return assignment ? evento : null;
}

async function isActiveCatalogService(servicioId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("servicios_catalogo")
    .select("id")
    .eq("id", servicioId)
    .eq("activo", true)
    .maybeSingle();

  if (error) {
    logSupabaseError("evento-servicios validar catalogo", error);
    return false;
  }

  return Boolean(data);
}

async function hasActivePagos(eventoServicioId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagos")
    .select("id")
    .eq("evento_servicio_id", eventoServicioId)
    .is("deleted_at", null)
    .limit(1);

  if (error) {
    logSupabaseError("evento-servicios validar pagos", error);
    return true;
  }

  return data.length > 0;
}

async function getTotalPagadoEventoServicio(eventoServicioId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagos")
    .select("importe_en_pesos, importe_moneda_original")
    .eq("evento_servicio_id", eventoServicioId)
    .is("deleted_at", null);

  if (error) {
    logSupabaseError("getTotalPagadoEventoServicio", error);
    return 0;
  }

  return roundMoney(
    data.reduce(
      (total, pago) =>
        total +
        toMoneyNumber(pago.importe_en_pesos ?? pago.importe_moneda_original),
      0,
    ),
  );
}

function revalidateEventoPaths(eventoId: string) {
  revalidatePath("/eventos");
  revalidatePath(`/eventos/${eventoId}`);
}

function toMoneyNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
