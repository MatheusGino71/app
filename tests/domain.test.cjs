require("./register.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const d = require("../lib/domain.ts");
const { parsePurchaseCSV, csvCell } = require("../lib/csv.ts");
test("categorias respeitam os limites em euros, incluindo centavos", () => {
  for (const [amount, expected] of [[null, "SEM DADOS"], [-1, "SEM DADOS"], [NaN, "SEM DADOS"], [0, "EM DESENVOLVIMENTO"], [399.99, "EM DESENVOLVIMENTO"], [400, "ORIGIN"], [3999.99, "ORIGIN"], [4000, "SIGNATURE"], [8999.99, "SIGNATURE"], [9000, "ICON"], [50000, "ICON"]]) assert.equal(d.categoryFor(amount), expected);
});
test("capacidade considera o gargalo entre profissionais e postos", () => {
  for (const [n, expected] of [[0, 1], [1, 1], [2, 2], [3, 3], [4, 3], [5, 4], [7, 4], [8, 5], [20, 5]]) assert.equal(d.capacityFor(n, n), expected);
  assert.equal(d.capacityFor(8, 2), 2); assert.equal(d.capacityFor(2, 8), 2);
  assert.equal(d.capacityFor(null, 8), null); assert.equal(d.capacityFor(3, null), null); assert.equal(d.capacityFor(-1, 3), null); assert.equal(d.capacityFor(2.5, 8), null);
});
test("servidor recalcula capacidade e não altera categoria por estrelas", () => {
  const input = d.emptyDiagnostic(); input.annualPurchase = 400; input.source = "Relatório de teste"; input.professionals = 3; input.stations = 2;
  for (const key of d.DIMENSIONS) input.assessments[key] = { score: 5, evidence: "Evidência observada no teste." };
  const valid = d.parseDiagnostic(input); assert.equal(valid.assessments.capacidade.score, 2);
  const visit = d.makeVisit("s1", valid, { id: "u", name: "Teste" }, "v1", new Date().toISOString()); assert.equal(visit.category, "ORIGIN");
});
test("dados ausentes ficam pendentes; zero é um dado válido", () => {
  const input = d.emptyDiagnostic(); const result = d.parseDiagnostic(input); assert.equal(result.annualPurchase, null); assert.equal(result.assessments.tecnica.score, null); assert.equal(result.assessments.capacidade.score, null);
  input.annualPurchase = 0; input.source = "Relatório sem compras"; assert.equal(d.parseDiagnostic(input).annualPurchase, 0);
});
test("notas exigem evidência e compra exige fonte", () => {
  const input = d.emptyDiagnostic(); input.assessments.influencia.score = 4; assert.throws(() => d.parseDiagnostic(input), /Influência/);
  input.assessments.influencia.score = null; input.annualPurchase = 400; assert.throws(() => d.parseDiagnostic(input), /origem/);
});
test("validação recusa valores inválidos e acordos incompletos", () => {
  const input = d.emptyDiagnostic(); input.professionals = 1.5; assert.throws(() => d.parseDiagnostic(input));
  input.professionals = null; input.cutoff = "2026-02-30"; assert.throws(() => d.parseDiagnostic(input), /Data/);
  input.cutoff = "2026-11-15"; input.agreement.title = "Acompanhar teste"; assert.throws(() => d.parseDiagnostic(input), /objetivo/);
});
test("período anual mantém a data de corte inclusive e trata ano bissexto", () => {
  assert.equal(d.periodStart("2026-11-15"), "2025-11-16"); assert.equal(d.periodStart("2024-02-29"), "2023-03-01");
});
test("CSV aceita BOM, decimal local, aspas e CRLF, e rejeita cabeçalhos errados", () => {
  const rows = parsePurchaseCSV('\uFEFFsalao_id;compra_eur;pedidos;data_corte;fonte\r\ns1;4000,25;3;2026-11-15;"Grace Pro; relatório"\r\n');
  assert.equal(rows[0].annualPurchase, 4000.25); assert.equal(rows[0].source, "Grace Pro; relatório");
  assert.throws(() => parsePurchaseCSV("id;valor\ns1;4"), /Cabeçalho/); assert.throws(() => parsePurchaseCSV('salao_id;compra_eur;pedidos;data_corte;fonte\ns1;400;2;2026-11-15;"sem fim'), /aspas/);
});
test("exportação neutraliza fórmulas de planilhas", () => { assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"'); assert.equal(csvCell("Salão Aurora"), '"Salão Aurora"'); });
test("rascunho aceita campos incompletos e recusa estrutura corrompida", () => {
  const input = { salonId: "", version: 0, step: 3, salon: d.emptySalon(), diagnostic: d.emptyDiagnostic() };
  input.diagnostic.training = [{ brand: "BRAÉ", course: "", format: "" }]; assert.equal(d.parseDraft(input).diagnostic.training.length, 1);
  input.diagnostic.training = [null]; assert.throws(() => d.parseDraft(input), /Formato/);
});
