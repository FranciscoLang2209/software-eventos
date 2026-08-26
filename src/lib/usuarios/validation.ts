import type { UserManagementRole } from "./rules-core";

export type UsuarioFormFields = {
  activo: boolean;
  email: string;
  fullName: string;
  rol: UserManagementRole;
  salonIds: string[];
};

export type UsuarioFormErrors = Partial<
  Record<"email" | "fullName" | "rol" | "salonIds", string>
>;

export type UsuarioFormState = {
  errors: UsuarioFormErrors;
  fields: UsuarioFormFields;
  formError: string | null;
  successMessage: string | null;
  temporaryPassword: string | null;
};

export const emptyUsuarioFormState: UsuarioFormState = {
  errors: {},
  fields: {
    activo: true,
    email: "",
    fullName: "",
    rol: "vendedor",
    salonIds: [],
  },
  formError: null,
  successMessage: null,
  temporaryPassword: null,
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateUsuarioForm(formData: FormData): {
  payload: UsuarioFormFields | null;
  state: UsuarioFormState;
} {
  const rawRole = getString(formData, "rol");
  const fields: UsuarioFormFields = {
    activo: formData.get("activo") === "on",
    email: getString(formData, "email").trim().toLowerCase(),
    fullName: getString(formData, "full_name").trim(),
    rol: isUserManagementRole(rawRole) ? rawRole : "vendedor",
    salonIds: Array.from(new Set(formData.getAll("salon_ids")))
      .filter((value): value is string => typeof value === "string")
      .filter(Boolean),
  };
  const errors: UsuarioFormErrors = {};

  if (!fields.fullName) {
    errors.fullName = "Ingresa el nombre completo.";
  } else if (fields.fullName.length > 160) {
    errors.fullName = "El nombre no puede superar los 160 caracteres.";
  }

  if (!fields.email) {
    errors.email = "Ingresa el email.";
  } else if (!emailPattern.test(fields.email)) {
    errors.email = "Ingresa un email valido.";
  } else if (fields.email.length > 254) {
    errors.email = "El email no puede superar los 254 caracteres.";
  }

  if (!isUserManagementRole(rawRole)) {
    errors.rol = "El rol seleccionado no es valido.";
  }

  if (fields.salonIds.some((id) => !uuidPattern.test(id))) {
    errors.salonIds = "Una de las asignaciones seleccionadas no es valida.";
  }

  if (fields.rol !== "vendedor") {
    fields.salonIds = [];
  }

  const hasErrors = Object.keys(errors).length > 0;

  return {
    payload: hasErrors ? null : fields,
    state: {
      errors,
      fields,
      formError: hasErrors ? "Revisa los campos marcados." : null,
      successMessage: null,
      temporaryPassword: null,
    },
  };
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function isUserManagementRole(value: string): value is UserManagementRole {
  return value === "admin" || value === "vendedor" || value === "ejecutiva_catering";
}
