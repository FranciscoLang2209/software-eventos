import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

type CateringDetalleNavProps = {
  active: "detalle" | "egresos" | "ingresos";
  cateringId: string;
};

const sections = [
  { id: "detalle", label: "Detalle", pathname: "" },
  { id: "ingresos", label: "Ingresos", pathname: "/ingresos" },
  { id: "egresos", label: "Egresos", pathname: "/egresos" },
] as const;

export function CateringDetalleNav({ active, cateringId }: CateringDetalleNavProps) {
  return (
    <nav
      aria-label="Secciones del catering"
      className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm shadow-slate-950/5"
    >
      {sections.map((section) => (
        <Link
          key={section.id}
          href={`/catering/${cateringId}${section.pathname}`}
          aria-current={active === section.id ? "page" : undefined}
          className={buttonVariants({
            size: "sm",
            variant: active === section.id ? "primary" : "ghost",
          })}
        >
          {section.label}
        </Link>
      ))}
    </nav>
  );
}
