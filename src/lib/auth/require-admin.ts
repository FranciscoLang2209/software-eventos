import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export async function requireAdmin() {
  const profile = await getCurrentProfile();

  if (profile?.rol !== "admin" || !profile.activo) {
    redirect("/dashboard");
  }

  return profile;
}
