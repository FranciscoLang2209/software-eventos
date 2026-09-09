import assert from "node:assert/strict";
import test from "node:test";
import { validateIpcForm } from "./validation";

function formData(values: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}

test("normaliza un período mensual y una variación con coma", () => {
  const result = validateIpcForm(
    formData({ periodo: "2026-10", variacion_porcentual: "2,56789" }),
  );

  assert.deepEqual(result.payload, {
    periodo: "2026-10-01",
    variacionPorcentual: 2.5679,
  });
});

test("rechaza un mes inexistente y una reducción total", () => {
  const result = validateIpcForm(
    formData({ periodo: "2026-13", variacion_porcentual: "-100" }),
  );

  assert.equal(result.payload, null);
  assert.ok(result.errors.periodo);
  assert.ok(result.errors.variacion_porcentual);
});
