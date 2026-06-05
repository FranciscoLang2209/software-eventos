import Link from "next/link";
import { importPreciosServiciosAction } from "@/app/(protected)/admin/precios-servicios/actions";
import { PreciosServiciosImportForm } from "@/components/precios-servicios/precios-servicios-import-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database.types";

type PrecioMensualRow = {
  created_at: string;
  id: string;
  iva_porcentaje: number;
  moneda: Enums<"moneda">;
  periodo: string;
  precio_base: number;
  salones: {
    nombre: string;
  } | null;
  servicios_catalogo: {
    nombre: string;
  } | null;
};

export default async function AdminPreciosServiciosPage() {
  await requireAdmin();
  const precios = await getRecentPreciosMensuales();

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Precios mensuales de servicios"
        description="Carga mensual para autocompletar valores de Salon, Tecnica Pack, Ambientacion Pack y Foto y Video Pack."
        actions={
          <Link href="/admin" className={buttonVariants({ variant: "secondary" })}>
            Volver a admin
          </Link>
        }
      />

      <Card>
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Carga mensual</CardTitle>
          <CardDescription>
            Importa una planilla Excel y valida el formato antes de persistir
            precios globales o por salon.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8 lg:grid-cols-[minmax(280px,0.78fr)_minmax(0,1.22fr)]">
          <div className="lg:border-r lg:border-slate-100 lg:pr-8">
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-slate-950">
                Importar planilla
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                La carga actualiza precios existentes para la misma combinacion
                de servicio, salon y periodo.
              </p>
            </div>
            <PreciosServiciosImportForm action={importPreciosServiciosAction} />
          </div>

          <div className="space-y-4 text-sm text-slate-600">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Formato esperado
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Usar la primera hoja del Excel con encabezados en la fila 1.
              </p>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-100">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>mes</TableHead>
                    <TableHead>año</TableHead>
                    <TableHead>salon</TableHead>
                    <TableHead>servicio</TableHead>
                    <TableHead>precio_base</TableHead>
                    <TableHead>iva_porcentaje</TableHead>
                    <TableHead>moneda</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>6</TableCell>
                    <TableCell>2026</TableCell>
                    <TableCell>Salon Central</TableCell>
                    <TableCell>Salon</TableCell>
                    <TableCell>1200000</TableCell>
                    <TableCell>21</TableCell>
                    <TableCell>ARS</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>6</TableCell>
                    <TableCell>2026</TableCell>
                    <TableCell />
                    <TableCell>Tecnica Pack</TableCell>
                    <TableCell>350000</TableCell>
                    <TableCell>21</TableCell>
                    <TableCell>ARS</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Obligatorio
                </p>
                <p className="mt-1 leading-6">
                  mes, año, servicio y precio_base. Para Salon, tambien salon.
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Opcional
                </p>
                <p className="mt-1 leading-6">
                  salon en packs, moneda e IVA. Moneda default ARS e IVA default
                  0.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ultimos precios cargados</CardTitle>
          <CardDescription>
            Registros persistidos en Supabase despues de importar planillas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-slate-100">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Salon</TableHead>
                  <TableHead className="text-right">Precio base</TableHead>
                  <TableHead className="text-right">IVA</TableHead>
                  <TableHead>Moneda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {precios.length > 0 ? (
                  precios.map((precio) => (
                    <TableRow key={precio.id}>
                      <TableCell>{formatPeriod(precio.periodo)}</TableCell>
                      <TableCell>
                        {precio.servicios_catalogo?.nombre ?? "-"}
                      </TableCell>
                      <TableCell>{precio.salones?.nombre ?? "Global"}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(precio.precio_base, precio.moneda)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercentage(precio.iva_porcentaje)}
                      </TableCell>
                      <TableCell>{precio.moneda}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                      Todavia no hay precios mensuales cargados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

async function getRecentPreciosMensuales() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("servicio_precios_mensuales")
    .select(
      "id, periodo, precio_base, iva_porcentaje, moneda, created_at, salones(nombre), servicios_catalogo(nombre)",
    )
    .order("periodo", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return [];
  }

  return data as PrecioMensualRow[];
}

function formatPeriod(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    month: "2-digit",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatCurrency(value: number, moneda: Enums<"moneda">) {
  return new Intl.NumberFormat("es-AR", {
    currency: moneda,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function formatPercentage(value: number) {
  return `${new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
  }).format(value)}%`;
}
