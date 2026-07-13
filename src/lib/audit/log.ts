import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/errors";
import type { Json } from "@/types/database.types";

type AuditAction = "INSERT" | "UPDATE" | "DELETE";

export async function insertAuditLog({
  accion,
  datosAnteriores,
  datosNuevos,
  registroId,
  tabla,
  usuarioId,
}: {
  accion: AuditAction;
  datosAnteriores?: Json;
  datosNuevos?: Json;
  registroId: string;
  tabla: string;
  usuarioId: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("audit_log").insert({
    accion,
    datos_anteriores: datosAnteriores ?? null,
    datos_nuevos: datosNuevos ?? null,
    registro_id: registroId,
    tabla,
    usuario_id: usuarioId,
  });

  if (error) {
    logSupabaseError("insertAuditLog", error);
    return false;
  }

  return true;
}

