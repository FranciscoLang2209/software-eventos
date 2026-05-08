"use client";

import { SubmitButton } from "@/components/salones/submit-button";

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
        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-400"
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
        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-red-50 disabled:text-red-400"
      >
        Desactivar
      </SubmitButton>
    </form>
  );
}
