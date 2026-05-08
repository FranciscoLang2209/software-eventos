import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";

export type Salon = Tables<"salones">;

export async function listSalones() {
  await requireAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("salones")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) {
    throw new Error("No se pudo obtener el listado de salones.");
  }

  return data;
}

export async function getSalonById(id: string) {
  await requireAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("salones")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo obtener el salon.");
  }

  return data;
}
