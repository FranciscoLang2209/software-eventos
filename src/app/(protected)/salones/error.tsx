"use client";

export default function SalonesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="space-y-4">
      <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
        Salones
      </p>
      <div
        role="alert"
        className="max-w-2xl rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700"
      >
        No se pudo cargar la administracion de salones.
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        Reintentar
      </button>
    </section>
  );
}
