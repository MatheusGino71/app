require("./register.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { emptyDiagnostic, emptySalon, makeVisit } = require("../lib/domain.ts");
const { initialOnboardingDraft } = require("../lib/onboarding.ts");
const user = { id: "user", name: "Ana Teste", email: "ana@example.test", role: "comercial" };
test("primeiro diagnóstico preenche decisor e não exige nota qualitativa", () => {
  const draft = initialOnboardingDraft(user, null, null); assert.equal(draft.salon.contact, "Ana Teste"); assert.equal(draft.salonId, ""); assert.equal(draft.diagnostic.annualPurchase, null); assert.equal(draft.diagnostic.assessments.tecnica.score, null);
});
test("retomada usa apenas rascunho do próprio perfil e preserva etapa", () => {
  const draft = initialOnboardingDraft(user, null, null); draft.step = 4; draft.salon.name = "Rascunho";
  assert.equal(initialOnboardingDraft(user, null, draft).step, 4);
  assert.equal(initialOnboardingDraft(user, null, { ...draft, salonId: "outro-salao" }).salonId, "");
});
test("atualização mantém identidade e versão, mas exige nova compra e nova evidência", () => {
  const salon = { ...emptySalon(), name: "Salão", id: "salon", ownerId: user.id, version: 2, createdAt: "2026-11-01T12:00:00Z" };
  const d = emptyDiagnostic(); d.annualPurchase = 9000; d.assessments.tecnica = { score: 5, evidence: "Histórico anterior" }; d.brands[0].purchased = true; d.brands[0].references = 7;
  const profile = { salon, visit: makeVisit(salon.id, d, user, "visit", "2026-11-01T12:00:00Z") };
  const draft = initialOnboardingDraft(user, profile, null); assert.equal(draft.salonId, "salon"); assert.equal(draft.version, 2); assert.equal(draft.diagnostic.annualPurchase, null); assert.equal(draft.diagnostic.assessments.tecnica.score, null); assert.equal(draft.diagnostic.brands[0].references, null);
  assert.equal(profile.visit.diagnostic.annualPurchase, 9000);
});
