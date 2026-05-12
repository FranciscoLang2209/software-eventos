export default function SalonesLoading() {
  return (
    <section className="space-y-6">
      <div>
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-9 w-64 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-5 w-full max-w-2xl animate-pulse rounded bg-slate-200" />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 space-y-3">
          <div className="h-10 animate-pulse rounded bg-slate-100" />
          <div className="h-10 animate-pulse rounded bg-slate-100" />
          <div className="h-10 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    </section>
  );
}
