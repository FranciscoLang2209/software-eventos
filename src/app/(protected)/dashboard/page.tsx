export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Resumen operativo
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Vista inicial para indicadores de eventos, pagos, saldos pendientes y
          actividad reciente.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {["Eventos activos", "Pagos registrados", "Saldos pendientes"].map(
          (label) => (
            <div
              key={label}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">--</p>
            </div>
          ),
        )}
      </div>
    </section>
  );
}
