import type { Tables } from "@/types/database.types";
import {
  formatAuditValue,
  getActionLabel,
  getAuditChanges,
  getDisplayAction,
  getFieldLabel,
  getTableLabel,
  safeJsonStringify,
} from "@/lib/audit/presentation";

type AuditLogDetail = Pick<
  Tables<"audit_log">,
  | "accion"
  | "created_at"
  | "datos_anteriores"
  | "datos_nuevos"
  | "registro_id"
  | "tabla"
  | "usuario_id"
> & {
  usuarios: { email: string; full_name: string | null } | null;
};

export function AuditDetail({ log }: { log: AuditLogDetail }) {
  const action = getDisplayAction({
    action: log.accion,
    afterValue: log.datos_nuevos,
    beforeValue: log.datos_anteriores,
    table: log.tabla,
  });
  const changes = getAuditChanges(log.datos_anteriores, log.datos_nuevos);

  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-sm font-medium text-teal-700 hover:text-teal-800 group-open:mb-4">
        <span className="group-open:hidden">Ver detalle</span>
        <span className="hidden group-open:inline">Ocultar detalle</span>
      </summary>

      <div className="min-w-[42rem] space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metadata label="Fecha y hora" value={formatDateTime(log.created_at)} />
          <Metadata
            label="Responsable"
            value={
              log.usuarios
                ? formatResponsible(log.usuarios)
                : log.usuario_id
                  ? `Usuario inexistente (${log.usuario_id})`
                  : "Operacion del sistema o responsable no disponible"
            }
          />
          <Metadata label="Accion" value={getActionLabel(action)} />
          <Metadata label="Entidad" value={getTableLabel(log.tabla)} />
          <Metadata label="ID del registro" value={log.registro_id} mono />
          <Metadata
            label="Campos cambiados"
            value={String(changes.length)}
          />
        </dl>

        {changes.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-100/80 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">Campo</th>
                  <th className="px-3 py-2 font-semibold">Valor anterior</th>
                  <th className="px-3 py-2 font-semibold">Valor nuevo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {changes.map((change) => (
                  <tr key={change.field}>
                    <th className="px-3 py-2.5 font-semibold text-slate-700">
                      {getFieldLabel(change.field)}
                    </th>
                    <td className="max-w-72 whitespace-pre-wrap break-words px-3 py-2.5 text-slate-500">
                      {formatAuditValue(change.before)}
                    </td>
                    <td className="max-w-72 whitespace-pre-wrap break-words px-3 py-2.5 font-medium text-slate-800">
                      {formatAuditValue(change.after)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No hay campos funcionales disponibles para comparar.
          </p>
        )}

        <details>
          <summary className="cursor-pointer text-xs font-medium text-slate-600 hover:text-slate-900">
            Ver JSON original
          </summary>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <JsonBlock label="Datos anteriores" value={log.datos_anteriores} />
            <JsonBlock label="Datos nuevos" value={log.datos_nuevos} />
          </div>
        </details>
      </div>
    </details>
  );
}

function Metadata({
  label,
  mono = false,
  value,
}: {
  label: string;
  mono?: boolean;
  value: string;
}) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd
        className={`mt-1 break-words text-xs text-slate-800 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function JsonBlock({
  label,
  value,
}: {
  label: string;
  value: Tables<"audit_log">["datos_anteriores"];
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-700">{label}</p>
      <pre className="mt-1 max-h-72 overflow-auto rounded-lg bg-slate-950 p-3 text-[11px] leading-5 text-slate-100">
        {safeJsonStringify(value)}
      </pre>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(value));
}

function formatResponsible(user: { email: string; full_name: string | null }) {
  const name = user.full_name?.trim();
  return name ? `${name} (${user.email})` : user.email;
}
