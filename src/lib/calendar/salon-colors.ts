type SalonColorClasses = {
  dot: string;
  chip: string;
};

// Paleta fija: el color de cada salon se deriva de un hash de su id (uuid),
// no de su nombre. Asi un salon nuevo (ej. Figueroa 5500) recibe color
// automaticamente en cuanto se carga en Supabase, sin tocar este archivo.
const PALETTE: SalonColorClasses[] = [
  { dot: "bg-teal-500", chip: "border-teal-200 bg-teal-50 text-teal-800" },
  { dot: "bg-amber-500", chip: "border-amber-200 bg-amber-50 text-amber-700" },
  { dot: "bg-sky-500", chip: "border-sky-200 bg-sky-50 text-sky-700" },
  { dot: "bg-violet-500", chip: "border-violet-200 bg-violet-50 text-violet-700" },
  { dot: "bg-rose-500", chip: "border-rose-200 bg-rose-50 text-rose-700" },
  { dot: "bg-emerald-500", chip: "border-emerald-200 bg-emerald-50 text-emerald-700" },
];

const FALLBACK: SalonColorClasses = {
  dot: "bg-slate-400",
  chip: "border-slate-200 bg-slate-50 text-slate-600",
};

export function getSalonColorClasses(
  salonId: string | null | undefined,
): SalonColorClasses {
  if (!salonId) {
    return FALLBACK;
  }

  let hash = 0;
  for (let i = 0; i < salonId.length; i += 1) {
    hash = (hash * 31 + salonId.charCodeAt(i)) >>> 0;
  }

  return PALETTE[hash % PALETTE.length];
}
