import Link from "next/link";
import { CateringDetalleNav } from "@/components/catering/catering-detalle-nav";
import { CateringEgresosSection } from "@/components/catering/catering-egresos-section";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getCateringById, getCateringDisplayFields } from "@/lib/catering/queries";
import { getCateringEgresos } from "@/lib/catering/egresos-queries";

type CateringEgresosPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CateringEgresosPage({
  params,
}: CateringEgresosPageProps) {
  const { id } = await params;
  const { catering } = await getCateringById(id);
  const display = getCateringDisplayFields(catering);
  const egresos = await getCateringEgresos(catering.id);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Egresos"
        title={display.clienteNombre}
        description="Gastos asociados a este catering y carga de nuevos egresos."
        actions={
          <>
            <Link
              href={`/catering/${catering.id}`}
              className={buttonVariants({ variant: "secondary" })}
            >
              Volver al detalle
            </Link>
            <Link href="/catering" className={buttonVariants({ variant: "secondary" })}>
              Volver a catering
            </Link>
          </>
        }
      />

      <CateringDetalleNav active="egresos" cateringId={catering.id} />

      <CateringEgresosSection cateringId={catering.id} egresos={egresos} />
    </section>
  );
}
