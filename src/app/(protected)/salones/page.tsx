import Link from "next/link";
import { DeactivateSalonForm } from "@/components/salones/deactivate-salon-form";
import { deactivateSalonAction } from "@/app/(protected)/salones/actions";
import { listSalones } from "@/lib/salones/queries";

type SalonesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SalonesPage({
  searchParams,
}: SalonesPageProps) {
  const salones = await listSalones();
  const params = searchParams ? await searchParams : {};
  const statusMessage = getStatusMessage(params);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Salones
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Administracion de salones
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Crea, edita y desactiva los salones disponibles para la operacion
            de eventos.
          </p>
        </div>
        <Link
          href="/salones/nuevo"
          className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Nuevo salon
        </Link>
      </div>

      {statusMessage ? (
        <div
          role="status"
          className={statusMessage.kind === "error" ? errorClass : successClass}
        >
          {statusMessage.text}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">
            Listado de salones
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {salones.length === 1
              ? "1 salon registrado"
              : `${salones.length} salones registrados`}
          </p>
        </div>

        {salones.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                  <th scope="col" className="px-5 py-3 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {salones.map((salon) => (
                  <tr key={salon.id}>
                    <td className="px-5 py-4 align-top">
                      <p className="font-medium text-slate-950">
                        {salon.nombre}
                      </p>
                      {salon.descripcion ? (
                        <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                          {salon.descripcion}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 align-top text-slate-600">
                      {salon.direccion ?? "-"}
                    </td>
                    <td className="px-5 py-4 align-top text-slate-600">
                      {salon.capacidad ?? "-"}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span
                        className={
                          salon.activo
                            ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                            : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
                        }
                      >
                        {salon.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/salones/${salon.id}/editar`}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <h2 className="text-base font-semibold text-slate-950">
              No hay salones cargados
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Crea el primer salon para empezar a administrar unidades de
              negocio.
            </p>
            <Link
              href="/salones/nuevo"
              className="mt-5 inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Nuevo salon
            </Link>
          </div>
        )}
      </div>
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

const successClass =
  "rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700";
const errorClass =
  "rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700";
