import { createClient } from "@/lib/supabase/server";
import type { Enums, Tables } from "@/types/database.types";

export type AppRole = Enums<"rol_usuario">;
export type CurrentProfile = Tables<"usuarios">;

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo obtener el perfil del usuario actual.");
  }

  return data;
}

export async function getCurrentRole(): Promise<AppRole | null> {
  const profile = await getCurrentProfile();

  return profile?.rol ?? null;
}
