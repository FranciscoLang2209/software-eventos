export { getCurrentUser } from "./get-current-user";
export {
  getCurrentProfile,
  getCurrentRole,
  type AppRole,
  type CurrentProfile,
} from "./get-current-profile";
export { requireAdmin } from "./require-admin";
export {
  canAccessSalon,
  getAuthorizedActiveEvento,
  usuarioTieneSalon,
  type AuthorizedActiveEvento,
} from "./event-access";
export {
  canAccessSalonWithAssignments,
  hasGlobalEventAccess,
  type EventAccessProfile,
  type SalonAssignment,
} from "./event-access-core";
