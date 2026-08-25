import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
  {
    defaultVariants: {
      variant: "neutral",
    },
    variants: {
      variant: {
        default: "border-teal-100 bg-teal-50 text-teal-700",
        neutral: "border-slate-200 bg-slate-50 text-slate-600",
        success: "border-emerald-100 bg-emerald-50 text-emerald-700",
        warning: "border-amber-100 bg-amber-50 text-amber-700",
        danger: "border-red-100 bg-red-50 text-red-700",
        primary: "border-teal-100 bg-teal-50 text-teal-700",
        inactive: "border-slate-200 bg-slate-100 text-slate-500",
      },
    },
  },
);

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: VariantProps<typeof badgeVariants>["variant"];
};

export function Badge({
  variant = "neutral",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}
