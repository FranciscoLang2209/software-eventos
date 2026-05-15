"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/errors";
import {
  type EventoFormState,
  validateEventoForm,
} from "@/lib/eventos/validation";
import type { Tables, TablesUpdate } from "@/types/database.types";

type EditableEvento = Pick<
  Tables<"eventos">,
  "id" | "salon_id" | "vendedor_id"
>;

export async function createEventoAction(
  _previousState: EventoFormState,
  formData: FormData,
): Promise<EventoFormState> {
  const profile = await getCurrentProfile();

  if (!profile?.activo) {
    redirect("/dashboard");
  }

  const { state, payload } = validateEventoForm(formData);

  if (!payload) {
    return state;
  }

  const supabase = await createClient();
  const vendedorId =
    profile.rol === "admin" ? payload.vendedor_id?.trim() : profile.id;

  if (!vendedorId) {
    return {
      ...state,
      errors: {
        ...state.errors,
        vendedor_id: "Selecciona un vendedor responsable.",
      },
      formError: "Revisa los campos marcados.",
    };
  }

  const accessError = await validateEventoAccess({
    salonId: payload.salon_id,
    vendedorId,
    currentUserId: profile.id,
    currentUserRole: profile.rol,
  });

  if (accessError) {
    return {
      ...state,
      formError: accessError,
    };
  }

  const { data, error } = await supabase
    .from("eventos")
    .insert({
      ...payload,
      vendedor_id: vendedorId,
      estado: "borrador",
    })
    .select("id")
    .single();

  if (error) {
    logSupabaseError("createEventoAction insertar evento", error);
    return {
      ...state,
      formError: "No se pudo crear el evento. Intenta nuevamente.",
    };
  }

  revalidatePath("/eventos");
  revalidatePath(`/eventos/${data.id}`);
  redirect(`/eventos/${data.id}?created=1`);
}

export async function updateEventoAction(
  id: string,
  _previousState: EventoFormState,
  formData: FormData,
): Promise<EventoFormState> {
  const profile = await getCurrentProfile();

  if (!profile?.activo) {
    redirect("/dashboard");
  }

  const { state, payload } = validateEventoForm(formData);

  if (!payload) {
    return state;
  }

  const currentEvento = await getEditableEventoById(id);

  if (!currentEvento) {
    return {
      ...state,
      formError:
        "No se pudo actualizar el evento. Verifica los datos e intenta nuevamente.",
    };
  }

  if (profile.rol === "vendedor") {
    const canEditCurrentSalon = await usuarioTieneSalon(
      profile.id,
      currentEvento.salon_id,
    );

    if (!canEditCurrentSalon) {
      return {
        ...state,
        formError:
          "No se pudo actualizar el evento. Verifica los datos e intenta nuevamente.",
      };
    }
  }

  const vendedorId =
    profile.rol === "admin" ? payload.vendedor_id?.trim() : undefined;

  if (profile.rol === "admin" && !vendedorId) {
    return {
      ...state,
      errors: {
        ...state.errors,
        vendedor_id: "Selecciona un vendedor responsable.",
      },
      formError: "Revisa los campos marcados.",
    };
  }

  const accessError = await validateEventoUpdateAccess({
    salonId: payload.salon_id,
    vendedorId,
    currentUserId: profile.id,
    currentUserRole: profile.rol,
  });

  if (accessError) {
    return {
      ...state,
      formError: accessError,
    };
  }

  const updatePayload: TablesUpdate<"eventos"> = {
    salon_id: payload.salon_id,
    cliente_nombre: payload.cliente_nombre,
    cliente_razon_social: payload.cliente_razon_social,
    cliente_cuit_dni: payload.cliente_cuit_dni,
    cliente_direccion: payload.cliente_direccion,
    cliente_ciudad: payload.cliente_ciudad,
    cliente_direccion_factura: payload.cliente_direccion_factura,
    cliente_contacto: payload.cliente_contacto,
    fecha_evento: payload.fecha_evento,
    fecha_contrato: payload.fecha_contrato,
    tipo_evento: payload.tipo_evento,
    espacio: payload.espacio,
    pax_adultos: payload.pax_adultos,
    pax_jovenes: payload.pax_jovenes,
    pax_menores: payload.pax_menores,
    pax_bebes: payload.pax_bebes,
    organizador_externo: payload.organizador_externo,
    comision_organizador: payload.comision_organizador,
    observaciones: payload.observaciones,
  };

  if (profile.rol === "admin") {
    updatePayload.vendedor_id = vendedorId;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("eventos")
    .update(updatePayload)
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    logSupabaseError("updateEventoAction actualizar evento", error);
    return {
      ...state,
      formError: "No se pudo actualizar el evento. Intenta nuevamente.",
    };
  }

  if (!data) {
    return {
      ...state,
      formError:
        "No se pudo actualizar el evento. Verifica los datos e intenta nuevamente.",
    };
  }

  revalidatePath("/eventos");
  revalidatePath(`/eventos/${id}`);
  revalidatePath(`/eventos/${id}/editar`);
  redirect(`/eventos/${id}?updated=1`);
}

