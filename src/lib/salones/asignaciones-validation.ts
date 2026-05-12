export type SalonAssignmentsFormState = {
  formError: string | null;
  successMessage: string | null;
};

export type SalonAssignmentsPayload = {
  usuarioId: string;
  salonIds: string[];
};

export const emptySalonAssignmentsFormState: SalonAssignmentsFormState = {
  formError: null,
  successMessage: null,
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateSalonAssignmentsForm(formData: FormData): {
  state: SalonAssignmentsFormState;
  payload: SalonAssignmentsPayload | null;
} {
  const usuarioId = getString(formData, "usuario_id");
  const salonIds = Array.from(new Set(formData.getAll("salon_ids")))
    .filter((value): value is string => typeof value === "string")
    .filter(Boolean);

  if (!uuidPattern.test(usuarioId)) {
    return {
      state: {
        formError: "El vendedor seleccionado no es valido.",
        successMessage: null,
      },
      payload: null,
    };
  }

  if (salonIds.some((salonId) => !uuidPattern.test(salonId))) {
    return {
      state: {
        formError: "Una de las asignaciones seleccionadas no es valida.",
        successMessage: null,
      },
      payload: null,
    };
  }

  return {
    state: {
      formError: null,
      successMessage: null,
    },
    payload: {
      usuarioId,
      salonIds,
    },
  };
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}
