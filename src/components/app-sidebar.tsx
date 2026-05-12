"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";

const navigation = [
  { name: "Dashboard", href: "/dashboard", group: "Operacion" },
  { name: "Eventos", href: "/eventos", group: "Operacion" },
  { name: "Salones", href: "/salones", group: "Gestion" },
  { name: "Pagos", href: "/pagos", group: "Finanzas" },
  { name: "Reportes", href: "/reportes", group: "Finanzas" },
  { name: "Admin", href: "/admin", group: "Sistema" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-slate-200 bg-white/95 backdrop-blur lg:sticky lg:top-0 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col px-4 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-900 text-sm font-semibold text-white shadow-sm">
            SE
          </span>
          <span>
            <span className="block text-sm font-semibold text-slate-950">
              Software Eventos
            </span>
            <span className="block text-xs text-slate-500">
              Operacion y finanzas
            </span>
          </span>
        </Link>

        <nav className="mt-6 grid gap-1 sm:grid-cols-3 lg:grid-cols-1">
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              name={item.name}
              group={item.group}
              active={isActive(pathname, item.href)}
            />
          ))}
        </nav>

        <div className="mt-6 hidden rounded-lg border border-teal-100 bg-teal-50/70 p-4 lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
            Panel interno
          </p>
          <p className="mt-2 text-sm leading-6 text-teal-950">
            Gestion centralizada para ventas, eventos, salones, pagos y
            reportes.
          </p>
        </div>
      </div>
    </aside>
  );
}

function NavLink({
  href,
  name,
  group,
  active,
}: {
  href: string;
  name: string;
  group: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition",
        active
          ? "bg-teal-50 text-teal-950 ring-1 ring-inset ring-teal-100"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
      )}
    >
      <span>{name}</span>
      <span
        className={cn(
          "hidden text-[10px] font-semibold uppercase tracking-[0.14em] sm:inline lg:hidden xl:inline",
          active ? "text-teal-700" : "text-slate-400",
        )}
      >
        {group}
      </span>
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
