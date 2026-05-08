export type SalonFormFields = {
  nombre: string;
  descripcion: string;
  direccion: string;
  capacidad: string;
  activo: boolean;
};

export type SalonFormErrors = Partial<Record<keyof SalonFormFields, string>>;

export type SalonFormState = {
  fields: SalonFormFields;
  errors: SalonFormErrors;
  formError: string | null;
};

export type SalonPayload = {
  nombre: string;
  descripcion: string | null;
  direccion: string | null;
  capacidad: number | null;
  activo: boolean;
};

export const emptySalonFormState: SalonFormState = {
  fields: {
    nombre: "",
    descripcion: "",
    direccion: "",
    capacidad: "",
    activo: true,
  },
  errors: {},
  formError: null,
};

export function validateSalonForm(formData: FormData): {
  state: SalonFormState;
  payload: SalonPayload | null;
} {
  const fields: SalonFormFields = {
    nombre: getString(formData, "nombre"),
    descripcion: getString(formData, "descripcion"),
    direccion: getString(formData, "direccion"),
    capacidad: getString(formData, "capacidad"),
    activo: formData.get("activo") === "on",
  };

  const errors: SalonFormErrors = {};
  const nombre = fields.nombre.trim();
  const descripcion = fields.descripcion.trim();
  const direccion = fields.direccion.trim();
  const capacidadText = fields.capacidad.trim();
  let capacidad: number | null = null;

  if (!nombre) {
    errors.nombre = "Ingresa el nombre del salon.";
  }

  if (capacidadText) {
    capacidad = Number(capacidadText);

    if (!Number.isInteger(capacidad) || capacidad < 0) {
      errors.capacidad = "La capacidad debe ser un numero mayor o igual a 0.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      state: {
        fields,
        errors,
        formError: "Revisa los campos marcados.",
      },
      payload: null,
    };
  }

  return {
    state: {
      fields,
      errors: {},
      formError: null,
    },
    payload: {
      nombre,
      descripcion: descripcion || null,
      direccion: direccion || null,
      capacidad,
      activo: fields.activo,
    },
  };
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}
