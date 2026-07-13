export type EventAccessRole = "admin" | "vendedor";

export type EventAccessProfile = {
  activo: boolean;
  id: string;
  rol: EventAccessRole;
};

export type SalonAssignment = {
  salon_id: string;
  usuario_id: string;
};

export function hasGlobalEventAccess(profile: Pick<EventAccessProfile, "rol">) {
  return profile.rol === "admin";
}

export function canAccessSalonWithAssignments({
  assignments,
  profile,
  salonId,
}: {
  assignments: SalonAssignment[];
  profile: EventAccessProfile;
  salonId: string;
}) {
  if (!profile.activo) {
    return false;
  }

  if (hasGlobalEventAccess(profile)) {
    return true;
  }

  return assignments.some(
    (assignment) =>
      assignment.usuario_id === profile.id && assignment.salon_id === salonId,
  );
}
