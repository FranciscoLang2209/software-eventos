import Link from "next/link";
import { redirect } from "next/navigation";
import { AuditDetail } from "@/components/audit/audit-detail";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AUDITED_TABLES,
  AUDIT_ACTIONS,
  hasAuditFilters,
  parseAuditFilters,
  type AuditFilters,
  type AuditSearchParams,
} from "@/lib/audit/filters";
import {
  getActionLabel,
  getAuditObject,
  getAuditSummary,
  getDisplayAction,
  getTableLabel,
} from "@/lib/audit/presentation";
import { listAuditLogs } from "@/lib/audit/queries";

type AuditoriaPageProps = {
  searchParams?: Promise<AuditSearchParams>;
};

export default async function AuditoriaPage({
  searchParams,
}: AuditoriaPageProps) {
  const params = searchParams ? await searchParams : {};
  const filters = parseAuditFilters(params);
  const { logs, pageSize, total, totalPages, users } =
    await listAuditLogs(filters);

  if (total > 0 && filters.page > totalPages) {
    redirect(getPageHref(filters, totalPages));
  }

  const hasFilters = hasAuditFilters(filters);
  const firstResult = total === 0 ? 0 : (filters.page - 1) * pageSize + 1;
  const lastResult = Math.min(filters.page * pageSize, total);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Auditoria administrativa"
        description="Consulta el historial inmutable de cambios importantes realizados dentro del sistema."
        actions={
          <Link
            href="/admin"
            className={buttonVariants({ variant: "secondary" })}
          >
            Volver al panel
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Todos los filtros se combinan y se aplican en la consulta al servidor.
          </p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterDate
              defaultValue={filters.dateFrom}
              label="Desde"
              name="desde"
            />
            <FilterDate
              defaultValue={filters.dateTo}
              label="Hasta"
              name="hasta"
            />
            <FilterSelect
              defaultValue={filters.userId}
              label="Usuario"
              name="usuario"
              options={[
                { label: "Todos", value: "todos" },
                ...users.map((user) => ({
                  label: getUserOptionLabel(user),
                  value: user.id,
                })),
              ]}
            />
            <FilterSelect
              defaultValue={filters.action}
              label="Accion"
              name="accion"
              options={[
                { label: "Todas", value: "todas" },
                ...AUDIT_ACTIONS.map((action) => ({
                  label: getActionLabel(action),
                  value: action,
                })),
              ]}
            />
            <FilterSelect
              defaultValue={filters.table}
              label="Entidad"
              name="tabla"
              options={[
                { label: "Todas", value: "todas" },
                ...AUDITED_TABLES.map((table) => ({
                  label: getTableLabel(table),
                  value: table,
                })),
              ]}
            />
            <FilterInput
              defaultValue={filters.recordId}
              label="ID del registro"
              name="registro"
              placeholder="UUID o ID compuesto exacto"
            />
            <FilterSelect
              defaultValue={filters.order}
              label="Orden"
              name="orden"
              options={[
                { label: "Mas recientes primero", value: "desc" },
                { label: "Mas antiguos primero", value: "asc" },
              ]}
            />
            <div className="flex items-end gap-3">
              {hasFilters ? (
                <Link
                  href="/admin/auditoria"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Limpiar filtros
                </Link>
              ) : null}
              <button
                type="submit"
                className={buttonVariants({ variant: "primary" })}
              >
                Aplicar filtros
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Historial de cambios</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              {total > 0
                ? `Mostrando ${firstResult}-${lastResult} de ${total} registros`
                : hasFilters
                  ? "No hay resultados para los filtros aplicados"
                  : "Todavia no hay registros de auditoria"}
            </p>
          </div>
          <Badge variant="primary">Solo administradores</Badge>
        </CardHeader>

        {logs.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead scope="col">Fecha</TableHead>
                  <TableHead scope="col">Usuario</TableHead>
                  <TableHead scope="col">Entidad y registro</TableHead>
                  <TableHead scope="col">Accion</TableHead>
                  <TableHead scope="col">Resumen</TableHead>
                  <TableHead scope="col">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const displayAction = getDisplayAction({
                    action: log.accion,
                    afterValue: log.datos_nuevos,
                    beforeValue: log.datos_anteriores,
                    table: log.tabla,
                  });
                  const eventId = getEventId(log);

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-slate-600">
                        {formatDateTime(log.created_at)}
                      </TableCell>
                      <TableCell className="min-w-52">
                        <p className="font-medium text-slate-950">
                          {log.usuarios?.full_name?.trim() ||
                            log.usuarios?.email ||
                            "Responsable no disponible"}
                        </p>
                        <p className="mt-1 break-all text-xs text-slate-500">
                          {log.usuarios?.email ?? log.usuario_id ?? "Operacion del sistema"}
                        </p>
                      </TableCell>
                      <TableCell className="min-w-56">
                        <p className="font-medium text-slate-950">
                          {getTableLabel(log.tabla)}
                        </p>
                        <p className="mt-1 break-all font-mono text-xs text-slate-500">
                          {log.registro_id}
                        </p>
                        {getContextLabel(log) ? (
                          <p className="mt-1 text-xs text-slate-600">
                            {getContextLabel(log)}
                          </p>
                        ) : null}
                        {eventId ? (
                          <Link
                            href={`/eventos/${eventId}`}
                            className="mt-2 inline-block text-xs font-medium text-teal-700 hover:underline"
                          >
                            Abrir evento
                          </Link>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionVariant(displayAction)}>
                          {getActionLabel(displayAction)}
                        </Badge>
                      </TableCell>
                      <TableCell className="min-w-64 text-slate-600">
                        {getAuditSummary(
                          log.datos_anteriores,
                          log.datos_nuevos,
                        )}
                      </TableCell>
                      <TableCell>
                        <AuditDetail log={log} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <nav
              aria-label="Paginacion del historial"
              className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm text-slate-500">
                Pagina {filters.page} de {totalPages}
              </p>
              <div className="flex gap-2">
                {filters.page > 1 ? (
                  <Link
                    href={getPageHref(filters, filters.page - 1)}
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                  >
                    Anterior
                  </Link>
                ) : null}
                {filters.page < totalPages ? (
                  <Link
                    href={getPageHref(filters, filters.page + 1)}
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                  >
                    Siguiente
                  </Link>
                ) : null}
              </div>
            </nav>
          </>
        ) : (
          <EmptyState
            title={
              hasFilters
                ? "No hay cambios con estos filtros"
                : "Todavia no hay cambios auditados"
            }
            description={
              hasFilters
                ? "Proba otra combinacion o limpia los filtros para ver todo el historial."
                : "Las altas, ediciones, eliminaciones y asignaciones apareceran aca."
            }
            action={
              hasFilters ? (
                <Link
                  href="/admin/auditoria"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Limpiar filtros
                </Link>
              ) : undefined
            }
          />
        )}
      </Card>
    </section>
  );
}

