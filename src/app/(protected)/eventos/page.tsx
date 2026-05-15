import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listEventos } from "@/lib/eventos/queries";

export default async function EventosPage() {
  const { eventos, profile } = await listEventos();
  const isAdmin = profile.rol === "admin";

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Eventos"
        title="Gestion de eventos"
        description="Reservas, fechas, salones asociados y responsable comercial."
        actions={
          <Link
            href="/eventos/nuevo"
            className={buttonVariants({ variant: "primary" })}
          >
            Nuevo evento
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Agenda comercial</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              {eventos.length === 1
                ? "1 evento registrado"
                : `${eventos.length} eventos registrados`}
            </p>
          </div>
          <Badge variant="primary">{isAdmin ? "Admin" : "Vendedor"}</Badge>
        </CardHeader>

        {eventos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3">
                    Fecha
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Cliente
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Salon
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Tipo
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Estado
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Vendedor
                  </th>
                  <th scope="col" className="px-5 py-3 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {eventos.map((evento) => (
                  <tr key={evento.id} className="transition hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-5 py-4 align-top text-slate-600">
                      {formatDate(evento.fecha_evento)}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <p className="font-medium text-slate-950">
                        {evento.cliente_nombre}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Contrato: {formatDate(evento.fecha_contrato) ?? "-"}
                      </p>
                    </td>
                    <td className="px-5 py-4 align-top text-slate-600">
                      {evento.salones?.nombre ?? "-"}
                    </td>
                    <td className="px-5 py-4 align-top text-slate-600">
                      {evento.tipo_evento ?? "-"}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <Badge variant={getEstadoVariant(evento.estado)}>
                        {getEstadoLabel(evento.estado)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 align-top text-slate-600">
                      {evento.usuarios?.full_name ?? evento.usuarios?.email ?? "-"}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex justify-end">
                        <Link
                          href={`/eventos/${evento.id}`}
                          className={buttonVariants({
                            variant: "secondary",
                            size: "xs",
                          })}
                        >
                          Ver
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No hay eventos cargados"
            description={
              isAdmin
                ? "Crea el primer evento para empezar a ver la agenda comercial."
                : "Todavia no hay eventos en tus salones asignados."
            }
            action={
              <Link
                href="/eventos/nuevo"
                className={buttonVariants({ variant: "secondary" })}
              >
                Preparar nuevo evento
              </Link>
            }
          />
        )}
      </Card>
    </section>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function getEstadoLabel(estado: string) {
  const labels: Record<string, string> = {
    borrador: "Borrador",
    cancelado: "Cancelado",
    confirmado: "Confirmado",
    realizado: "Realizado",
  };

  return labels[estado] ?? estado;
}

function getEstadoVariant(estado: string) {
  if (estado === "confirmado" || estado === "realizado") {
    return "success";
  }

  if (estado === "cancelado") {
    return "danger";
  }

  return "neutral";
}
