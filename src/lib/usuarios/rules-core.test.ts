import assert from "node:assert/strict";
import test from "node:test";
import {
  canManageUsers,
  canUseApplication,
  getAccountProtectionError,
  getAssignmentChanges,
  isDuplicateEmail,
} from "./rules-core";

const admin = { activo: true, id: "admin-1", rol: "admin" as const };
const vendedor = {
  activo: true,
  id: "vendedor-1",
  rol: "vendedor" as const,
};

test("solo un administrador activo puede gestionar usuarios", () => {
  assert.equal(canManageUsers(admin), true);
  assert.equal(canManageUsers(vendedor), false);
  assert.equal(canManageUsers({ ...admin, activo: false }), false);
  assert.equal(canManageUsers(null), false);
});

test("un usuario inactivo no puede continuar usando la aplicacion", () => {
  assert.equal(canUseApplication(admin), true);
  assert.equal(canUseApplication({ activo: false }), false);
  assert.equal(canUseApplication(null), false);
});

test("detecta emails duplicados normalizados", () => {
  const users = [{ email: "ventas@example.com", id: "user-1" }];

  assert.equal(isDuplicateEmail(users, " VENTAS@example.com "), true);
  assert.equal(
    isDuplicateEmail(users, "ventas@example.com", "user-1"),
    false,
  );
});

test("calcula altas y bajas de asignaciones sin duplicados", () => {
  assert.deepEqual(
    getAssignmentChanges(["salon-1", "salon-2"], ["salon-2", "salon-3"]),
    { added: ["salon-3"], removed: ["salon-1"] },
  );
});

test("un administrador no puede desactivarse ni degradarse a si mismo", () => {
  assert.match(
    getAccountProtectionError({
      activeAdminCount: 2,
      actorId: "admin-1",
      nextActive: false,
      nextRole: "admin",
      targetId: "admin-1",
      targetWasActiveAdmin: true,
    }) ?? "",
    /desactivar tu propio usuario/,
  );
  assert.match(
    getAccountProtectionError({
      activeAdminCount: 2,
      actorId: "admin-1",
      nextActive: true,
      nextRole: "vendedor",
      targetId: "admin-1",
      targetWasActiveAdmin: true,
    }) ?? "",
    /propio rol de administrador/,
  );
});

test("no se puede dejar el sistema sin administradores activos", () => {
  assert.match(
    getAccountProtectionError({
      activeAdminCount: 1,
      actorId: "admin-1",
      nextActive: false,
      nextRole: "admin",
      targetId: "admin-2",
      targetWasActiveAdmin: true,
    }) ?? "",
    /ultimo administrador activo/,
  );
});
