import assert from "node:assert/strict";
import test from "node:test";
import { validateUsuarioForm } from "./validation";

const salonId = "11111111-1111-4111-8111-111111111111";

function validFormData() {
  const formData = new FormData();
  formData.set("full_name", "  Usuario Prueba  ");
  formData.set("email", "  USUARIO@Example.com ");
  formData.set("rol", "vendedor");
  formData.set("activo", "on");
  formData.append("salon_ids", salonId);
  return formData;
}

test("normaliza un usuario valido y elimina asignaciones duplicadas", () => {
  const formData = validFormData();
  formData.append("salon_ids", salonId);
  const result = validateUsuarioForm(formData);

  assert.deepEqual(result.payload, {
    activo: true,
    email: "usuario@example.com",
    fullName: "Usuario Prueba",
    rol: "vendedor",
    salonIds: [salonId],
  });
});

test("rechaza nombre, email, rol e ids invalidos", () => {
  const formData = new FormData();
  formData.set("full_name", " ");
  formData.set("email", "email-invalido");
  formData.set("rol", "superadmin");
  formData.append("salon_ids", "no-es-uuid");
  const result = validateUsuarioForm(formData);

  assert.equal(result.payload, null);
  assert.ok(result.state.errors.fullName);
  assert.ok(result.state.errors.email);
  assert.ok(result.state.errors.rol);
  assert.ok(result.state.errors.salonIds);
});

test("un administrador no persiste asignaciones de salones", () => {
  const formData = validFormData();
  formData.set("rol", "admin");
  const result = validateUsuarioForm(formData);

  assert.deepEqual(result.payload?.salonIds, []);
});
