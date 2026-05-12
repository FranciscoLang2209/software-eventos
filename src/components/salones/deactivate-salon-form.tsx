"use client";

import { SubmitButton } from "@/components/salones/submit-button";
import { buttonVariants } from "@/components/ui/button";

type DeactivateSalonFormProps = {
  id: string;
  disabled: boolean;
  action: (formData: FormData) => void | Promise<void>;
};

export function DeactivateSalonForm({
  id,
  disabled,
  action,
}: DeactivateSalonFormProps) {
  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className={buttonVariants({
          variant: "quiet",
          size: "xs",
          className: "text-slate-400",
        })}
      >
        Desactivado
      </button>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton
        pendingLabel="Desactivando..."
        className={buttonVariants({
          variant: "danger",
          size: "xs",
          className: "disabled:bg-red-50 disabled:text-red-400",
        })}
      >
        Desactivar
      </SubmitButton>
    </form>
  );
}
