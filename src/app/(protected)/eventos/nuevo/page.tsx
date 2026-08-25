import { createEventoAction } from "@/app/(protected)/eventos/actions";
import { EventoForm } from "@/components/eventos/evento-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";
import { emptyEventoFormState } from "@/lib/eventos/validation";
import { getNuevoEventoPageData } from "@/lib/eventos/queries";
import Link from "next/link";

export default async function NuevoEventoPage() {
  const { assignments, profile, salones, vendedores } =
    await getNuevoEventoPageData();
  const isAdmin = profile.rol === "admin";
  const canCreate = salones.length > 0 && (!isAdmin || vendedores.length > 0);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Eventos"
        title="Nuevo evento"
        description="Carga el detalle comercial inicial del evento y vincula salon, vendedor responsable y cliente."
      />

      {canCreate ? (
        <EventoForm
          action={createEventoAction}
          assignments={assignments}
          initialState={emptyEventoFormState}
          isAdmin={isAdmin}
          mode="create"
          salones={salones}
          vendedores={vendedores}
        />
      ) : (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>No hay datos disponibles para crear eventos</CardTitle>
            <CardDescription>
              Falta informacion operativa necesaria para completar el alta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">
              {salones.length === 0
                ? "Necesitas al menos un salon activo asignado o disponible antes de cargar eventos."
                : "Necesitas al menos un vendedor activo para asignar como responsable comercial."}
            </p>
            <Link
              href="/eventos"
              className={buttonVariants({ variant: "secondary" })}
            >
              Volver a eventos
            </Link>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