async function validateEventoAccess({
  salonId,
  vendedorId,
  currentUserId,
  currentUserRole,
}: {
  salonId: string;
  vendedorId: string;
  currentUserId: string;
  currentUserRole: "admin" | "vendedor";
}) {
  const supabase = await createClient();
  const { data: salon, error: salonError } = await supabase
    .from("salones")
    .select("id")
    .eq("id", salonId)
    .eq("activo", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (salonError) {
    logSupabaseError("createEventoAction validar salon", salonError);
    return "No se pudo validar el salon seleccionado.";
  }

  if (!salon) {
    return "Selecciona un salon activo disponible.";
  }

  if (currentUserRole === "vendedor" && vendedorId !== currentUserId) {
    return "No podes crear eventos para otro vendedor.";
  }

  if (currentUserRole === "vendedor") {
    const { data: assignment, error: assignmentError } = await supabase
      .from("usuario_salon")
      .select("usuario_id")
      .eq("usuario_id", vendedorId)
      .eq("salon_id", salonId)
      .maybeSingle();

    if (assignmentError) {
      logSupabaseError(
        "createEventoAction validar asignacion vendedor",
        assignmentError,
      );
      return "No se pudo validar la asignacion del salon.";
    }

    if (!assignment) {
      return "El vendedor seleccionado no tiene asignado ese salon.";
    }
  }

  if (currentUserRole === "admin") {
    const { data: vendedor, error: vendedorError } = await supabase
      .from("usuarios")
      .select("id")
      .eq("id", vendedorId)
      .eq("rol", "vendedor")
      .eq("activo", true)
      .maybeSingle();

    if (vendedorError) {
      logSupabaseError("createEventoAction validar vendedor", vendedorError);
      return "No se pudo validar el vendedor seleccionado.";
    }

    if (!vendedor) {
      return "Selecciona un vendedor activo.";
    }
  }

  return null;
}

async function validateEventoUpdateAccess({
  salonId,
  vendedorId,
  currentUserId,
  currentUserRole,
}: {
  salonId: string;
  vendedorId?: string;
  currentUserId: string;
  currentUserRole: "admin" | "vendedor";
}) {
  const salonError = await validateSalonActivo(salonId);

  if (salonError) {
    return salonError;
  }

  if (currentUserRole === "vendedor") {
    const tieneSalon = await usuarioTieneSalon(currentUserId, salonId);

    if (!tieneSalon) {
      return "No podes editar eventos de un salon que no tenes asignado.";
    }

    return null;
  }

  if (!vendedorId) {
    return "Selecciona un vendedor activo.";
  }

  return validateVendedorActivo(vendedorId);
}

async function getEditableEventoById(
  id: string,
): Promise<EditableEvento | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("eventos")
    .select("id, salon_id, vendedor_id")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    logSupabaseError("updateEventoAction obtener evento actual", error);
    return null;
  }

  return data;
}

async function validateSalonActivo(salonId: string) {
  const supabase = await createClient();
  const { data: salon, error: salonError } = await supabase
    .from("salones")
    .select("id")
    .eq("id", salonId)
    .eq("activo", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (salonError) {
    logSupabaseError("validateSalonActivo validar salon", salonError);
    return "No se pudo validar el salon seleccionado.";
  }

  if (!salon) {
    return "Selecciona un salon activo disponible.";
  }

  return null;
}

async function validateVendedorActivo(vendedorId: string) {
  const supabase = await createClient();
  const { data: vendedor, error: vendedorError } = await supabase
    .from("usuarios")
    .select("id")
    .eq("id", vendedorId)
    .eq("rol", "vendedor")
    .eq("activo", true)
    .maybeSingle();

  if (vendedorError) {
    logSupabaseError("validateVendedorActivo validar vendedor", vendedorError);
    return "No se pudo validar el vendedor seleccionado.";
  }

  if (!vendedor) {
    return "Selecciona un vendedor activo.";
  }

  return null;
}

async function usuarioTieneSalon(usuarioId: string, salonId: string) {
  const supabase = await createClient();
  const { data: assignment, error: assignmentError } = await supabase
    .from("usuario_salon")
    .select("usuario_id")
    .eq("usuario_id", usuarioId)
    .eq("salon_id", salonId)
    .maybeSingle();

  if (assignmentError) {
    logSupabaseError("usuarioTieneSalon validar asignacion", assignmentError);
    return false;
  }

  return Boolean(assignment);
}
