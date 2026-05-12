import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

type EventoDetallePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EventoDetallePage({
  params,
}: EventoDetallePageProps) {
  const { id } = await params;

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Evento"
        title="Detalle del evento"
        description="Vista futura para consultar agenda, salon, pagos, saldo, historial y auditoria del evento."
        actions={<Badge variant="neutral">Vista reservada</Badge>}
      />
      <Card>
        <CardContent>
          <p className="text-sm text-slate-500">ID solicitado</p>
          <p className="mt-2 rounded-md bg-slate-100 px-3 py-2 font-mono text-sm text-slate-950">
            {id}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
