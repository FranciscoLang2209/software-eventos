"use client";

import { buttonVariants } from "@/components/ui/button";
import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
};

export function SubmitButton({
  children,
  pendingLabel,
  className,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        buttonVariants({
          variant: "primary",
          className: "disabled:cursor-not-allowed",
        })
      }
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
