import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

const metrics = [
  {
    label: "Eventos activos",
    value: "--",
    detail: "Pendiente de conectar a datos reales",
  },
  {
    label: "Pagos registrados",
    value: "--",
    detail: "Cobros e imputaciones futuras",
  },
  {
    label: "Saldos pendientes",
    value: "--",
    detail: "Lectura financiera en roadmap",
  },
];

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Resumen operativo"
        description="Vista inicial para indicadores de eventos, pagos, saldos pendientes y actividad reciente."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <Card
            key={metric.label}
            className="transition hover:border-teal-100 hover:shadow-md hover:shadow-teal-950/5"
          >
            <CardContent>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">
                  {metric.label}
                </p>
                <Badge variant="neutral">Proximo</Badge>
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                {metric.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {metric.detail}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              La actividad se mostrara cuando los modulos operativos registren
              movimientos.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Este espacio queda preparado para eventos, pagos y auditoria.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
