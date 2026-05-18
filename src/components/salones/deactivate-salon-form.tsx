"use client";

import { SubmitButton } from "@/components/salones/submit-button";
import { buttonVariants } from "@/components/ui/button";

type DeactivateSalonFormProps = {
  id: string;
  active: boolean;
  action: (formData: FormData) => void | Promise<void>;
};

export function DeactivateSalonForm({
  id,
  active,
  action,
}: DeactivateSalonFormProps) {
  const nextActive = !active;

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={String(nextActive)} />
      <SubmitButton
        pendingLabel={active ? "Desactivando..." : "Activando..."}
        className={buttonVariants({
          variant: active ? "danger" : "outline",
          size: "xs",
          className: active
            ? "disabled:bg-red-50 disabled:text-red-400"
            : "disabled:bg-teal-50 disabled:text-teal-500",
        })}
      >
        {active ? "Desactivar" : "Activar"}
      </SubmitButton>
    </form>
  );
}
