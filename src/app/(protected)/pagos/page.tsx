import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function PagosPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Pagos"
        title="Pagos y saldos"
        description="Espacio reservado para registrar cobros, imputarlos a eventos, revisar balances y detectar deudores."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {["Cobros", "Saldos", "Deudores"].map((item) => (
          <Card key={item}>
            <CardContent>
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-950">{item}</p>
                <Badge variant="neutral">Proximo</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Lectura financiera disponible cuando el modulo este conectado.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
