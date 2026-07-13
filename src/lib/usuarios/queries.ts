import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";

export type Usuario = Tables<"usuarios">;
export type UsuarioSalonItem = Pick<
  Tables<"salones">,
  "activo" | "deleted_at" | "id" | "nombre"
>;

export type UsuarioListItem = Usuario & {
  salones: UsuarioSalonItem[];
};

export type UsuarioFilters = {
  estado?: "activo" | "inactivo";
  rol?: "admin" | "vendedor";
  salonId?: string;
  search?: string;
};

export async function listUsuarios(filters: UsuarioFilters = {}) {
  const currentProfile = await requireAdmin();
  const supabase = await createClient();
  const [usersResult, salonesResult, assignmentsResult] = await Promise.all([
    supabase
      .from("usuarios")
      .select("*")
      .order("full_name", { ascending: true }),
    supabase
      .from("salones")
      .select("id, nombre, activo, deleted_at")
      .order("nombre", { ascending: true }),
    supabase.from("usuario_salon").select("usuario_id, salon_id"),
  ]);

  if (usersResult.error) {
    throw new Error("No se pudo obtener el listado de usuarios.");
  }
  if (salonesResult.error) {
    throw new Error("No se pudo obtener el listado de salones.");
  }
  if (assignmentsResult.error) {
    throw new Error("No se pudieron obtener las asignaciones de usuarios.");
  }

  const salonesById = new Map(
    salonesResult.data.map((salon) => [salon.id, salon]),
  );
  const salonIdsByUsuario = new Map<string, string[]>();

  for (const assignment of assignmentsResult.data) {
    const ids = salonIdsByUsuario.get(assignment.usuario_id) ?? [];
    ids.push(assignment.salon_id);
    salonIdsByUsuario.set(assignment.usuario_id, ids);
  }

  const normalizedSearch = filters.search?.trim().toLowerCase() ?? "";
  const users: UsuarioListItem[] = usersResult.data
    .map((user) => ({
      ...user,
      salones: (salonIdsByUsuario.get(user.id) ?? [])
        .map((salonId) => salonesById.get(salonId))
        .filter((salon): salon is UsuarioSalonItem => Boolean(salon)),
    }))
    .filter((user) => {
      if (filters.rol && user.rol !== filters.rol) return false;
      if (filters.estado && user.activo !== (filters.estado === "activo")) {
        return false;
      }
      if (
        filters.salonId &&
        !user.salones.some((salon) => salon.id === filters.salonId)
      ) {
        return false;
      }
      if (
        normalizedSearch &&
        !`${user.full_name} ${user.email}`
          .toLowerCase()
          .includes(normalizedSearch)
      ) {
        return false;
      }
      return true;
    });

  return {
    currentProfile,
    filters,
    salones: salonesResult.data,
    totalUsers: usersResult.data.length,
    users,
  };
}

export async function getUsuarioCreatePageData() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("salones")
    .select("id, nombre, activo, deleted_at")
    .eq("activo", true)
    .is("deleted_at", null)
    .order("nombre", { ascending: true });

  if (error) {
    throw new Error("No se pudieron obtener los salones asignables.");
  }

  return { salones: data };
}

export async function getUsuarioEditPageData(id: string) {
  const currentProfile = await requireAdmin();
  const supabase = await createClient();
  const [userResult, salonesResult, assignmentsResult] = await Promise.all([
    supabase.from("usuarios").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("salones")
      .select("id, nombre, activo, deleted_at")
      .eq("activo", true)
      .is("deleted_at", null)
      .order("nombre", { ascending: true }),
    supabase
      .from("usuario_salon")
      .select("salon_id")
      .eq("usuario_id", id),
  ]);

  if (userResult.error) {
    throw new Error("No se pudo obtener el usuario.");
  }
  if (!userResult.data) notFound();
  if (salonesResult.error || assignmentsResult.error) {
    throw new Error("No se pudieron obtener las asignaciones del usuario.");
  }

  return {
    currentProfile,
    salonIds: assignmentsResult.data.map((item) => item.salon_id),
    salones: salonesResult.data,
    user: userResult.data,
  };
}
