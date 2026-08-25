import Link from "next/link";
import { EgresosEventoSection } from "@/components/egresos/egresos-evento-section";
import { EventoDetalleNav } from "@/components/eventos/evento-detalle-nav";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getEventoEgresos } from "@/lib/egresos/queries";
import { getEventoById } from "@/lib/eventos/queries";
import { getEventoValores } from "@/lib/evento-servicios/queries";

type EventoEgresosPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EventoEgresosPage({
  params,
}: EventoEgresosPageProps) {
  const { id } = await params;
  const { evento } = await getEventoById(id);
  const [egresos, valores] = await Promise.all([
    getEventoEgresos(evento.id),
    getEventoValores(evento.id),
  ]);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Egresos"
        title={evento.cliente_nombre}
        description="Gastos asociados a este evento y carga de nuevos egresos."
        actions={
          <>
            <Link
              href={`/eventos/${evento.id}`}
              className={buttonVariants({ variant: "secondary" })}
            >
              Volver al detalle
            </Link>
            <Link
              href="/eventos"
              className={buttonVariants({ variant: "secondary" })}
            >
              Volver a eventos
            </Link>
          </>
        }
      />

      <EventoDetalleNav active="egresos" eventoId={evento.id} />

      <EgresosEventoSection
        egresos={egresos}
        eventoId={evento.id}
        servicios={valores.opcionesPago}
      />
    </section>
  );
}
