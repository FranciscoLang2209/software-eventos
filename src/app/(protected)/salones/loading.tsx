import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SalonesLoading() {
  return (
    <section className="space-y-6">
      <div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-9 w-64" />
        <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
      </div>
      <Card>
        <CardContent>
          <Skeleton className="h-6 w-40" />
          <div className="mt-6 space-y-3">
            <Skeleton className="h-10 bg-slate-100/80" />
            <Skeleton className="h-10 bg-slate-100/80" />
            <Skeleton className="h-10 bg-slate-100/80" />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
