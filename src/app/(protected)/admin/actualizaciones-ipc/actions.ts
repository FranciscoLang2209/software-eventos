"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getEmptyIpcFormState,
  type IpcFormState,
  type IpcSummary,
  validateIpcForm,
} from "@/lib/ipc/validation";
import { logSupabaseError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

export async function previewIpcAction(
  _previousState: IpcFormState,
  formData: FormData,
): Promise<IpcFormState> {
  await requireAdmin();
  const { errors, fields, payload } = validateIpcForm(formData);

  if (!payload) {
    return {
      ...getEmptyIpcFormState(),
      errors,
      fields,
      formError: "Revisa los campos marcados.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "previsualizar_actualizacion_ipc",
    {
      p_periodo: payload.periodo,
      p_variacion_porcentual: payload.variacionPorcentual,
    },
  );

  if (error) {
    logSupabaseError("IPC previsualizar", error);
    return getIpcRpcErrorState(fields, error);
  }

  const result = data[0];

  if (!result) {
    return {
      ...getEmptyIpcFormState(),
      fields,
      formError: "No se pudo calcular el impacto del IPC.",
    };
  }

  return {
    ...getEmptyIpcFormState(),
    fields,
    summary: {
      cantidadEventos: result.cantidad_eventos,
      cantidadServicios: result.cantidad_servicios,
      montoPrecioBaseAnterior: result.monto_precio_base_anterior,
      montoPrecioBaseActualizado: result.monto_precio_base_proyectado,
      montoTotalConIvaAnterior: result.monto_total_con_iva_anterior,
      montoTotalConIvaActualizado: result.monto_total_con_iva_proyectado,
    },
  };
}

export async function applyIpcAction(
  _previousState: IpcFormState,
  formData: FormData,
): Promise<IpcFormState> {
  await requireAdmin();
  const { errors, fields, payload } = validateIpcForm(formData);

  if (!payload) {
    return {
      ...getEmptyIpcFormState(),
      errors,
      fields,
      formError: "No se pudo confirmar el IPC. Revisa los datos.",
    };
  }

  if (formData.get("confirmar") !== "true") {
    return {
      ...getEmptyIpcFormState(),
      fields,
      formError: "Confirma explícitamente la aplicación antes de continuar.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("registrar_y_aplicar_ipc", {
    p_periodo: payload.periodo,
    p_variacion_porcentual: payload.variacionPorcentual,
  });

  if (error) {
    logSupabaseError("IPC aplicar", error);
    return getIpcRpcErrorState(fields, error);
  }

  const result = data[0];

  if (!result) {
    return {
      ...getEmptyIpcFormState(),
      fields,
      formError: "No se pudo confirmar la aplicación del IPC.",
    };
  }

  revalidateIpcPaths();

  return {
    ...getEmptyIpcFormState(),
    fields,
    successMessage: "IPC aplicado correctamente.",
    summary: mapAppliedSummary(result),
  };
}

function mapAppliedSummary(result: {
  cantidad_eventos: number;
  cantidad_servicios: number;
  monto_precio_base_actualizado: number;
  monto_precio_base_anterior: number;
  monto_total_con_iva_actualizado: number;
  monto_total_con_iva_anterior: number;
}): IpcSummary {
  return {
    cantidadEventos: result.cantidad_eventos,
    cantidadServicios: result.cantidad_servicios,
    montoPrecioBaseAnterior: result.monto_precio_base_anterior,
    montoPrecioBaseActualizado: result.monto_precio_base_actualizado,
    montoTotalConIvaAnterior: result.monto_total_con_iva_anterior,
    montoTotalConIvaActualizado: result.monto_total_con_iva_actualizado,
  };
}

function getIpcRpcErrorState(
  fields: IpcFormState["fields"],
  error: { code?: string | null },
): IpcFormState {
  const formError =
    error.code === "23505"
      ? "Ya existe un IPC registrado para ese período."
      : error.code === "42501"
        ? "No tenes permisos para aplicar IPC."
        : "No se pudo procesar el IPC. Intenta nuevamente.";

  return {
    ...getEmptyIpcFormState(),
    fields,
    formError,
  };
}

function revalidateIpcPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/actualizaciones-ipc");
  revalidatePath("/admin/auditoria");
  revalidatePath("/dashboard");
  revalidatePath("/eventos");
  revalidatePath("/eventos/[id]", "page");
  revalidatePath("/reportes");
}
