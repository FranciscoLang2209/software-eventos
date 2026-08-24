import assert from "node:assert/strict";
import test from "node:test";
import { buildReportesFinancieros } from "../reportes/financieros-calculos";
import {
  calculateMoneyFlow,
  calculatePaymentSummary,
  sumGuarantees,
  sumOrdinaryPayments,
  type PaymentMoneyRow,
} from "./calculos";

const ordinaryPayment: PaymentMoneyRow = {
  es_garantia: false,
  importe_en_pesos: 400,
};
const guarantee: PaymentMoneyRow = {
  es_garantia: true,
  importe_en_pesos: 250,
};

test("evento sin pagos conserva toda la deuda", () => {
  assert.deepEqual(calculatePaymentSummary({ payments: [], total: 1_000 }), {
    estadoCobro: "pendiente",
    garantiasRegistradas: 0,
    saldoPendiente: 1_000,
    totalCobrado: 0,
    totalEvento: 1_000,
  });
});

test("pago ordinario reduce el saldo pendiente", () => {
  const summary = calculatePaymentSummary({
    payments: [ordinaryPayment],
    total: 1_000,
  });

  assert.equal(summary.totalCobrado, 400);
  assert.equal(summary.saldoPendiente, 600);
  assert.equal(summary.estadoCobro, "parcial");
});

test("garantia se conserva separada sin reducir la deuda", () => {
  const summary = calculatePaymentSummary({
    payments: [guarantee],
    total: 1_000,
  });

  assert.equal(summary.garantiasRegistradas, 250);
  assert.equal(summary.totalCobrado, 0);
  assert.equal(summary.saldoPendiente, 1_000);
  assert.equal(summary.estadoCobro, "pendiente");
});

test("pago ordinario y garantia solo contabilizan el pago", () => {
  const summary = calculatePaymentSummary({
    payments: [ordinaryPayment, guarantee],
    total: 1_000,
  });

  assert.equal(summary.garantiasRegistradas, 250);
  assert.equal(summary.totalCobrado, 400);
  assert.equal(summary.saldoPendiente, 600);
});

test("garantia eliminada logicamente no participa en ningun total", () => {
  const deletedGuarantee = {
    ...guarantee,
    deleted_at: "2026-08-24T12:00:00.000Z",
  };

  assert.equal(sumGuarantees([deletedGuarantee]), 0);
  assert.equal(sumOrdinaryPayments([deletedGuarantee]), 0);
});

test("pago ordinario eliminado logicamente no reduce la deuda", () => {
  const summary = calculatePaymentSummary({
    payments: [
      {
        ...ordinaryPayment,
        deleted_at: "2026-08-24T12:00:00.000Z",
      },
    ],
    total: 1_000,
  });

  assert.equal(summary.totalCobrado, 0);
  assert.equal(summary.saldoPendiente, 1_000);
});

test("flujo de dinero excluye garantias de ingresos y saldo neto", () => {
  assert.deepEqual(
    calculateMoneyFlow({
      expenses: [{ importe_en_pesos: 125 }],
      payments: [ordinaryPayment, guarantee],
    }),
    {
      saldoNeto: 275,
      totalEgresos: 125,
      totalIngresos: 400,
    },
  );
});

test("detalle financiero, flujo y reporte usan el mismo ingreso ordinario", () => {
  const payments = [ordinaryPayment, guarantee];
  const detail = calculatePaymentSummary({ payments, total: 1_000 });
  const flow = calculateMoneyFlow({ expenses: [], payments });
  const report = buildReportesFinancieros({
    egresos: [],
    eventos: [
      {
        cliente: "Cliente",
        fecha_evento: "2026-09-01",
        id: "evento-1",
        nombre_evento: "Evento",
        salon: "Salon",
        salon_id: "salon-1",
        vendedor: "Vendedor",
        vendedor_id: "vendedor-1",
      },
    ],
    pagos: [
      {
        es_garantia: ordinaryPayment.es_garantia,
        evento_id: "evento-1",
        fecha_pago: "2026-08-01",
        importe_en_pesos: ordinaryPayment.importe_en_pesos,
      },
      {
        es_garantia: guarantee.es_garantia,
        evento_id: "evento-1",
        fecha_pago: "2026-08-02",
        importe_en_pesos: guarantee.importe_en_pesos,
      },
    ],
    resumenByEvento: new Map([
      [
        "evento-1",
        {
          id: "evento-1",
          saldo_catering: 0,
          saldo_servicios: 350,
          total_catering: 0,
          total_servicios: 1_000,
        },
      ],
    ]),
  });

  assert.equal(detail.totalCobrado, 400);
  assert.equal(flow.totalIngresos, detail.totalCobrado);
  assert.equal(report.metricas.ingresos_cobrados, detail.totalCobrado);
  assert.equal(report.metricas.garantias_registradas, 250);
  assert.equal(report.metricas.pendiente_cobro, detail.saldoPendiente);
  assert.equal(report.porEvento[0].pendiente_cobro, detail.saldoPendiente);
});
