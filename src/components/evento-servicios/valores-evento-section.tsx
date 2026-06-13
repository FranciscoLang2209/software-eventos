import {
  createEventoServicioAction,
  deleteEventoServicioAction,
  updateEventoServicioAction,
} from "@/app/(protected)/evento-servicios/actions";
import { DeleteEventoServicioForm } from "@/components/evento-servicios/delete-evento-servicio-form";
import { EventoServicioForm } from "@/components/evento-servicios/evento-servicio-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type {
  EventoServicioMonthlyPriceSuggestions,
  EventoServicioItem,
  ServicioCatalogoOption,
} from "@/lib/evento-servicios/queries";
import { getCategoriaServicioLabel } from "@/lib/evento-servicios/queries";
import {
  getEmptyEventoServicioFormState,
  getEventoServicioFieldsFromValues,
  getEventoServicioFormState,
} from "@/lib/evento-servicios/validation";

type ValoresEventoSectionProps = {
  catalogo: ServicioCatalogoOption[];
  eventoId: string;
  monthlyPriceSuggestions: EventoServicioMonthlyPriceSuggestions;
  servicios: EventoServicioItem[];
  totalEvento: number;
};

export function ValoresEventoSection({
  catalogo,
  eventoId,
  monthlyPriceSuggestions,
  servicios,
  totalEvento,
}: ValoresEventoSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle>Valores del evento</CardTitle>
          <CardDescription>
            Servicios facturables pactados para calcular el total del evento.
          </CardDescription>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Total servicios
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-950">
            {formatCurrency(totalEvento)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="rounded-lg border border-slate-100 bg-white">
          {servicios.length > 0 ? (
            <div className="divide-y divide-slate-100">
              <div className="hidden grid-cols-[1.3fr_0.9fr_repeat(7,minmax(0,0.75fr))_auto] gap-4 bg-slate-50/80 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 xl:grid">
                <div>Servicio</div>
                <div>Proveedor</div>
                <div className="text-right">Base</div>
                <div className="text-right">Adic.</div>
                <div className="text-right">Base IVA</div>
                <div className="text-right">IVA %</div>
                <div className="text-right">Total</div>
                <div className="text-right">Pagado</div>
                <div className="text-right">Saldo</div>
                <div className="text-right">Accion</div>
              </div>
              {servicios.map((servicio) => (
                <details key={servicio.id} className="group">
                  <summary className="list-none px-5 py-5 marker:hidden">
                    <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr_repeat(7,minmax(0,0.75fr))_auto] xl:items-start">
                      <div>
                        <div className="font-medium text-slate-950">
                          {servicio.servicios_catalogo?.nombre ??
                            "Servicio sin nombre"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {servicio.servicios_catalogo?.categoria
                            ? getCategoriaServicioLabel(
                                servicio.servicios_catalogo.categoria,
                              )
                            : "-"}
                        </div>
                        {servicio.notas ? (
                          <div className="mt-2 text-sm text-slate-500">
                            {servicio.notas}
                          </div>
                        ) : null}
                      </div>
                      <ValueItem
                        label="Proveedor"
                        value={servicio.proveedor ?? "-"}
                      />
                      <ValueItem
                        align="right"
                        label="Base"
                        value={formatCurrencyValue(servicio.precio_base)}
                      />
                      <ValueItem
                        align="right"
                        label="Adic."
                        value={formatCurrencyValue(servicio.adicionales_monto)}
                      />
                      <ValueItem
                        align="right"
                        label="Base IVA"
                        value={formatCurrencyValue(
                          servicio.iva_base_imponible,
                        )}
                      />
                      <ValueItem
                        align="right"
                        label="IVA %"
                        value={formatPercentage(servicio.iva_porcentaje)}
                      />
                      <ValueItem
                        align="right"
                        label="Total"
                        strong
                        value={formatCurrencyValue(servicio.total_con_iva)}
                      />
                      <ValueItem
                        align="right"
                        label="Pagado"
                        value={formatCurrency(servicio.total_pagado)}
                      />
                      <ValueItem
                        align="right"
                        label="Saldo"
                        strong
                        value={formatCurrency(servicio.saldo_pendiente)}
                      />
                      <div className="flex items-center justify-end gap-3 xl:flex-col xl:items-end">
                        <span className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm shadow-slate-950/5 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 group-open:hidden">
                          Editar
                        </span>
                        <span className="hidden min-h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-700 group-open:inline-flex">
                          Cerrar
                        </span>
                      </div>
                    </div>
                  </summary>
                  <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-5">
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-slate-950">
                        Editar servicio facturable
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Modifica los valores pactados y guarda los cambios.
                      </p>
                    </div>
                    <EventoServicioForm
                      action={updateEventoServicioAction.bind(
                        null,
                        eventoId,
                        servicio.id,
                      )}
                      catalogo={catalogo}
                      formId={`evento-servicio-${servicio.id}`}
                      initialState={getEventoServicioFormState(
                        getEventoServicioFieldsFromValues(servicio),
                      )}
                      monthlyPriceSuggestions={monthlyPriceSuggestions}
                      submitLabel="Guardar cambios"
                      submittingLabel="Guardando..."
                    />
                    <div className="mt-4 flex justify-end">
                      <DeleteEventoServicioForm
                        action={deleteEventoServicioAction.bind(
                          null,
                          eventoId,
                          servicio.id,
                        )}
                      />
                    </div>
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No hay valores cargados"
              description="Agrega los servicios pactados para calcular el total del evento antes de registrar cobros."
            />
          )}
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-950">
            Agregar servicio facturable
          </h3>
          <div className="mt-4">
            <EventoServicioForm
              action={createEventoServicioAction.bind(null, eventoId)}
              catalogo={catalogo}
              formId="evento-servicio-nuevo"
              initialState={getEmptyEventoServicioFormState()}
              monthlyPriceSuggestions={monthlyPriceSuggestions}
              resetOnSuccess
              submitLabel="Agregar servicio"
              submittingLabel="Agregando..."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ValueItem({
  align = "left",
  label,
  strong = false,
  value,
}: {
  align?: "left" | "right";
  label: string;
  strong?: boolean;
  value: string;
}) {
  return (
    <div className={align === "right" ? "xl:text-right" : undefined}>
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 xl:hidden">
        {label}
      </div>
      <div
        className={
          strong
            ? "mt-1 text-sm font-semibold text-slate-950 xl:mt-0"
            : "mt-1 text-sm text-slate-700 xl:mt-0"
        }
      >
        {value}
      </div>
    </div>
  );
}

function formatCurrencyValue(value: number | null) {
  return formatCurrency(value ?? 0);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function formatPercentage(value: number | null) {
  return `${new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
  }).format((value ?? 0) * 100)}%`;
}
