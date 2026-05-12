import { notFound } from "next/navigation";
import { updateSalonAction } from "@/app/(protected)/salones/actions";
import { SalonForm } from "@/components/salones/salon-form";
import { PageHeader } from "@/components/ui/page-header";
import { getSalonById } from "@/lib/salones/queries";
import type { SalonFormState } from "@/lib/salones/validation";

type EditarSalonPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarSalonPage({
  params,
}: EditarSalonPageProps) {
  const { id } = await params;
  const salon = await getSalonById(id);

  if (!salon) {
    notFound();
  }

  const initialState: SalonFormState = {
    fields: {
      nombre: salon.nombre,
      descripcion: salon.descripcion ?? "",
      direccion: salon.direccion ?? "",
      capacidad: salon.capacidad?.toString() ?? "",
      activo: salon.activo,
    },
    errors: {},
    formError: null,
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Salones"
        title="Editar salon"
        description={`Actualiza los datos administrativos de ${salon.nombre}.`}
      />

      <SalonForm
        action={updateSalonAction.bind(null, salon.id)}
        initialState={initialState}
        submitLabel="Guardar cambios"
        pendingLabel="Guardando..."
      />
    </section>
  );
}
