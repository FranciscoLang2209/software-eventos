import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function NuevoEventoPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Eventos"
        title="Nuevo evento"
        description="Formulario reservado para cargar reservas, salon, cliente, catering, vendedor asignado y condiciones de pago."
      />
      <Card>
        <CardContent>
          <p className="text-sm leading-6 text-slate-600">
            Esta pantalla queda preparada para un formulario ordenado por
            cliente, reserva, salon, catering, vendedor y condiciones de pago.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
