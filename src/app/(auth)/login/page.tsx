import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams?: Promise<{
    redirectedFrom?: string | string[];
  }>;
};

function getRedirectPath(value: string | string[] | undefined) {
  const redirectedFrom = Array.isArray(value) ? value[0] : value;

  if (
    redirectedFrom &&
    redirectedFrom.startsWith("/") &&
    !redirectedFrom.startsWith("//") &&
    redirectedFrom !== "/login"
  ) {
    return redirectedFrom;
  }

  return "/dashboard";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const redirectTo = getRedirectPath(params?.redirectedFrom);

  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <LoginForm redirectTo={redirectTo} />
    </section>
  );
}
