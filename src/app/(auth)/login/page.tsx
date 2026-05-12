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
    <section className="flex min-h-screen items-center justify-center bg-[#f6f8fb] px-4 py-10 sm:px-6">
      <div className="w-full max-w-5xl">
        <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5 lg:grid-cols-[1fr_420px]">
          <div className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-400 text-sm font-semibold text-teal-950">
                SE
              </div>
              <h1 className="mt-8 max-w-md text-3xl font-semibold tracking-tight">
                Gestion profesional para eventos, salones y cobranzas.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
                Un panel interno claro para vendedores y administradores, con
                foco en operacion diaria y control financiero.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs text-slate-300">
              <span className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                Eventos
              </span>
              <span className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                Pagos
              </span>
              <span className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                Reportes
              </span>
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <LoginForm redirectTo={redirectTo} />
          </div>
        </div>
      </div>
    </section>
  );
}
