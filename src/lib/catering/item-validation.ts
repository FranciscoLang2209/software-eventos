import {
  isCateringAdicionalCategoria,
  type CateringAdicionalCategoria,
} from "@/lib/catering/types";

export type CateringItemFormFields = {
  categoria: string;
  descripcion: string;
  precio_unitario: string;
};

export type CateringItemFormErrors = Partial<
  Record<keyof CateringItemFormFields, string>
>;

export type CateringItemFormState = {
  fields: CateringItemFormFields;
  errors: CateringItemFormErrors;
  formError: string | null;
  successMessage: string | null;
};

export type CateringItemPayload = {
  categoria: CateringAdicionalCategoria;
  descripcion: string;
  precio_unitario: number;
};

export function getEmptyCateringItemFormState(): CateringItemFormState {
  return {
    fields: {
      categoria: "adicional_alimentos",
      descripcion: "",
      precio_unitario: "",
    },
    errors: {},
    formError: null,
    successMessage: null,
  };
}

export function validateCateringItemForm(formData: FormData): {
  state: CateringItemFormState;
  payload: CateringItemPayload | null;
} {
  const fields = getFields(formData);
  const errors: CateringItemFormErrors = {};
  const categoria = fields.categoria.trim();
  const descripcion = fields.descripcion.trim();
  const precioText = fields.precio_unitario.trim().replace(",", ".");
  let precio: number | null = null;

  if (!isCateringAdicionalCategoria(categoria)) {
    errors.categoria = "Selecciona un tipo de adicional valido.";
  }

  if (!descripcion) {
    errors.descripcion = "Ingresa el detalle del adicional.";
  }

  if (!precioText) {
    errors.precio_unitario = "Ingresa el precio del adicional.";
  } else {
    const value = Number(precioText);

    if (!Number.isFinite(value) || value <= 0) {
      errors.precio_unitario = "Ingresa un precio valido.";
    } else {
      precio = roundMoney(value);
    }
  }

  if (Object.keys(errors).length > 0 || precio === null || !isCateringAdicionalCategoria(categoria)) {
    return {
      state: {
        fields,
        errors,
        formError: "Revisa los campos marcados.",
        successMessage: null,
      },
      payload: null,
    };
  }

  return {
    state: { fields, errors: {}, formError: null, successMessage: null },
    payload: {
      categoria,
      descripcion,
      precio_unitario: precio,
    },
  };
}

function getFields(formData: FormData): CateringItemFormFields {
  return {
    categoria: getString(formData, "categoria"),
    descripcion: getString(formData, "descripcion"),
    precio_unitario: getString(formData, "precio_unitario"),
  };
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
