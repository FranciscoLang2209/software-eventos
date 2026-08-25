import assert from "node:assert/strict";
import test from "node:test";
import {
  getAuditChanges,
  getAuditObject,
  getDisplayAction,
  getFieldLabel,
  getTableLabel,
} from "./presentation";

test("una creacion presenta principalmente valores nuevos", () => {
  const changes = getAuditChanges(null, {
    cliente_nombre: "Ana",
    estado: "borrador",
  });

  assert.deepEqual(
    changes.map(({ after, before, field }) => ({ after, before, field })),
    [
      { after: "Ana", before: undefined, field: "cliente_nombre" },
      { after: "borrador", before: undefined, field: "estado" },
    ],
  );
});

test("una edicion compara solo valores que cambiaron", () => {
  const changes = getAuditChanges(
    { cliente_nombre: "Ana", estado: "borrador" },
    { cliente_nombre: "Ana", estado: "confirmado" },
  );

  assert.equal(changes.length, 1);
  assert.deepEqual(changes[0], {
    after: "confirmado",
    before: "borrador",
    field: "estado",
    label: "Estado",
  });
});

test("clasifica eliminacion logica, restauracion y asignaciones", () => {
  assert.equal(
    getDisplayAction({
      action: "UPDATE",
      afterValue: { deleted_at: "2026-07-13T10:00:00Z" },
      beforeValue: { deleted_at: null },
      table: "eventos",
    }),
    "SOFT_DELETE",
  );
  assert.equal(
    getDisplayAction({
      action: "UPDATE",
      afterValue: { deleted_at: null },
      beforeValue: { deleted_at: "2026-07-13T10:00:00Z" },
      table: "eventos",
    }),
    "RESTORE",
  );
  assert.equal(
    getDisplayAction({
      action: "INSERT",
      afterValue: { salon_id: "salon-1", usuario_id: "user-1" },
      beforeValue: null,
      table: "usuario_salon",
    }),
    "ASSIGN",
  );
  assert.equal(
    getDisplayAction({
      action: "SOFT_DELETE",
      afterValue: { deleted_at: "2026-07-13T10:00:00Z" },
      beforeValue: { deleted_at: null },
      table: "eventos",
    }),
    "SOFT_DELETE",
  );
});

test("tolera JSON nulo o con una estructura inesperada", () => {
  assert.deepEqual(getAuditObject(null), {});
  assert.deepEqual(getAuditObject("texto inesperado"), {});
  assert.deepEqual(getAuditObject(["inesperado"]), {});
});

test("centraliza nombres legibles de entidades y campos", () => {
  assert.equal(getTableLabel("evento_servicios"), "Servicios del evento");
  assert.equal(getFieldLabel("fecha_evento"), "Fecha del evento");
  assert.equal(getFieldLabel("campo_futuro"), "Campo futuro");
});
