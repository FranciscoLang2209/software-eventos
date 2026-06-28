import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportesLoading() {
  return (
    <section className="space-y-6">
      <div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-9 w-72" />
        <Skeleton className="mt-4 h-5 w-full max-w-3xl" />
      </div>
      <Card>
        <CardContent>
          <Skeleton className="h-6 w-32" />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index}>
            <CardContent>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-4 h-8 w-40" />
              <Skeleton className="mt-3 h-4 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardContent>
            <Skeleton className="h-6 w-48" />
            <div className="mt-6 space-y-3">
              <Skeleton className="h-10 bg-slate-100/80" />
              <Skeleton className="h-10 bg-slate-100/80" />
              <Skeleton className="h-10 bg-slate-100/80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Skeleton className="h-6 w-48" />
            <div className="mt-6 space-y-3">
              <Skeleton className="h-10 bg-slate-100/80" />
              <Skeleton className="h-10 bg-slate-100/80" />
              <Skeleton className="h-10 bg-slate-100/80" />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
