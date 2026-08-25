import {
  createEgresoAction,
  deleteEgresoAction,
} from "@/app/(protected)/egresos/actions";
import { DeleteEgresoForm } from "@/components/egresos/delete-egreso-form";
import { EgresoForm } from "@/components/egresos/egreso-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getEmptyEgresoFormState } from "@/lib/egresos/validation";
import type { EventoEgresos } from "@/lib/egresos/queries";
import type { EventoServicioPagoOption } from "@/lib/evento-servicios/queries";

type EgresosEventoSectionProps = {
  egresos: EventoEgresos;
  eventoId: string;
  servicios: EventoServicioPagoOption[];
};

export function EgresosEventoSection({
  egresos,
  eventoId,
  servicios,
}: EgresosEventoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Egresos</CardTitle>
        <CardDescription>
          Gastos asociados a este evento para seguir el costo operativo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <dl className="grid gap-4 md:grid-cols-2">
          <SummaryItem
            label="Total egresos"
            value={formatCurrency(egresos.totalEgresos)}
          />
          <SummaryItem
            label="Egresos registrados"
            value={formatNumber(egresos.cantidadEgresos)}
          />
        </dl>

        <div className="rounded-lg border border-slate-100">
          {egresos.egresos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {egresos.egresos.map((egreso) => (
                  <TableRow key={egreso.id}>
                    <TableCell>{formatDate(egreso.fecha_egreso)}</TableCell>
                    <TableCell className="font-medium text-slate-950">
                      {egreso.categoria}
                    </TableCell>
                    <TableCell>{egreso.concepto}</TableCell>
                    <TableCell>{egreso.proveedor ?? "-"}</TableCell>
                    <TableCell>
                      {egreso.evento_servicios?.servicios_catalogo?.nombre ??
                        "-"}
                    </TableCell>
                    <TableCell>{getFormaPagoLabel(egreso.forma_pago)}</TableCell>
                    <TableCell className="text-right font-medium text-slate-950">
                      {formatCurrency(
                        egreso.importe_en_pesos ??
                          egreso.importe_moneda_original,
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs text-slate-500">
                      {egreso.notas ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteEgresoForm
                        action={deleteEgresoAction.bind(
                          null,
                          eventoId,
                          egreso.id,
                        )}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No hay egresos registrados"
              description="Registra el primer gasto para conocer el costo del evento."
            />
          )}
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-950">
            Registrar nuevo egreso
          </h3>
          <div className="mt-4">
            <EgresoForm
              action={createEgresoAction.bind(null, eventoId)}
              initialState={getEmptyEgresoFormState()}
              servicios={servicios}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-AR").format(value);
}

function getFormaPagoLabel(value: string | null) {
  if (!value) {
    return "-";
  }

  const labels: Record<string, string> = {
    cheque: "Cheque",
    efectivo_pesos: "Efectivo pesos",
    efectivo_dolares: "Efectivo dolares",
    efectivo_euros: "Efectivo euros",
    retenciones: "Retenciones",
    transferencia: "Transferencia",
  };

  return labels[value] ?? value;
}
