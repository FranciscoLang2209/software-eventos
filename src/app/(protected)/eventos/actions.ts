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
