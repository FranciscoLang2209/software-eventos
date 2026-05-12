import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function EventosPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Eventos"
        title="Gestion de eventos"
        description="Listado futuro para reservas, fechas, salones asociados, estado de cobro y responsable comercial."
        actions={
          <Link
            href="/eventos/nuevo"
            className={buttonVariants({ variant: "primary" })}
          >
            Nuevo evento
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Agenda comercial</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <EmptyState
            title="Modulo de eventos en preparacion"
            description="La tabla de eventos se agregara cuando el esquema de datos este validado. La navegacion y acciones principales ya quedan ubicadas."
            action={
              <Link
                href="/eventos/nuevo"
                className={buttonVariants({ variant: "secondary" })}
              >
                Preparar nuevo evento
              </Link>
            }
          />
        </CardContent>
      </Card>
    </section>
  );
}
