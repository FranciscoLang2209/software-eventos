import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/utils/cn";

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "block text-sm font-medium leading-none text-slate-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "mt-2 block min-h-10 w-full rounded-lg border border-input bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm shadow-slate-950/5 outline-none transition placeholder:text-slate-400 focus:border-ring focus:ring-2 focus:ring-ring/10 disabled:cursor-not-allowed disabled:bg-slate-50 aria-invalid:border-red-300 aria-invalid:focus:ring-red-900/10",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "mt-2 block w-full rounded-lg border border-input bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm shadow-slate-950/5 outline-none transition placeholder:text-slate-400 focus:border-ring focus:ring-2 focus:ring-ring/10 disabled:cursor-not-allowed disabled:bg-slate-50 aria-invalid:border-red-300 aria-invalid:focus:ring-red-900/10",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "mt-2 block min-h-10 w-full rounded-lg border border-input bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm shadow-slate-950/5 outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/10 disabled:cursor-not-allowed disabled:bg-slate-50 aria-invalid:border-red-300 aria-invalid:focus:ring-red-900/10",
        className,
      )}
      {...props}
    />
  );
}

type FieldErrorProps = {
  id: string;
  children: ReactNode;
};

export function FieldError({ id, children }: FieldErrorProps) {
  return (
    <p id={id} className="mt-2 text-sm font-medium text-red-600">
      {children}
    </p>
  );
}

type FormAlertProps = {
  children: ReactNode;
  variant?: "error" | "success";
};

export function FormAlert({ children, variant = "error" }: FormAlertProps) {
  return (
    <Alert
      role={variant === "success" ? "status" : "alert"}
      variant={variant === "success" ? "success" : "destructive"}
      className="px-3 py-2"
    >
      {children}
    </Alert>
  );
}

export const checkboxClassName =
  "h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring/20";
