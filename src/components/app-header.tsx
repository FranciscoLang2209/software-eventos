export function AppHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex min-h-16 flex-col justify-center gap-1 px-4 py-3 sm:px-6 lg:px-8">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Panel interno
        </p>
        <h2 className="text-base font-semibold text-slate-950">
          Administracion de eventos y finanzas
        </h2>
      </div>
    </header>
  );
}
