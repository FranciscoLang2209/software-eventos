import { requireAdmin } from "@/lib/auth";
import {
  AUDIT_PAGE_SIZE,
  getAuditRange,
  getDateBoundary,
  type AuditFilters,
} from "@/lib/audit/filters";
import { logSupabaseError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

export async function listAuditLogs(filters: AuditFilters) {
  await requireAdmin();

  const supabase = await createClient();
  const { from, to } = getAuditRange(filters.page);
  let auditQuery = supabase
    .from("audit_log")
    .select(
      "id, accion, created_at, datos_anteriores, datos_nuevos, registro_id, tabla, usuario_id, usuarios(full_name, email)",
      { count: "exact" },
    )
    .order("created_at", { ascending: filters.order === "asc" })
    .order("id", { ascending: filters.order === "asc" })
    .range(from, to);

  if (filters.dateFrom) {
    auditQuery = auditQuery.gte(
      "created_at",
      getDateBoundary(filters.dateFrom, "start"),
    );
  }
  if (filters.dateTo) {
    auditQuery = auditQuery.lte(
      "created_at",
      getDateBoundary(filters.dateTo, "end"),
    );
  }
  if (filters.userId) auditQuery = auditQuery.eq("usuario_id", filters.userId);
  if (filters.action) auditQuery = auditQuery.eq("accion", filters.action);
  if (filters.table) auditQuery = auditQuery.eq("tabla", filters.table);
  if (filters.recordId) {
    auditQuery = auditQuery.eq("registro_id", filters.recordId);
  }

  const [auditResult, usersResult] = await Promise.all([
    auditQuery,
    supabase
      .from("usuarios")
      .select("id, full_name, email")
      .order("full_name", { ascending: true }),
  ]);

  if (auditResult.error) {
    logSupabaseError("listAuditLogs", auditResult.error);
    throw new Error("No se pudo cargar el historial de auditoria.");
  }
  if (usersResult.error) {
    logSupabaseError("listAuditLogs users", usersResult.error);
    throw new Error("No se pudieron cargar los filtros de auditoria.");
  }

  const total = auditResult.count ?? 0;

  return {
    filters,
    logs: auditResult.data ?? [],
    pageSize: AUDIT_PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE)),
    users: usersResult.data,
  };
}
