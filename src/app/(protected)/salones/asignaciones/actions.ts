"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  type SalonAssignmentsFormState,
  validateSalonAssignmentsForm,
} from "@/lib/salones/asignaciones-validation";
import { createClient } from "@/lib/supabase/server";

export async function saveUsuarioSalonAssignmentsAction(
  _previousState: SalonAssignmentsFormState,
  formData: FormData,
): Promise<SalonAssignmentsFormState> {
  await requireAdmin();

  const { state, payload } = validateSalonAssignmentsForm(formData);

  if (!payload) {
    return state;
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_usuario_salon_assignments", {
    p_usuario_id: payload.usuarioId,
    p_salon_ids: payload.salonIds,
  });

  if (error) {
    return {
      formError: "No se pudieron guardar las asignaciones. Intenta nuevamente.",
      successMessage: null,
    };
  }

  revalidatePath("/salones");
  revalidatePath("/salones/asignaciones");

  return {
    formError: null,
    successMessage: "Asignaciones guardadas correctamente.",
  };
}
