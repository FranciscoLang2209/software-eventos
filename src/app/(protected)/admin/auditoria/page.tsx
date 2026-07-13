import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAuditLogs } from "@/lib/audit/queries";
import type { Json } from "@/types/database.types";

export default async function AuditoriaPage() {
  const logs = await listAuditLogs();

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Auditoria administrativa"
        description="Ultimos cambios realizados por administradores sobre usuarios, eventos y movimientos relacionados."
        actions={
          <Link
            href="/admin"
            className={buttonVariants({ variant: "secondary" })}
          >
            Volver al panel
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Se muestran hasta 100 registros, del mas reciente al mas antiguo.
          </p>
        </CardHeader>

        {logs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead scope="col">Fecha</TableHead>
                <TableHead scope="col">Usuario</TableHead>
                <TableHead scope="col">Entidad</TableHead>
                <TableHead scope="col">Accion</TableHead>
                <TableHead scope="col">Cambios</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const eventoId = getEventoId(log);

                return (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-slate-600">
                      {formatDateTime(log.created_at)}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-950">
                        {log.usuarios?.full_name ?? "Administrador"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {log.usuarios?.email ?? log.usuario_id ?? "-"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-950">
                        {getTableLabel(log.tabla)}
                      </p>
                      <p className="mt-1 max-w-48 break-all font-mono text-xs text-slate-500">
                        {log.registro_id}
                      </p>
                      {eventoId ? (
                        <Link
                          href={`/eventos/${eventoId}`}
                          className="mt-2 inline-block text-xs font-medium text-teal-700 hover:text-teal-800 hover:underline"
                        >
                          Abrir evento
                        </Link>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionVariant(log.accion)}>
                        {getActionLabel(log.accion)}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-72">
                      <AuditChanges
                        before={log.datos_anteriores}
                        after={log.datos_nuevos}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="Todavia no hay cambios auditados"
            description="Las modificaciones administrativas de usuarios, eventos, servicios, pagos y egresos apareceran aca."
          />
        )}
      </Card>
    </section>
  );
}

function AuditChanges({ before, after }: { before: Json; after: Json }) {
  const beforeObject = getJsonObject(before);
  const afterObject = getJsonObject(after);
  const keys = Array.from(
    new Set([...Object.keys(beforeObject), ...Object.keys(afterObject)]),
  );

  if (keys.length === 0) {
    return <span className="text-sm text-slate-500">Sin detalle</span>;
  }

  return (
    <details>
      <summary className="cursor-pointer text-sm font-medium text-teal-700 hover:text-teal-800">
        Ver {keys.length === 1 ? "1 campo" : `${keys.length} campos`}
      </summary>
      <dl className="mt-3 space-y-3 border-l border-slate-200 pl-3">
        {keys.map((key) => (
          <div key={key}>
            <dt className="text-xs font-semibold text-slate-700">
              {getFieldLabel(key)}
            </dt>
            {key in beforeObject ? (
              <dd className="mt-1 break-words text-xs text-slate-500 line-through">
                {formatAuditValue(beforeObject[key])}
              </dd>
            ) : null}
            {key in afterObject ? (
              <dd className="mt-1 break-words text-xs font-medium text-slate-700">
                {formatAuditValue(afterObject[key])}
              </dd>
            ) : null}
          </div>
        ))}
      </dl>
    </details>
  );
}

function getJsonObject(value: Json): Record<string, Json | undefined> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  return {};
}

function getEventoId(log: Awaited<ReturnType<typeof listAuditLogs>>[number]) {
  if (log.tabla === "eventos" && log.accion !== "DELETE") {
    return log.registro_id;
  }

  const after = getJsonObject(log.datos_nuevos);
  const before = getJsonObject(log.datos_anteriores);
  const eventoId = after.evento_id ?? before.evento_id;

  return typeof eventoId === "string" ? eventoId : null;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(value));
}

function formatAuditValue(value: Json | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Sin valor";
  }

  if (typeof value === "boolean") {
    return value ? "Si" : "No";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function getActionLabel(action: string) {
  const labels: Record<string, string> = {
    DELETE: "Eliminacion",
    INSERT: "Alta",
    UPDATE: "Edicion",
  };

  return labels[action] ?? action;
}

function getActionVariant(action: string) {
  if (action === "DELETE") {
    return "danger" as const;
  }

  if (action === "INSERT") {
    return "success" as const;
  }

  return "warning" as const;
}

function getTableLabel(table: string) {
  const labels: Record<string, string> = {
    egresos: "Egreso",
    evento_servicios: "Servicio del evento",
    eventos: "Evento",
    pagos: "Pago",
    usuarios: "Usuario",
  };

  return labels[table] ?? table;
}

function getFieldLabel(field: string) {
  const labels: Record<string, string> = {
    activo: "Estado activo",
    email: "Email",
    evento_id: "Evento",
    full_name: "Nombre completo",
    rol: "Rol",
    salon_id: "Salon",
    salon_ids: "Salones asignados",
    vendedor_id: "Vendedor",
  };

  return labels[field] ?? field.replaceAll("_", " ");
}
