import Link from "next/link";
import { createUsuarioAction } from "@/app/(protected)/admin/usuarios/actions";
import { UsuarioForm } from "@/components/usuarios/usuario-form";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getUsuarioCreatePageData } from "@/lib/usuarios/queries";
import { emptyUsuarioFormState } from "@/lib/usuarios/validation";

export default async function NuevoUsuarioPage() {
  const { salones } = await getUsuarioCreatePageData();

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin / Usuarios"
        title="Nuevo usuario"
        description="Crea el acceso en Supabase Auth, el perfil de aplicacion y sus asignaciones iniciales."
        actions={
          <Link
            href="/admin/usuarios"
            className={buttonVariants({ variant: "secondary" })}
          >
            Volver al listado
          </Link>
        }
      />
      <UsuarioForm
        action={createUsuarioAction}
        initialState={emptyUsuarioFormState}
        mode="create"
        salones={salones}
      />
    </section>
  );
}
