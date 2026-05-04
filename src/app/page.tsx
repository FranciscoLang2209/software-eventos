import Link from "next/link";

export default function Home() {
  return (
    <section className="mx-auto max-w-5xl">
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Software Eventos
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Plataforma operativa para eventos, salones, pagos y reportes.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Este inicio deja preparada la base tecnica para administrar el ciclo
          comercial y financiero del negocio sin definir todavia reglas de
          negocio finales.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Ir al dashboard
          </Link>
          <Link
            href="/eventos"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Ver eventos
          </Link>
        </div>
      </div>
    </section>
  );
}
