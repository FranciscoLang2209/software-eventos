import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  Landmark,
  Store,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const quickLinks = [
  {
    description: "Resumen operativo y actividad reciente.",
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    description: "Agenda comercial y detalle de reservas.",
    href: "/eventos",
    icon: CalendarDays,
    label: "Eventos",
  },
  {
    description: "Unidades operativas y disponibilidad.",
    href: "/salones",
    icon: Store,
    label: "Salones",
  },
  {
    description: "Cobros, saldos y deudores.",
    href: "/pagos",
    icon: Landmark,
    label: "Pagos",
  },
  {
    description: "Lecturas financieras y rendimiento.",
    href: "/reportes",
    icon: BarChart3,
    label: "Reportes",
  },
];

export default function Home() {
  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-950/5">
        <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
              Software Eventos
            </p>
            <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Plataforma operativa para eventos, salones, pagos y reportes.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              Un panel interno claro para administrar el ciclo comercial y
              financiero del negocio desde una base visual ordenada.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className={buttonVariants({ variant: "primary" })}
              >
                Ir al dashboard
              </Link>
              <Link
                href="/eventos"
                className={buttonVariants({ variant: "outline" })}
              >
                Ver eventos
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-emerald-50 p-5">
            <p className="text-sm font-semibold text-teal-900">
              Operacion diaria
            </p>
            <div className="mt-4 grid gap-3">
              {["Eventos", "Salones", "Pagos", "Reportes"].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/80 bg-white/70 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm shadow-teal-950/5"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {quickLinks.map((item) => (
          <QuickLinkCard key={item.href} {...item} />
        ))}
      </div>
    </section>
  );
}

function QuickLinkCard({
  description,
  href,
  icon: Icon,
  label,
}: {
  description: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md hover:shadow-teal-950/5">
        <CardContent>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition group-hover:bg-teal-100">
            <Icon aria-hidden="true" className="size-4" />
          </span>
          <p className="mt-4 font-semibold text-slate-950">{label}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
