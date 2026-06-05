import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminPage() {
  await requireAdmin();

  const items = [
    {
      description: "Reservado para administradores",
      href: null,
      name: "Usuarios y roles",
    },
    {
      description: "Reservado para administradores",
      href: null,
      name: "Auditoria",
    },
    {
      description: "Importacion mensual para autocompletar eventos",
      href: "/admin/precios-servicios",
      name: "Precios de servicios",
    },
    {
      description: "Reservado para administradores",
      href: null,
      name: "Configuracion",
    },
  ];

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Administracion del sistema"
        description="Modulo reservado para usuarios, roles, auditoria, salones, permisos y configuracion general."
      />
      <Card>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {items.map((item) =>
              item.href ? (
                <Link
                  key={item.name}
                  href={item.href}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 transition hover:border-teal-100 hover:bg-teal-50/50"
                >
                  <p className="text-sm font-medium text-slate-950">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.description}
                  </p>
                </Link>
              ) : (
                <div
                  key={item.name}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 transition hover:border-teal-100 hover:bg-teal-50/50"
                >
                  <p className="text-sm font-medium text-slate-950">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.description}
                  </p>
                </div>
              ),
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
