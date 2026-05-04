type EventoDetallePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EventoDetallePage({
  params,
}: EventoDetallePageProps) {
  const { id } = await params;

  return (
    <section className="mx-auto max-w-4xl">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Evento
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Detalle del evento
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Vista futura para consultar agenda, salon, pagos, saldo, historial y
          auditoria del evento.
        </p>
        <p className="mt-5 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
          ID solicitado: <span className="font-mono text-slate-950">{id}</span>
        </p>
      </div>
    </section>
  );
}
