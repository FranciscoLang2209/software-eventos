import { notFound } from "next/navigation";
import { SalonForm } from "@/components/salones/salon-form";
import { updateSalonAction } from "@/app/(protected)/salones/actions";
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
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Salones
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Editar salon
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Actualiza los datos administrativos de {salon.nombre}.
        </p>
      </div>

      <SalonForm
        action={updateSalonAction.bind(null, salon.id)}
        initialState={initialState}
        submitLabel="Guardar cambios"
        pendingLabel="Guardando..."
      />
    </section>
  );
}
