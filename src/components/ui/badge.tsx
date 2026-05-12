import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type BadgeVariant =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "primary"
  | "inactive";

const variants: Record<BadgeVariant, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-600",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  primary: "border-teal-200 bg-teal-50 text-teal-800",
  inactive: "border-slate-200 bg-slate-100 text-slate-500",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({
  variant = "neutral",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
