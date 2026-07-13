import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/errors";

export async function listAuditLogs() {
  await requireAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select(
      "id, accion, created_at, datos_anteriores, datos_nuevos, registro_id, tabla, usuario_id, usuarios(full_name, email)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    logSupabaseError("listAuditLogs", error);
    throw new Error("No se pudo cargar el historial de auditoria.");
  }

  return data ?? [];
}
