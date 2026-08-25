"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function SalonesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Salones"
        title="No pudimos cargar los salones"
        description="La informacion no esta disponible en este momento. Intenta nuevamente."
      />
      <Card className="max-w-2xl border-red-100 bg-red-50/80">
        <CardContent>
          <Alert
            variant="destructive"
            className="border-transparent bg-transparent p-0"
          >
            No se pudo cargar la administracion de salones.
          </Alert>
          <Button onClick={reset} className="mt-4">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
