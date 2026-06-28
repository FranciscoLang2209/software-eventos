import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/form";
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
  getReportesGenerales,
  type ReportesGeneralesRow,
  type ReportesGeneralesSearchParams,
} from "@/lib/reportes/queries";

type ReportesPageProps = {
  searchParams?: Promise<ReportesGeneralesSearchParams>;
};

export default async function ReportesPage({
  searchParams,
}: ReportesPageProps) {
  const params = searchParams ? await searchParams : {};
  const reportes = await getReportesGenerales(params);
  const isAdmin = reportes.profile.rol === "admin";

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Reportes"
        title="Reportes generales"
        description="Metricas operativas y financieras registradas para el periodo seleccionado."
      />

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Eventos por fecha del evento; ingresos y egresos por fecha del
            movimiento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <div>
              <Label htmlFor="desde">Desde</Label>
              <DatePickerField
                id="desde"
                name="desde"
                defaultValue={reportes.filters.fechaDesde}
                placeholder="Desde"
              />
            </div>
            <div>
              <Label htmlFor="hasta">Hasta</Label>
              <DatePickerField
                id="hasta"
                name="hasta"
                defaultValue={reportes.filters.fechaHasta}
                placeholder="Hasta"
              />
            </div>
            <div>
              <Label htmlFor="salon">Salon</Label>
              <Select
                name="salon"
                defaultValue={reportes.filters.salonId ?? "all"}
              >
                <SelectTrigger id="salon">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {reportes.options.salones.map((salon) => (
                    <SelectItem key={salon.id} value={salon.id}>
                      {salon.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isAdmin ? (
              <div>
                <Label htmlFor="vendedor">Vendedor</Label>
                <Select
                  name="vendedor"
                  defaultValue={reportes.filters.vendedorId ?? "all"}
                >
                  <SelectTrigger id="vendedor">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {reportes.options.vendedores.map((vendedor) => (
                      <SelectItem key={vendedor.id} value={vendedor.id}>
                        {vendedor.full_name || vendedor.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Select
                name="estado"
                defaultValue={reportes.filters.estado ?? "all"}
              >
                <SelectTrigger id="estado">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {reportes.options.estados.map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {getEstadoLabel(estado)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className={buttonVariants({ variant: "primary" })}
              >
                Aplicar
              </button>
              <Link
                href="/reportes"
                className={buttonVariants({ variant: "secondary" })}
              >
                Limpiar
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <dl className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Eventos"
          value={formatNumber(reportes.metrics.eventosTotal)}
          helper="Cantidad total del periodo"
        />
        <SummaryCard
          label="Ingresos registrados"
          value={formatCurrency(reportes.metrics.totalIngresos)}
          helper="Pagos activos en pesos"
        />
        <SummaryCard
          label="Egresos registrados"
          value={formatCurrency(reportes.metrics.totalEgresos)}
          helper="Egresos activos en pesos"
        />
        <SummaryCard
          label="Balance simple"
          value={formatCurrency(reportes.metrics.balanceSimple)}
          helper="Ingresos menos egresos"
          valueClassName={
            reportes.metrics.balanceSimple < 0 ? "text-red-700" : "text-emerald-700"
          }
        />
        <SummaryCard
          label="Estimado vendido"
          value={formatCurrency(reportes.metrics.totalEstimadoVendido)}
          helper="Catering y servicios del periodo"
        />
        <SummaryCard
          label="Saldo pendiente"
          value={formatCurrency(reportes.metrics.saldoPendiente)}
          helper="Saldos estimados de eventos"
          valueClassName={
            reportes.metrics.saldoPendiente > 0 ? "text-amber-700" : undefined
          }
        />
      </dl>

      <div className="grid gap-6 xl:grid-cols-2">
        <GroupTable
          title="Eventos por salon"
          description="Cantidad de eventos activos agrupados por salon."
          emptyTitle="No hay eventos por salon"
          rows={reportes.porSalon}
        />
        <GroupTable
          title="Eventos por estado"
          description="Distribucion de eventos activos por estado comercial."
          emptyTitle="No hay eventos por estado"
          rows={reportes.porEstado}
          renderLabel={(row) => (
            <Badge variant={getEstadoVariant(row.id)}>{row.label}</Badge>
          )}
        />
        {isAdmin ? (
          <GroupTable
            title="Eventos por vendedor"
            description="Cantidad de eventos activos agrupados por responsable."
            emptyTitle="No hay eventos por vendedor"
            rows={reportes.porVendedor}
          />
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>Proximos eventos con saldo pendiente</CardTitle>
            <CardDescription>
              Eventos futuros del periodo con saldo estimado mayor a cero.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportes.pendientes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Salon</TableHead>
                    {isAdmin ? <TableHead>Vendedor</TableHead> : null}
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportes.pendientes.map((evento) => (
                    <TableRow key={evento.id}>
                      <TableCell className="whitespace-nowrap text-slate-600">
                        {formatDate(evento.fechaEvento)}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/eventos/${evento.id}/flujo-dinero`}
                          className="font-medium text-slate-950 transition hover:text-teal-700"
                        >
                          {evento.cliente}
                        </Link>
                        <p className="mt-1 text-sm text-slate-500">
                          Total: {formatCurrency(evento.totalEstimado)}
                        </p>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {evento.salon}
                      </TableCell>
                      {isAdmin ? (
                        <TableCell className="text-slate-600">
                          {evento.vendedor}
                        </TableCell>
                      ) : null}
                      <TableCell className="text-right font-medium text-amber-700">
                        {formatCurrency(evento.saldoPendiente)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                title="No hay saldos pendientes proximos"
                description="No se encontraron eventos futuros con saldo pendiente para los filtros actuales."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SummaryCard({
  helper,
  label,
  value,
  valueClassName = "text-slate-950",
}: {
  helper: string;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <Card className="transition hover:border-teal-100 hover:shadow-md hover:shadow-teal-950/5">
      <CardContent>
        <dt className="text-sm font-medium text-slate-500">{label}</dt>
        <dd className={`mt-3 text-3xl font-semibold tracking-tight ${valueClassName}`}>
          {value}
        </dd>
        <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p>
      </CardContent>
    </Card>
  );
}

function GroupTable({
  description,
  emptyTitle,
  renderLabel,
  rows,
  title,
}: {
  description: string;
  emptyTitle: string;
  renderLabel?: (row: ReportesGeneralesRow) => React.ReactNode;
  rows: ReportesGeneralesRow[];
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grupo</TableHead>
                <TableHead className="text-right">Eventos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-slate-950">
                    {renderLabel ? renderLabel(row) : row.label}
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-950">
                    {formatNumber(row.cantidad)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title={emptyTitle}
            description="No se encontraron datos para los filtros actuales."
          />
        )}
      </CardContent>
    </Card>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-AR").format(value);
}

function getEstadoLabel(estado: string) {
  const labels: Record<string, string> = {
    borrador: "Borrador",
    cancelado: "Cancelado",
    confirmado: "Confirmado",
    realizado: "Realizado",
  };

  return labels[estado] ?? estado;
}

function getEstadoVariant(estado: string) {
  if (estado === "confirmado" || estado === "realizado") {
    return "success";
  }

  if (estado === "cancelado") {
    return "danger";
  }

  return "neutral";
}
