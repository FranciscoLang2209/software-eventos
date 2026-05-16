import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    defaultVariants: {
      size: "md",
      variant: "primary",
    },
    variants: {
      size: {
        xs: "min-h-8 px-3 py-1.5 text-xs",
        sm: "min-h-9 px-3.5 py-2 text-sm",
        md: "min-h-10 px-4 py-2.5 text-sm",
      },
      variant: {
        default:
          "border border-teal-700 bg-primary text-primary-foreground shadow-sm shadow-teal-950/10 hover:border-teal-800 hover:bg-teal-800",
        primary:
          "border border-teal-700 bg-primary text-primary-foreground shadow-sm shadow-teal-950/10 hover:border-teal-800 hover:bg-teal-800",
        secondary:
          "border border-slate-200 bg-white text-slate-800 shadow-sm shadow-slate-950/5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950",
        outline:
          "border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-950/5 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800",
        ghost:
          "border border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950",
        destructive:
          "border border-red-600 bg-red-600 text-white shadow-sm shadow-red-950/10 hover:border-red-700 hover:bg-red-700",
        danger:
          "border border-red-200 bg-white text-red-700 shadow-sm shadow-slate-950/5 hover:border-red-300 hover:bg-red-50",
        quiet:
          "border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800",
      },
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  asChild = false,
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      type={type}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  );
}
