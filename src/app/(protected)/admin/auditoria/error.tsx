"use client";

import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function AuditoriaError({ reset }: { reset: () => void }) {
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Auditoria administrativa"
        description="Consulta del historial de cambios importantes del sistema."
      />
      <Alert variant="destructive">
        <AlertTitle>No se pudo cargar el historial</AlertTitle>
        <AlertDescription>
          Ocurrio un error controlado al consultar la auditoria. Intenta nuevamente; no se expusieron detalles internos.
        </AlertDescription>
      </Alert>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className={buttonVariants({ variant: "primary" })}
        >
          Reintentar
        </button>
        <Link href="/admin" className={buttonVariants({ variant: "secondary" })}>
          Volver al panel
        </Link>
      </div>
    </section>
  );
}
