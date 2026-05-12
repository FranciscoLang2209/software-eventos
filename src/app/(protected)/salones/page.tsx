import Link from "next/link";
import { deactivateSalonAction } from "@/app/(protected)/salones/actions";
import { DeactivateSalonForm } from "@/components/salones/deactivate-salon-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listSalones } from "@/lib/salones/queries";
import { cn } from "@/utils/cn";

type SalonesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SalonesPage({
  searchParams,
}: SalonesPageProps) {
  const { profile, salones } = await listSalones();
  const params = searchParams ? await searchParams : {};
  const statusMessage = getStatusMessage(params);
  const isAdmin = profile.rol === "admin";

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Salones"
        title={isAdmin ? "Administracion de salones" : "Mis salones"}
        description={
          isAdmin
            ? "Crea, edita, desactiva y asigna salones disponibles para la operacion de eventos."
            : "Consulta los salones activos asignados a tu usuario vendedor."
        }
        actions={
          isAdmin ? (
            <>
              <Link
                href="/salones/asignaciones"
                className={buttonVariants({ variant: "secondary" })}
              >
                Asignaciones
              </Link>
              <Link
                href="/salones/nuevo"
                className={buttonVariants({ variant: "primary" })}
              >
                Nuevo salon
              </Link>
            </>
          ) : null
        }
      />

      {statusMessage ? (
        <div
          role="status"
          className={cn(
            "rounded-md border px-4 py-3 text-sm font-medium",
            statusMessage.kind === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700",
          )}
        >
          {statusMessage.text}
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Listado de salones</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              {salones.length === 1
                ? "1 salon registrado"
                : `${salones.length} salones registrados`}
            </p>
          </div>
          <Badge variant="primary">{isAdmin ? "Admin" : "Vendedor"}</Badge>
        </CardHeader>

        {salones.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3">
                    Nombre
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Direccion
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Capacidad
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Estado
                  </th>
                  {isAdmin ? (
                    <th scope="col" className="px-5 py-3 text-right">
                      Acciones
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {salones.map((salon) => (
                  <tr key={salon.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4 align-top">
                      <p className="font-medium text-slate-950">
                        {salon.nombre}
                      </p>
                      {salon.descripcion ? (
                        <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                          {salon.descripcion}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-slate-400">
                          Sin descripcion
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 align-top text-slate-600">
                      {salon.direccion ?? "-"}
                    </td>
                    <td className="px-5 py-4 align-top text-slate-600">
                      {salon.capacidad !== null
                        ? `${salon.capacidad} personas`
                        : "-"}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <Badge variant={salon.activo ? "success" : "inactive"}>
                        {salon.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    {isAdmin ? (
                      <td className="px-5 py-4 align-top">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/salones/${salon.id}/editar`}
                            className={buttonVariants({
                              variant: "secondary",
                              size: "xs",
                            })}
                          >
                            Editar
                          </Link>
                          <DeactivateSalonForm
                            id={salon.id}
                            disabled={!salon.activo}
                            action={deactivateSalonAction}
                          />
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No hay salones cargados"
            description={
              isAdmin
                ? "Crea el primer salon para empezar a administrar unidades de negocio y asociarlas a eventos."
                : "Todavia no tenes salones activos asignados."
            }
            action={
              isAdmin ? (
                <Link
                  href="/salones/nuevo"
                  className={buttonVariants({ variant: "primary" })}
                >
                  Nuevo salon
                </Link>
              ) : null
            }
          />
        )}
      </Card>
    </section>
  );
}

function getStatusMessage(
  params: Record<string, string | string[] | undefined>,
) {
  if (params.created) {
    return { kind: "success", text: "Salon creado correctamente." };
  }

  if (params.updated) {
    return { kind: "success", text: "Salon actualizado correctamente." };
  }

  if (params.deactivated) {
    return { kind: "success", text: "Salon desactivado correctamente." };
  }

  if (params.error) {
    return {
      kind: "error",
      text: "No se pudo completar la accion. Intenta nuevamente.",
    };
  }

  return null;
}
