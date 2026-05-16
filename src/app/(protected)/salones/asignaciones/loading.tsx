import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SalonAssignmentsLoading() {
  return (
    <section className="space-y-6">
      <div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-9 w-80 max-w-full" />
        <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
      </div>
      <div className="space-y-4">
        <Card>
          <CardContent>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-4 h-5 w-full max-w-3xl bg-slate-100/80" />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Skeleton className="h-6 w-56" />
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Skeleton className="h-20 bg-slate-100/80" />
              <Skeleton className="h-20 bg-slate-100/80" />
              <Skeleton className="h-20 bg-slate-100/80" />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
