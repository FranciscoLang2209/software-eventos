"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function UsuariosError({ reset }: { reset: () => void }) {
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Gestion de usuarios"
        description="No pudimos cargar la informacion necesaria."
      />
      <Card>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            Ocurrio un error al cargar los usuarios o sus asignaciones.
          </Alert>
          <Button type="button" variant="secondary" onClick={reset}>
            Intentar nuevamente
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
