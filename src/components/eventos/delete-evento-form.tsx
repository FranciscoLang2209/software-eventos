"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/salones/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form";
import type { DeleteEventoState } from "@/app/(protected)/eventos/actions";

type DeleteEventoFormProps = {
  action: (
    previousState: DeleteEventoState,
    formData: FormData,
  ) => Promise<DeleteEventoState>;
};

const initialState: DeleteEventoState = {};

export function DeleteEventoForm({ action }: DeleteEventoFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <SubmitButton
        pendingLabel="Eliminando..."
        className={buttonVariants({
          variant: "danger",
          className: "disabled:cursor-not-allowed disabled:bg-red-50 disabled:text-red-400",
        })}
      >
        Eliminar
      </SubmitButton>
      {state.formError ? <FormAlert>{state.formError}</FormAlert> : null}
    </form>
  );
}
