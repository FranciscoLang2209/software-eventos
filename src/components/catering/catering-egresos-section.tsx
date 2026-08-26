import {
  createCateringEgresoAction,
  deleteCateringEgresoAction,
} from "@/app/(protected)/catering/actions";
import { CateringEgresoForm } from "@/components/catering/catering-egreso-form";
import { DeleteCateringEgresoForm } from "@/components/catering/delete-catering-egreso-form";
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
import type { CateringEgresos } from "@/lib/catering/egresos-queries";
import { getEmptyEgresoFormState } from "@/lib/egresos/validation";

type CateringEgresosSectionProps = {
  cateringId: string;
  egresos: CateringEgresos;
};

export function CateringEgresosSection({
  cateringId,
  egresos,
}: CateringEgresosSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle>Egresos</CardTitle>
          <CardDescription>Gastos asociados a este catering.</CardDescription>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Total egresos
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-950">
            {formatCurrency(egresos.totalEgresos)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="rounded-lg border border-slate-100">
          {egresos.egresos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {egresos.egresos.map((egreso) => (
                  <TableRow key={egreso.id}>
                    <TableCell>{formatDate(egreso.fecha_egreso)}</TableCell>
                    <TableCell className="text-slate-600">{egreso.categoria}</TableCell>
                    <TableCell className="font-medium text-slate-950">
                      {egreso.concepto}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {egreso.proveedor ?? "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-950">
                      {formatCurrency(
                        egreso.importe_en_pesos ?? egreso.importe_moneda_original,
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteCateringEgresoForm
                        action={deleteCateringEgresoAction.bind(null, cateringId, egreso.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No hay egresos registrados"
              description="Registra el primer gasto para este catering."
            />
          )}
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-950">Registrar nuevo egreso</h3>
          <div className="mt-4">
            <CateringEgresoForm
              action={createCateringEgresoAction.bind(null, cateringId)}
              initialState={getEmptyEgresoFormState()}
            />
          </div>
        </div>
      </CardContent>
    </Card>
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
