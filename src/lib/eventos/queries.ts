import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/errors";
import type { Tables } from "@/types/database.types";

export type EventoSalon = Pick<
  Tables<"salones">,
  "id" | "nombre" | "direccion" | "capacidad"
>;
export type EventoVendedor = Pick<
  Tables<"usuarios">,
  "id" | "full_name" | "email"
>;
export type EventoSalonAssignment = Pick<
  Tables<"usuario_salon">,
  "usuario_id" | "salon_id"
>;
export type EventoDetalle = Tables<"eventos"> & {
  salones: Pick<Tables<"salones">, "nombre"> | null;
  usuarios: Pick<Tables<"usuarios">, "full_name" | "email"> | null;
};

export async function getNuevoEventoPageData() {
  const profile = await getActiveProfile();
  const supabase = await createClient();

  if (profile.rol === "admin") {
    const [salonesResult, vendedoresResult] = await Promise.all([
      supabase
        .from("salones")
        .select("id, nombre, direccion, capacidad")
        .eq("activo", true)
        .is("deleted_at", null)
        .order("nombre", { ascending: true }),
      supabase
        .from("usuarios")
        .select("id, full_name, email")
        .eq("rol", "vendedor")
        .eq("activo", true)
        .order("full_name", { ascending: true }),
    ]);

    if (salonesResult.error) {
      logSupabaseError("getNuevoEventoPageData admin salones", salonesResult.error);
      throw new Error("No se pudo obtener el listado de salones.");
    }

    if (vendedoresResult.error) {
      logSupabaseError(
        "getNuevoEventoPageData admin vendedores",
        vendedoresResult.error,
      );
      throw new Error("No se pudo obtener el listado de vendedores.");
    }

    return {
      profile,
      salones: salonesResult.data,
      vendedores: vendedoresResult.data,
      assignments: [],
    };
  }

  const salones = await getAssignedActiveSalones(profile.id);

  return {
    profile,
    salones,
    vendedores: [
      {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
      },
    ],
    assignments: [],
  };
}

export async function getEventoById(id: string) {
  const profile = await getActiveProfile();
  const supabase = await createClient();
  const query = supabase
    .from("eventos")
    .select("*, salones(nombre), usuarios(full_name, email)")
    .eq("id", id)
    .is("deleted_at", null);

  if (profile.rol === "vendedor") {
    query.eq("vendedor_id", profile.id);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    logSupabaseError("getEventoById evento", error);
    throw new Error("No se pudo obtener el evento.");
  }

  if (!data) {
    notFound();
  }

  return {
    profile,
    evento: data as EventoDetalle,
  };
}

export async function getAssignedActiveSalones(usuarioId: string) {
  const supabase = await createClient();
  const { data: assignments, error: assignmentsError } = await supabase
    .from("usuario_salon")
    .select("salon_id")
    .eq("usuario_id", usuarioId);

  if (assignmentsError) {
    logSupabaseError("getAssignedActiveSalones assignments", assignmentsError);
    throw new Error("No se pudieron obtener los salones asignados.");
  }

  const salonIds = assignments.map((assignment) => assignment.salon_id);

  if (salonIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("salones")
    .select("id, nombre, direccion, capacidad")
    .in("id", salonIds)
    .eq("activo", true)
    .is("deleted_at", null)
    .order("nombre", { ascending: true });

  if (error) {
    logSupabaseError("getAssignedActiveSalones salones", error);
    throw new Error("No se pudo obtener el listado de salones asignados.");
  }

  return data;
}

async function getActiveProfile() {
  const profile = await getCurrentProfile();

  if (!profile?.activo) {
    redirect("/dashboard");
  }

  return profile;
}
