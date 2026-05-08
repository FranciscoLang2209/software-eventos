import { SalonForm } from "@/components/salones/salon-form";
import { createSalonAction } from "@/app/(protected)/salones/actions";
import { requireAdmin } from "@/lib/auth";
import { emptySalonFormState } from "@/lib/salones/validation";

export default async function NuevoSalonPage() {
  await requireAdmin();

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Salones
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Nuevo salon
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Carga los datos basicos del salon para habilitarlo en la operacion.
        </p>
      </div>

      <SalonForm
        action={createSalonAction}
        initialState={emptySalonFormState}
        submitLabel="Crear salon"
        pendingLabel="Creando..."
      />
    </section>
  );
}
