"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  emptyImportPreciosServiciosState,
  importPreciosMensualesFromExcel,
  type ImportPreciosServiciosState,
} from "@/lib/precios-servicios/precios-mensuales";

export async function importPreciosServiciosAction(
  _previousState: ImportPreciosServiciosState,
  formData: FormData,
): Promise<ImportPreciosServiciosState> {
  const profile = await requireAdmin();
  const file = formData.get("archivo");

  if (!(file instanceof File) || file.size === 0) {
    return {
      ...emptyImportPreciosServiciosState,
      formError: "Selecciona una planilla Excel para importar.",
    };
  }

  if (!isExcelFile(file)) {
    return {
      ...emptyImportPreciosServiciosState,
      formError: "El archivo debe ser .xlsx, .xls o .csv.",
    };
  }

  const state = await importPreciosMensualesFromExcel({
    file,
    importedBy: profile.id,
  });

  if (state.successMessage) {
    revalidatePath("/admin");
    revalidatePath("/admin/precios-servicios");
  }

  return state;
}

function isExcelFile(file: File) {
  const allowedExtensions = [".xlsx", ".xls", ".csv"];
  const lowerName = file.name.toLowerCase();

  return allowedExtensions.some((extension) => lowerName.endsWith(extension));
}
