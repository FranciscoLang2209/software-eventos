import Link from "next/link";
import { saveUsuarioSalonAssignmentsAction } from "@/app/(protected)/salones/asignaciones/actions";
import { SalonAssignmentsForm } from "@/components/salones/salon-assignments-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getSalonAssignmentsPageData } from "@/lib/salones/queries";

export default async function SalonAssignmentsPage() {
  const { vendedores, salones, assignments } =
    await getSalonAssignmentsPageData();
  const assignmentsByUsuario = groupAssignmentsByUsuario(assignments);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Salones"
        title="Asignacion de salones"
        description="Define que salones puede consultar y usar cada vendedor en la operacion comercial."
        actions={
          <Link
            href="/salones"
            className={buttonVariants({ variant: "secondary" })}
          >
            Volver a salones
          </Link>
        }
      />

      {vendedores.length > 0 ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendedores activos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-600">
                Cada formulario reemplaza el set completo de salones del
                vendedor. Si no queda ningun salon seleccionado, sus
                asignaciones se eliminan.
              </p>
            </CardContent>
          </Card>

          {vendedores.map((vendedor) => (
            <SalonAssignmentsForm
              key={vendedor.id}
              action={saveUsuarioSalonAssignmentsAction}
              assignedSalonIds={assignmentsByUsuario.get(vendedor.id) ?? []}
              salones={salones}
              vendedor={vendedor}
            />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="No hay vendedores activos"
            description="Cuando existan usuarios vendedores activos, vas a poder asignarles salones desde esta pantalla."
          />
        </Card>
      )}
    </section>
  );
}

function groupAssignmentsByUsuario(
  assignments: Array<{ usuario_id: string; salon_id: string }>,
) {
  const assignmentsByUsuario = new Map<string, string[]>();

  for (const assignment of assignments) {
    const currentAssignments =
      assignmentsByUsuario.get(assignment.usuario_id) ?? [];

    currentAssignments.push(assignment.salon_id);
    assignmentsByUsuario.set(assignment.usuario_id, currentAssignments);
  }

  return assignmentsByUsuario;
}
