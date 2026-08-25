"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/salones/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form";
import type { DeleteEventoServicioState } from "@/app/(protected)/evento-servicios/actions";

type DeleteEventoServicioFormProps = {
  action: (
    previousState: DeleteEventoServicioState,
    formData: FormData,
  ) => Promise<DeleteEventoServicioState>;
};

const initialState: DeleteEventoServicioState = {};

export function DeleteEventoServicioForm({
  action,
}: DeleteEventoServicioFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <SubmitButton
        pendingLabel="Eliminando..."
        className={buttonVariants({
          className: "disabled:cursor-not-allowed",
          size: "xs",
          variant: "danger",
        })}
      >
        Eliminar
      </SubmitButton>
      {state.formError ? <FormAlert>{state.formError}</FormAlert> : null}
    </form>
  );
}
