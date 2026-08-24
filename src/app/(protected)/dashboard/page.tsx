import { EventCalendar } from "@/components/dashboard/event-calendar";
import { PageHeader } from "@/components/ui/page-header";
import { getDashboardCalendarData } from "@/lib/eventos/queries";

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = searchParams ? await searchParams : {};
  const monthParam = typeof params.month === "string" ? params.month : undefined;
  const { year, monthIndex, eventos, salones } =
    await getDashboardCalendarData(monthParam);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Calendario de eventos"
        description="Vista mensual de los eventos cargados, agrupados por fecha y salon asignado."
      />

      <EventCalendar
        year={year}
        monthIndex={monthIndex}
        todayISO={new Date().toISOString().slice(0, 10)}
        eventos={eventos}
        salones={salones}
      />
    </section>
  );
}