function FilterInput({
  defaultValue,
  label,
  name,
  ...props
}: {
  defaultValue?: string;
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="search"
        defaultValue={defaultValue}
        {...props}
      />
    </div>
  );
}

function FilterDate({
  defaultValue,
  label,
  name,
}: {
  defaultValue?: string;
  label: string;
  name: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <DatePickerField
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder="Seleccionar fecha"
      />
    </div>
  );
}

function FilterSelect({
  defaultValue,
  label,
  name,
  options,
}: {
  defaultValue?: string;
  label: string;
  name: string;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Select
        name={name}
        defaultValue={defaultValue ?? options[0]?.value}
      >
        <SelectTrigger id={name}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function getUserOptionLabel(user: {
  email: string;
  full_name: string | null;
}) {
  const name = user.full_name?.trim();
  return name ? `${name} (${user.email})` : user.email;
}

function getPageHref(filters: AuditFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set("desde", filters.dateFrom);
  if (filters.dateTo) params.set("hasta", filters.dateTo);
  if (filters.userId) params.set("usuario", filters.userId);
  if (filters.action) params.set("accion", filters.action);
  if (filters.table) params.set("tabla", filters.table);
  if (filters.recordId) params.set("registro", filters.recordId);
  if (filters.order === "asc") params.set("orden", "asc");
  params.set("pagina", String(page));
  return `/admin/auditoria?${params.toString()}`;
}

function getEventId(
  log: Awaited<ReturnType<typeof listAuditLogs>>["logs"][number],
) {
  if (log.tabla === "eventos") return log.registro_id;
  const after = getAuditObject(log.datos_nuevos);
  const before = getAuditObject(log.datos_anteriores);
  const eventId = after.evento_id ?? before.evento_id;
  return typeof eventId === "string" ? eventId : null;
}

function getContextLabel(
  log: Awaited<ReturnType<typeof listAuditLogs>>["logs"][number],
) {
  const after = getAuditObject(log.datos_nuevos);
  const before = getAuditObject(log.datos_anteriores);
  const snapshot = { ...before, ...after };
  const value =
    snapshot.nombre_evento ??
    snapshot.cliente_nombre ??
    snapshot.full_name ??
    snapshot.nombre ??
    snapshot.concepto;
  return typeof value === "string" && value.trim() ? value : null;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(value));
}

function getActionVariant(
  action: ReturnType<typeof getDisplayAction>,
): "danger" | "success" | "warning" | "primary" | "neutral" {
  if (action === "DELETE" || action === "SOFT_DELETE" || action === "UNASSIGN") {
    return "danger";
  }
  if (action === "INSERT" || action === "RESTORE" || action === "ASSIGN") {
    return "success";
  }
  return "warning";
}
