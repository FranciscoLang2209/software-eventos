import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <section className="mx-auto max-w-5xl">
      <Card>
        <CardContent className="p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
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
              className={buttonVariants({ variant: "primary" })}
            >
              Ir al dashboard
            </Link>
            <Link
              href="/eventos"
              className={buttonVariants({ variant: "secondary" })}
            >
              Ver eventos
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
