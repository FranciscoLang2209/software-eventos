"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { SubmitButton } from "@/components/salones/submit-button";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FieldError,
  FormAlert,
  Input,
  Label,
  Textarea,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  EventoSalon,
  EventoSalonAssignment,
  EventoVendedor,
} from "@/lib/eventos/queries";
import type { EventoFormState } from "@/lib/eventos/validation";

type EventoFormProps = {
  action: (
    previousState: EventoFormState,
    formData: FormData,
  ) => Promise<EventoFormState>;
  assignments: EventoSalonAssignment[];
  cancelHref?: string;
  initialState: EventoFormState;
  isAdmin: boolean;
  pendingLabel?: string;
  salones: EventoSalon[];
  submitLabel?: string;
  vendedores: EventoVendedor[];
};

export function EventoForm({
  action,
  assignments,
  cancelHref = "/eventos",
  initialState,
  isAdmin,
  pendingLabel = "Creando...",
  salones,
  submitLabel = "Crear evento",
  vendedores,
}: EventoFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const [selectedSalonId, setSelectedSalonId] = useState(
    state.fields.salon_id,
  );
  const [selectedVendedorId, setSelectedVendedorId] = useState(
    state.fields.vendedor_id,
  );

  const assignedVendedores = useMemo(() => {
    if (isAdmin) {
      return vendedores;
    }

    if (!selectedSalonId) {
      return vendedores;
    }

    const assignedIds = new Set(
      assignments
        .filter((assignment) => assignment.salon_id === selectedSalonId)
        .map((assignment) => assignment.usuario_id),
    );

    return vendedores.filter((vendedor) => assignedIds.has(vendedor.id));
  }, [assignments, isAdmin, selectedSalonId, vendedores]);

  return (
    <form action={formAction} className="max-w-5xl space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Salon y responsable</CardTitle>
          <CardDescription>
            Define la unidad operativa y el vendedor responsable del evento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="salon_id">Salon</Label>
              <Select
                name="salon_id"
                required
                value={selectedSalonId}
                onValueChange={(value) => {
                  setSelectedSalonId(value);
                  setSelectedVendedorId("");
                }}
              >
                <SelectTrigger
                  id="salon_id"
                  aria-invalid={Boolean(state.errors.salon_id)}
                  aria-describedby={
                    state.errors.salon_id ? "salon_id-error" : undefined
                  }
                >
                  <SelectValue placeholder="Seleccionar salon" />
                </SelectTrigger>
                <SelectContent>
                  {salones.map((salon) => (
                    <SelectItem key={salon.id} value={salon.id}>
                      {getSalonOptionLabel(salon)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.errors.salon_id ? (
                <FieldError id="salon_id-error">
                  {state.errors.salon_id}
                </FieldError>
              ) : null}
            </div>

            {isAdmin ? (
              <div>
                <Label htmlFor="vendedor_id">Vendedor responsable</Label>
                <Select
                  name="vendedor_id"
                  required
                  value={selectedVendedorId}
                  onValueChange={setSelectedVendedorId}
                  disabled={!selectedSalonId}
                >
                  <SelectTrigger
                    id="vendedor_id"
                    aria-invalid={Boolean(state.errors.vendedor_id)}
                    aria-describedby={
                      state.errors.vendedor_id
                        ? "vendedor_id-error"
                        : undefined
                    }
                  >
                    <SelectValue
                      placeholder={
                        selectedSalonId
                          ? "Seleccionar vendedor"
                          : "Primero selecciona un salon"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {assignedVendedores.map((vendedor) => (
                      <SelectItem key={vendedor.id} value={vendedor.id}>
                        {vendedor.full_name} - {vendedor.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {state.errors.vendedor_id ? (
                  <FieldError id="vendedor_id-error">
                    {state.errors.vendedor_id}
                  </FieldError>
                ) : null}
                {selectedSalonId && assignedVendedores.length === 0 ? (
                  <Alert variant="warning" className="mt-2 px-3 py-2">
                    Este salon no tiene vendedores asignados.
                  </Alert>
                ) : null}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cliente</CardTitle>
          <CardDescription>
            Datos comerciales y de contacto asociados al contrato.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="cliente_nombre">Nombre del cliente</Label>
              <Input
                id="cliente_nombre"
                name="cliente_nombre"
                type="text"
                required
                defaultValue={state.fields.cliente_nombre}
                aria-invalid={Boolean(state.errors.cliente_nombre)}
                aria-describedby={
                  state.errors.cliente_nombre
                    ? "cliente_nombre-error"
                    : undefined
                }
              />
              {state.errors.cliente_nombre ? (
                <FieldError id="cliente_nombre-error">
                  {state.errors.cliente_nombre}
                </FieldError>
              ) : null}
            </div>

            <TextField
              id="cliente_razon_social"
              label="Razon social"
              defaultValue={state.fields.cliente_razon_social}
            />
            <TextField
              id="cliente_cuit_dni"
              label="CUIT / DNI"
              defaultValue={state.fields.cliente_cuit_dni}
            />
            <TextField
              id="cliente_contacto"
              label="Contacto"
              defaultValue={state.fields.cliente_contacto}
            />
            <TextField
              id="cliente_direccion"
              label="Direccion"
              defaultValue={state.fields.cliente_direccion}
            />
            <TextField
              id="cliente_ciudad"
              label="Ciudad"
              defaultValue={state.fields.cliente_ciudad}
            />
            <div className="sm:col-span-2">
              <TextField
                id="cliente_direccion_factura"
                label="Direccion de factura"
                defaultValue={state.fields.cliente_direccion_factura}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evento</CardTitle>
          <CardDescription>
            Fecha, tipo de evento, espacio y cantidad estimada de asistentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="fecha_evento">Fecha del evento</Label>
              <Input
                id="fecha_evento"
                name="fecha_evento"
                type="date"
                required
                defaultValue={state.fields.fecha_evento}
                aria-invalid={Boolean(state.errors.fecha_evento)}
                aria-describedby={
                  state.errors.fecha_evento ? "fecha_evento-error" : undefined
                }
              />
              {state.errors.fecha_evento ? (
                <FieldError id="fecha_evento-error">
                  {state.errors.fecha_evento}
                </FieldError>
              ) : null}
            </div>

            <div>
              <Label htmlFor="fecha_contrato">Fecha de contrato</Label>
              <Input
                id="fecha_contrato"
                name="fecha_contrato"
                type="date"
                defaultValue={state.fields.fecha_contrato}
                aria-invalid={Boolean(state.errors.fecha_contrato)}
                aria-describedby={
                  state.errors.fecha_contrato
                    ? "fecha_contrato-error"
                    : undefined
                }
              />
              {state.errors.fecha_contrato ? (
                <FieldError id="fecha_contrato-error">
                  {state.errors.fecha_contrato}
                </FieldError>
              ) : null}
            </div>

            <TextField
              id="tipo_evento"
              label="Tipo de evento"
              defaultValue={state.fields.tipo_evento}
            />
            <TextField
              id="espacio"
              label="Espacio"
              defaultValue={state.fields.espacio}
            />
            <NumberField
              id="pax_adultos"
              label="Pax adultos"
              defaultValue={state.fields.pax_adultos}
              error={state.errors.pax_adultos}
            />
            <NumberField
              id="pax_jovenes"
              label="Pax jovenes"
              defaultValue={state.fields.pax_jovenes}
              error={state.errors.pax_jovenes}
            />
            <NumberField
              id="pax_menores"
              label="Pax menores"
              defaultValue={state.fields.pax_menores}
              error={state.errors.pax_menores}
            />
            <NumberField
              id="pax_bebes"
              label="Pax bebes"
              defaultValue={state.fields.pax_bebes}
              error={state.errors.pax_bebes}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informacion comercial</CardTitle>
          <CardDescription>
            Organizador externo, comision y observaciones iniciales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id="organizador_externo"
              label="Organizador externo"
              defaultValue={state.fields.organizador_externo}
            />
            <NumberField
              id="comision_organizador"
              label="Comision organizador"
              defaultValue={state.fields.comision_organizador}
              error={state.errors.comision_organizador}
              step="0.01"
            />
            <div className="sm:col-span-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                name="observaciones"
                rows={4}
                defaultValue={state.fields.observaciones}
              />
            </div>
          </div>

          {state.formError ? (
            <div className="mt-5">
              <FormAlert>{state.formError}</FormAlert>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={cancelHref}
          className={buttonVariants({ variant: "secondary" })}
        >
          Cancelar
        </Link>
        <SubmitButton pendingLabel={pendingLabel}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

function TextField({
  defaultValue,
  id,
  label,
}: {
  defaultValue: string;
  id: keyof EventoFormState["fields"];
  label: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} type="text" defaultValue={defaultValue} />
    </div>
  );
}

function NumberField({
  defaultValue,
  error,
  id,
  label,
  step = "1",
}: {
  defaultValue: string;
  error?: string;
  id: keyof EventoFormState["fields"];
  label: string;
  step?: string;
}) {
  const errorId = `${id}-error`;

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type="number"
        min="0"
        step={step}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      />
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}

function getSalonOptionLabel(salon: EventoSalon) {
  const details = [
    salon.direccion,
    salon.capacidad !== null ? `${salon.capacidad} personas` : null,
  ].filter(Boolean);

  return details.length > 0
    ? `${salon.nombre} - ${details.join(" - ")}`
    : salon.nombre;
}
