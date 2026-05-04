export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Acceso
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          Iniciar sesion
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Pantalla reservada para conectar Supabase Auth. Los administradores y
          vendedores ingresaran desde aqui cuando se implemente el flujo de
          autenticacion.
        </p>
      </div>
    </section>
  );
}
