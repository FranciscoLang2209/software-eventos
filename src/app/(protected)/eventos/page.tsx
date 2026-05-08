import Link from "next/link";

export default function EventosPage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Eventos
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Gestion de eventos
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Listado futuro para reservas, fechas, salones asociados, estado de
            cobro y responsable comercial.
          </p>
        </div>
        <Link
          href="/eventos/nuevo"
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Nuevo evento
        </Link>
      </div>
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
        La tabla de eventos se agregara cuando el esquema de datos este validado.
      </div>
    </section>
  );
}
