import Link from "next/link";

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Eventos", href: "/eventos" },
  { name: "Salones", href: "/salones" },
  { name: "Pagos", href: "/pagos" },
  { name: "Reportes", href: "/reportes" },
  { name: "Admin", href: "/admin" },
];

export function AppSidebar() {
  return (
    <aside className="border-b border-slate-200 bg-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col px-4 py-5">
        <Link href="/dashboard" className="text-lg font-semibold text-slate-950">
          Software Eventos
        </Link>
        <p className="mt-1 text-sm text-slate-500">
          Gestion operativa y financiera
        </p>
        <nav className="mt-6 grid gap-1 sm:grid-cols-3 lg:grid-cols-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
