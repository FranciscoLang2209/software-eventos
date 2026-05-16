import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function AdminPage() {
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
            {["Usuarios y roles", "Auditoria", "Configuracion"].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 transition hover:border-teal-100 hover:bg-teal-50/50"
              >
                <p className="text-sm font-medium text-slate-950">{item}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Reservado para administradores
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
