import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessSalonWithAssignments,
  hasGlobalEventAccess,
  type EventAccessProfile,
} from "./event-access-core";

const admin: EventAccessProfile = {
  activo: true,
  id: "admin-1",
  rol: "admin",
};

const vendedor: EventAccessProfile = {
  activo: true,
  id: "vendedor-1",
  rol: "vendedor",
};

test("admin tiene acceso global aunque no tenga asignaciones", () => {
  assert.equal(hasGlobalEventAccess(admin), true);
  assert.equal(
    canAccessSalonWithAssignments({
      assignments: [],
      profile: admin,
      salonId: "salon-ajeno",
    }),
    true,
  );
});

test("vendedor solo accede a salones asignados", () => {
  const assignments = [
    {
      salon_id: "salon-1",
      usuario_id: vendedor.id,
    },
  ];

  assert.equal(
    canAccessSalonWithAssignments({
      assignments,
      profile: vendedor,
      salonId: "salon-1",
    }),
    true,
  );
  assert.equal(
    canAccessSalonWithAssignments({
      assignments,
      profile: vendedor,
      salonId: "salon-2",
    }),
    false,
  );
});

test("usuario inactivo no accede aunque tenga rol o asignacion", () => {
  assert.equal(
    canAccessSalonWithAssignments({
      assignments: [
        {
          salon_id: "salon-1",
          usuario_id: vendedor.id,
        },
      ],
      profile: {
        ...vendedor,
        activo: false,
      },
      salonId: "salon-1",
    }),
    false,
  );
  assert.equal(
    canAccessSalonWithAssignments({
      assignments: [],
      profile: {
        ...admin,
        activo: false,
      },
      salonId: "salon-1",
    }),
    false,
  );
});

