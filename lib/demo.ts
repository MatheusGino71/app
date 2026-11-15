import { actionFromVisit, emptyDiagnostic, makeVisit, type Diagnostic, type Salon, type User, type WorkspaceData } from "./domain";
export const DEMO_USER: User = { id: "demo", name: "Matheus", email: "demo@atelier.local", role: "admin" };
export function createDemoData(): WorkspaceData {
  const names = [["Pied de Poule", "Olena Kovalenko", "Varsóvia", "Polônia", "pied.de.poule"], ["Studio Aurora", "Anna Nowak", "Cracóvia", "Polônia", "studio.aurora"], ["Maison Lumière", "Sofia Martins", "Lisboa", "Portugal", "maison.lumiere"], ["Casa Alma", "Marta Silva", "Porto", "Portugal", "casa.alma"]];
  const salons: Salon[] = names.map(([name, contact, city, country, instagram], i) => ({ id: `demo-s${i}`, name, contact, city, country, instagram, nationality: i < 2 ? "Ucraniana" : "Portuguesa", language: i < 2 ? "Polonês" : "Português", environment: i === 3 ? "Bairro" : "Centro", ownerId: "demo", createdAt: "2026-10-01T12:00:00Z", version: i === 0 ? 2 : 1 }));
  const amounts = [12400, 4800, 950, 280];
  const visits = salons.map((s, i) => {
    const d: Diagnostic = emptyDiagnostic();
    Object.assign(d, { annualPurchase: amounts[i], orders: [18, 9, 4, 2][i], cutoff: "2026-11-15", source: "Dados fictícios para demonstração", professionals: [9, 5, 3, 2][i], stations: [8, 6, 4, 2][i], services: ["Coloração", "Tratamentos"], products: ["Tratamentos", "Shampoo / condicionador"], suppliers: 2, content: ["Trabalhos e resultados"], audience: "Ambos", recommends: i === 3 ? "Ninguém" : "Toda a equipe", routine: i === 0 ? "Três meses ou mais" : "Menos de um mês", measured: i === 0 ? "Medidos" : "Sem medir", retailBrands: ["BRAÉ"], retailProducts: ["Tratamentos"], protocol: "BRAÉ — protocolo de reconstrução", protocolEvidence: "Uso observado", appliedTraining: "Sim", technicalResult: "Aplicação observada durante a visita demonstrativa.", note: "Exemplo fictício. Nenhum dado comercial real." });
    d.brands = d.brands.map((b, index) => ({ ...b, purchased: index < 2, used: index < 2, references: index < 2 ? 8 - i : 0 }));
    d.training = [{ brand: "BRAÉ", course: "Protocolos de tratamento", format: "No salão" }];
    for (const key of ["sortimento", "influencia", "tecnica", "revenda", "compromisso"] as const) d.assessments[key] = { score: i === 3 ? null : Math.max(1, [4, 5, 5, 3, 4][["sortimento", "influencia", "tecnica", "revenda", "compromisso"].indexOf(key)] - i), evidence: i === 3 ? "" : "Evidência fictícia: resultado observado e registrado na visita de demonstração." };
    d.agreement = { title: ["Validar ampliação da linha de tratamentos", "Acompanhar aplicação dos protocolos", "Implantar registro de vendas ao consumidor", "Concluir primeiro diagnóstico"][i], responsible: "Matheus e " + s.contact, due: `2026-11-${20 + i}` };
    return makeVisit(s.id, d, DEMO_USER, `demo-v${i}`, `2026-11-${15 - i}T12:00:00Z`);
  });
  const old = structuredClone(visits[0].diagnostic); old.annualPurchase = 8600; old.cutoff = "2026-10-15"; old.agreement = { title: "", responsible: "", due: "" }; old.assessments.sortimento = { score: 3, evidence: "Necessidade e consumo verificados no diagnóstico fictício anterior." };
  visits.push(makeVisit(salons[0].id, old, DEMO_USER, "demo-v-old", "2026-10-15T12:00:00Z"));
  return { salons, visits, actions: visits.flatMap(v => { const a = actionFromVisit(v, "action-" + v.id); return a ? [a] : []; }), users: [DEMO_USER], draft: null };
}
