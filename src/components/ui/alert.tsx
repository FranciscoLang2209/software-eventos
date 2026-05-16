import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

export const alertVariants = cva(
  "relative w-full rounded-xl border px-4 py-3 text-sm shadow-sm shadow-slate-950/5",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "border-slate-200 bg-white text-slate-700",
        success: "border-emerald-100 bg-emerald-50 text-emerald-700",
        destructive: "border-red-100 bg-red-50 text-red-700",
        warning: "border-amber-100 bg-amber-50 text-amber-700",
      },
    },
  },
);

type AlertProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants>;

export function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div
      className={cn(alertVariants({ variant }), className)}
      role={variant === "destructive" ? "alert" : undefined}
      {...props}
    />
  );
}

export function AlertTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("leading-6", className)} {...props} />;
}
