import assert from "node:assert/strict";
import test from "node:test";
import {
  AUDIT_PAGE_SIZE,
  getAuditRange,
  getDateBoundary,
  hasAuditFilters,
  parseAuditFilters,
} from "./filters";

test("conserva filtros combinados validos", () => {
  const filters = parseAuditFilters({
    accion: "UPDATE",
    desde: "2026-07-01",
    hasta: "2026-07-13",
    orden: "asc",
    pagina: "3",
    registro: "evento-123",
    tabla: "eventos",
    usuario: "123e4567-e89b-42d3-a456-426614174000",
  });

  assert.deepEqual(filters, {
    action: "UPDATE",
    dateFrom: "2026-07-01",
    dateTo: "2026-07-13",
    order: "asc",
    page: 3,
    recordId: "evento-123",
    table: "eventos",
    userId: "123e4567-e89b-42d3-a456-426614174000",
  });
  assert.equal(hasAuditFilters(filters), true);
});

test("descarta fechas, acciones y paginas invalidas", () => {
  const filters = parseAuditFilters({
    accion: "HACK",
    desde: "2026-02-31",
    pagina: "-10",
  });

  assert.equal(filters.action, undefined);
  assert.equal(filters.dateFrom, undefined);
  assert.equal(filters.page, 1);
  assert.equal(filters.order, "desc");
});

test("acepta las entidades auditables de IPC", () => {
  assert.equal(
    parseAuditFilters({ tabla: "ipc_indices" }).table,
    "ipc_indices",
  );
  assert.equal(
    parseAuditFilters({ tabla: "actualizaciones_ipc" }).table,
    "actualizaciones_ipc",
  );
});

test("calcula paginacion real sin superponer resultados", () => {
  assert.deepEqual(getAuditRange(1), { from: 0, to: AUDIT_PAGE_SIZE - 1 });
  assert.deepEqual(getAuditRange(2), {
    from: AUDIT_PAGE_SIZE,
    to: AUDIT_PAGE_SIZE * 2 - 1,
  });
});

test("genera limites diarios en la zona horaria de la aplicacion", () => {
  assert.equal(
    getDateBoundary("2026-07-13", "start"),
    "2026-07-13T00:00:00.000-03:00",
  );
  assert.equal(
    getDateBoundary("2026-07-13", "end"),
    "2026-07-13T23:59:59.999-03:00",
  );
});
