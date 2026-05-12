export default function SalonAssignmentsLoading() {
  return (
    <section className="space-y-6">
      <div>
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-9 w-80 max-w-full animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-5 w-full max-w-2xl animate-pulse rounded bg-slate-200" />
      </div>
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-5 w-full max-w-3xl animate-pulse rounded bg-slate-100" />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
          <div className="h-6 w-56 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="h-20 animate-pulse rounded bg-slate-100" />
            <div className="h-20 animate-pulse rounded bg-slate-100" />
            <div className="h-20 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>
    </section>
  );
}
