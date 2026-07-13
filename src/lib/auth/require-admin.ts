import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { canManageUsers } from "@/lib/usuarios/rules-core";

export async function requireAdmin() {
  const profile = await getCurrentProfile();

  if (!canManageUsers(profile)) {
    redirect("/dashboard");
  }

  return profile;
}
