import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "quiet";
type ButtonSize = "xs" | "sm" | "md";

type ButtonVariantOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "border border-teal-900 bg-teal-900 text-white shadow-sm hover:bg-teal-800",
  secondary:
    "border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50",
  ghost:
    "border border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950",
  danger:
    "border border-red-200 bg-white text-red-700 shadow-sm hover:bg-red-50",
  quiet:
    "border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100",
};

const sizes: Record<ButtonSize, string> = {
  xs: "min-h-8 px-3 py-1.5 text-xs",
  sm: "min-h-9 px-3.5 py-2 text-sm",
  md: "min-h-10 px-4 py-2.5 text-sm",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: ButtonVariantOptions = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-md font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-teal-900/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonVariantOptions;

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  );
}
