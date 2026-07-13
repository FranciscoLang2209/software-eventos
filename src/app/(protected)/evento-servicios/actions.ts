"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthorizedActiveEvento, getCurrentProfile } from "@/lib/auth";
import { insertAuditLog } from "@/lib/audit/log";
import {
  getEmptyEventoServicioFormState,
  type EventoServicioFormState,
  validateEventoServicioForm,
} from "@/lib/evento-servicios/validation";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/errors";
import type { Tables } from "@/types/database.types";

type AuditableEventoServicio = Pick<
  Tables<"evento_servicios">,
  | "adicionales_monto"
  | "comisiona_organizador"
  | "evento_id"
  | "id"
  | "iva_base_imponible"
  | "iva_porcentaje"
  | "notas"
  | "precio_base"
  | "proveedor"
  | "servicio_id"
  | "total_pagado"
>;

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
      comisiona_organizador:
        evento.tiene_organizador && payload.comisiona_organizador,
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

  if (profile.rol === "admin") {
    await insertAuditLog({
      accion: "INSERT",
      datosNuevos: {
        adicionales_monto: payload.adicionales_monto,
        comisiona_organizador:
          evento.tiene_organizador && payload.comisiona_organizador,
        evento_id: evento.id,
        iva_base_imponible: payload.iva_base_imponible,
        iva_porcentaje: payload.iva_porcentaje,
        notas: payload.notas,
        precio_base: payload.precio_base,
        proveedor: payload.proveedor,
        servicio_id: payload.servicio_id,
        total_pagado: 0,
      },
      registroId: data.id,
      tabla: "evento_servicios",
      usuarioId: profile.id,
    });
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
  const currentServicio =
    profile.rol === "admin"
      ? await getEventoServicioById(eventoServicioId, evento.id)
      : null;
  const totalPagado = await getTotalPagadoEventoServicio(eventoServicioId);
  const { data, error } = await supabase
    .from("evento_servicios")
    .update({
      adicionales_monto: payload.adicionales_monto,
      comisiona_organizador:
        evento.tiene_organizador && payload.comisiona_organizador,
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

  if (profile.rol === "admin" && currentServicio) {
    await insertAuditLog({
      accion: "UPDATE",
      datosAnteriores: currentServicio,
      datosNuevos: {
        adicionales_monto: payload.adicionales_monto,
        comisiona_organizador:
          evento.tiene_organizador && payload.comisiona_organizador,
        evento_id: evento.id,
        id: eventoServicioId,
        iva_base_imponible: payload.iva_base_imponible,
        iva_porcentaje: payload.iva_porcentaje,
        notas: payload.notas,
        precio_base: payload.precio_base,
        proveedor: payload.proveedor,
        servicio_id: payload.servicio_id,
        total_pagado: totalPagado,
      },
      registroId: eventoServicioId,
      tabla: "evento_servicios",
      usuarioId: profile.id,
    });
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
  const currentServicio =
    profile.rol === "admin"
      ? await getEventoServicioById(eventoServicioId, evento.id)
      : null;
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

  if (profile.rol === "admin" && currentServicio) {
    await insertAuditLog({
      accion: "DELETE",
      datosAnteriores: currentServicio,
      registroId: eventoServicioId,
      tabla: "evento_servicios",
      usuarioId: profile.id,
    });
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

async function getEventoServicioById(
  eventoServicioId: string,
  eventoId: string,
): Promise<AuditableEventoServicio | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("evento_servicios")
    .select(
      "id, evento_id, servicio_id, precio_base, adicionales_monto, iva_base_imponible, iva_porcentaje, proveedor, total_pagado, notas, comisiona_organizador",
    )
    .eq("id", eventoServicioId)
    .eq("evento_id", eventoId)
    .maybeSingle();

  if (error) {
    logSupabaseError("getEventoServicioById auditoria", error);
    return null;
  }

  return data;
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
