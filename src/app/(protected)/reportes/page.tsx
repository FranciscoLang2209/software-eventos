import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function ReportesPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Reportes"
        title="Reportes financieros"
        description="Vista futura para reportes de ventas, cobranzas, saldos por salon, deuda pendiente y rendimiento comercial."
      />
      <Card>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Ventas", "Cobranzas", "Saldos", "Rendimiento"].map((item) => (
              <div
                key={item}
                className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <p className="text-sm font-medium text-slate-950">{item}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Pendiente de datos
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
