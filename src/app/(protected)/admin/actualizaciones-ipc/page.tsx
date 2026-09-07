import Link from "next/link";
import {
  applyIpcAction,
  previewIpcAction,
} from "@/app/(protected)/admin/actualizaciones-ipc/actions";
import { IpcApplicationForm } from "@/components/ipc/ipc-application-form";
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
import { getEmptyIpcFormState } from "@/lib/ipc/validation";
import { createClient } from "@/lib/supabase/server";

type IpcIndexRow = {
  actualizaciones_ipc: { count: number }[] | null;
  created_at: string;
  id: string;
  periodo: string;
  usuarios: { full_name: string | null } | null;
  variacion_porcentual: number;
};

export default async function ActualizacionesIpcPage() {
  await requireAdmin();
  const indices = await getRecentIpcIndices();

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Actualización por IPC"
        description="Actualiza precios base de servicios impagos en eventos confirmados y vigentes."
        actions={
          <Link href="/admin" className={buttonVariants({ variant: "secondary" })}>
            Volver a admin
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Nuevo IPC mensual</CardTitle>
          <CardDescription>
            Antes de confirmar se calcula el alcance actual. Si se registra un
            pago entre la previsualización y la aplicación, el proceso vuelve a
            validar la elegibilidad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IpcApplicationForm
            applyAction={applyIpcAction}
            emptyState={getEmptyIpcFormState()}
            previewAction={previewIpcAction}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>IPCs aplicados</CardTitle>
          <CardDescription>
            Cada período puede registrarse una sola vez y queda vinculado a los
            servicios que modificó.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-slate-100">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Variación</TableHead>
                  <TableHead className="text-right">Servicios</TableHead>
                  <TableHead>Aplicado por</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {indices.length > 0 ? (
                  indices.map((index) => (
                    <TableRow key={index.id}>
                      <TableCell>{formatPeriod(index.periodo)}</TableCell>
                      <TableCell className="text-right">
                        {formatPercentage(index.variacion_porcentual)}
                      </TableCell>
                      <TableCell className="text-right">
                        {index.actualizaciones_ipc?.[0]?.count ?? 0}
                      </TableCell>
                      <TableCell>{index.usuarios?.full_name ?? "-"}</TableCell>
                      <TableCell>{formatDate(index.created_at)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                      Todavía no hay IPCs aplicados.
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

async function getRecentIpcIndices(): Promise<IpcIndexRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ipc_indices")
    .select(
      "id, periodo, variacion_porcentual, created_at, usuarios(full_name), actualizaciones_ipc(count)",
    )
    .order("periodo", { ascending: false })
    .limit(30);

  if (error) return [];

  return (data ?? []) as unknown as IpcIndexRow[];
}

function formatPeriod(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatPercentage(value: number) {
  return `${new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 4,
  }).format(value)}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(value));
}
