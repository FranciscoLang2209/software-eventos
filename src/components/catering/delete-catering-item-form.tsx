"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/salones/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form";
import type { DeleteCateringItemState } from "@/app/(protected)/catering/actions";

type DeleteCateringItemFormProps = {
  action: (
    previousState: DeleteCateringItemState,
    formData: FormData,
  ) => Promise<DeleteCateringItemState>;
};

const initialState: DeleteCateringItemState = {};

export function DeleteCateringItemForm({ action }: DeleteCateringItemFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <SubmitButton
        pendingLabel="Eliminando..."
        className={buttonVariants({
          size: "xs",
          variant: "danger",
          className: "disabled:cursor-not-allowed",
        })}
      >
        Eliminar
      </SubmitButton>
      {state.formError ? <FormAlert>{state.formError}</FormAlert> : null}
    </form>
  );
}
