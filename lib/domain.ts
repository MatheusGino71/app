export const RULE_VERSION = "grace-pro-2026.11-v1";
export const DIMENSIONS = ["sortimento", "influencia", "tecnica", "revenda", "capacidade", "compromisso"] as const;
export type Dimension = typeof DIMENSIONS[number];
export const LABELS: Record<Dimension, string> = { sortimento: "Sortimento", influencia: "Influência", tecnica: "Técnica", revenda: "Revenda", capacidade: "Capacidade", compromisso: "Compromisso" };
export const CRITERIA: Record<Dimension, readonly string[]> = {
  sortimento: ["Sem ampliação viável identificada", "Ampliação compatível a verificar", "Necessidade e consumo verificados", "Ampliação quantificada e viável", "Ampliação validada por teste ou histórico comparável"],
  influencia: ["Sem influência verificada", "Reconhecimento local", "Conteúdo com resposta de público relevante", "Gera consultas ou contatos qualificados", "Repete resultados de influência"],
  tecnica: ["Aplicação incorreta", "Aplica com ajuda", "Aplica corretamente e sem ajuda", "Equipe reproduz resultados consistentes", "Ensina e outros reproduzem o método"],
  revenda: ["Não recomenda nem vende", "Recomendação e venda pontuais", "Recomenda por serviço e registra vendas", "Rotina comum da equipe", "Rotina estável com resultados medidos"],
  capacidade: ["0 ou 1 profissional/posto disponível", "2 profissionais/postos disponíveis", "3 ou 4 profissionais/postos disponíveis", "5 a 7 profissionais/postos disponíveis", "8 ou mais profissionais/postos disponíveis"],
  compromisso: ["Recusa ou descumprimentos não resolvidos", "Interesse sem compromissos", "Responsável, objetivo e prazo acordados", "Cumpre acordos e compartilha resultados", "Cumprimento e dados em vários ciclos"],
};
export type Category = "ORIGIN" | "SIGNATURE" | "ICON" | "EM DESENVOLVIMENTO" | "SEM DADOS";
export function categoryFor(amount: number | null): Category {
  if (amount === null || !Number.isFinite(amount) || amount < 0) return "SEM DADOS";
  for (let i = PURCHASE_LEVELS.length - 1; i >= 0; i--) if (amount >= PURCHASE_LEVELS[i].minimum) return PURCHASE_LEVELS[i].name;
  return "EM DESENVOLVIMENTO";
}
export function capacityFor(professionals: number | null, stations: number | null): number | null {
  if (professionals === null || stations === null || !Number.isInteger(professionals) || !Number.isInteger(stations) || professionals < 0 || stations < 0) return null;
  const n = Math.min(professionals, stations);
  return n >= 8 ? 5 : n >= 5 ? 4 : n >= 3 ? 3 : n === 2 ? 2 : 1;
}
export type Role = "admin" | "gestor" | "comercial" | "cliente";
export type User = { id: string; name: string; email: string; role: Role; emailVerified?: boolean };
export type PurchaseReview = { id: string; salonId: string; visitId: string; annualPurchase: number; orders: number | null; cutoff: string; source: string; status: "pending" | "approved" | "rejected"; note: string; reviewedBy: string | null; reviewedAt: string | null };
export type SalonFields = { name: string; contact: string; instagram: string; country: string; city: string; nationality: string; language: string; environment: string };
export type Salon = SalonFields & { id: string; ownerId: string; createdAt: string; version: number };
export type Assessment = { score: number | null; evidence: string };
export type Brand = { name: string; purchased: boolean | null; references: number | null; used: boolean | null };
export type Training = { brand: string; course: string; format: string };
export type Diagnostic = {
  annualPurchase: number | null; orders: number | null; cutoff: string; source: string;
  brands: Brand[]; services: string[]; products: string[]; suppliers: number | null;
  competitors: { brand: string; category: string }[];
  content: string[]; audience: string; influenceEvidence: string;
  training: Training[]; noTraining: boolean; protocol: string; protocolEvidence: string; appliedTraining: string; technicalResult: string;
  retailBrands: string[]; retailProducts: string[]; recommends: string; routine: string; measured: string; retailEvidence: string;
  professionals: number | null; stations: number | null;
  assessments: Record<Dimension, Assessment>;
  agreement: { title: string; responsible: string; due: string }; note: string;
};
export type Visit = { id: string; salonId: string; createdAt: string; authorId: string; author: string; ruleVersion: string; diagnostic: Diagnostic; category: Category; kind: "visit" | "import" };
export type CommercialAction = { id: string; salonId: string; visitId: string; title: string; responsible: string; due: string; status: "pending" | "done"; result: string; completedAt: string | null; version: number };
export type Draft = { salonId: string; version: number; salon: SalonFields; diagnostic: Diagnostic; step: number };
export type WorkspaceData = { salons: Salon[]; visits: Visit[]; actions: CommercialAction[]; users: User[]; draft: Draft | null; reviews?: PurchaseReview[]; campaignEntries?: import("./campaigns").CampaignEntry[] };
export type OnboardingProfile = { salon: Salon; visit: Visit; review?: PurchaseReview | null; official?: PurchaseReview | null };
export function profileLevel(profile: OnboardingProfile) {
  const purchase = profile.official ?? (profile.review?.status === "approved" ? profile.review : null);
  return { category: categoryFor(purchase ? purchase.annualPurchase : profile.visit.diagnostic.annualPurchase), amount: purchase ? purchase.annualPurchase : profile.visit.diagnostic.annualPurchase, cutoff: purchase?.cutoff ?? profile.visit.diagnostic.cutoff, confirmed: !!purchase, pending: profile.review?.status === "pending", source: purchase?.source ?? profile.visit.diagnostic.source };
}
export const PURCHASE_LEVELS = [
  { name: "ORIGIN", minimum: 400, maximum: 4000, description: "O ponto de partida da sua relação com a Grace Pro. Uma compra atual menor também pode revelar espaço para crescer." },
  { name: "SIGNATURE", minimum: 4000, maximum: 9000, description: "Uma presença intermediária de compra. O diagnóstico ajuda a entender o que já faz parte da rotina e onde ampliar a relação." },
  { name: "ICON", minimum: 9000, maximum: null, description: "O maior nível de compra atual. O perfil valoriza o negócio que o salão representa e a continuidade dessa relação." },
] as const;
export const BRANDS = ["BRAÉ", "Dr. Sorbie", "Tempting"];
export const SERVICES = ["Coloração", "Tratamentos", "Corte e penteado", "Couro cabeludo", "Outros"];
export const PRODUCTS = ["Coloração / oxidantes", "Descoloração", "Tratamentos", "Shampoo / condicionador", "Styling", "Couro cabeludo", "Outros"];
export const RETAIL_PRODUCTS = ["Shampoo / condicionador", "Tratamentos", "Styling", "Couro cabeludo", "Outros"];
export const emptySalon = (): SalonFields => ({ name: "", contact: "", instagram: "", country: "", city: "", nationality: "", language: "", environment: "" });
export function emptyDiagnostic(): Diagnostic {
  return {
    annualPurchase: null, orders: null, cutoff: new Date().toISOString().slice(0, 10), source: "",
    brands: BRANDS.map(name => ({ name, purchased: null, references: null, used: null })), services: [], products: [], suppliers: null, competitors: [],
    content: [], audience: "", influenceEvidence: "", training: [], noTraining: false, protocol: "", protocolEvidence: "", appliedTraining: "", technicalResult: "",
    retailBrands: [], retailProducts: [], recommends: "", routine: "", measured: "", retailEvidence: "", professionals: null, stations: null,
    assessments: Object.fromEntries(DIMENSIONS.map(key => [key, { score: null, evidence: "" }])) as Record<Dimension, Assessment>,
    agreement: { title: "", responsible: "", due: "" }, note: "",
  };
}
export function normalizeDiagnostic(d: Diagnostic): Diagnostic {
  const result = structuredClone(d);
  result.assessments.capacidade = { score: capacityFor(d.professionals, d.stations), evidence: d.professionals === null || d.stations === null ? "" : `N = min(${d.professionals} profissionais, ${d.stations} postos) = ${Math.min(d.professionals, d.stations)}. Capacidade operacional disponível.` };
  return result;
}
export function latestVisit(data: Pick<WorkspaceData, "visits">, salonId: string) { return data.visits.find(v => v.salonId === salonId); }
export const money = (value: number | null) => value === null ? "Sem dados" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(value);
export const dateLabel = (value: string) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value.length === 10 ? value + "T12:00:00Z" : value)) : "—";
export function periodStart(cutoff: string) {
  const date = new Date(cutoff + "T12:00:00Z");
  const day = date.getUTCDate(); date.setUTCDate(1); date.setUTCFullYear(date.getUTCFullYear() - 1);
  const maxDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, maxDay)); date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
export function suggestions(d: Diagnostic): string[] {
  const result: string[] = [];
  if (d.assessments.tecnica.score !== null && d.assessments.tecnica.score < 3) result.push("Combinar formação prática e verificar a aplicação dos protocolos.");
  if (d.assessments.sortimento.score !== null && d.assessments.sortimento.score >= 3) result.push("Quantificar a ampliação do sortimento e combinar um teste acompanhado.");
  if (d.recommends && d.recommends !== "Ninguém" && d.measured !== "Medidos") result.push("Definir registro de vendas ao consumidor e acompanhar a rotina de recomendação.");
  if (d.assessments.influencia.score !== null && d.assessments.influencia.score >= 4) result.push("Planejar uma colaboração com objetivo e resposta do público mensuráveis.");
  if (!result.length) result.push("Completar evidências do diagnóstico e combinar o próximo acompanhamento.");
  return result;
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Formato de dados inválido.");
  return value as Record<string, unknown>;
}
function string(value: unknown, name: string, max = 4000): string {
  if (typeof value !== "string" || value.length > max) throw new Error(`Campo inválido: ${name}.`);
  return value.trim();
}
function number(value: unknown, name: string, integer = false): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1e9 || (integer && !Number.isInteger(value))) throw new Error(`Número inválido: ${name}.`);
  return value;
}
function array<T>(value: unknown, parse: (v: unknown) => T, max = 40): T[] {
  if (!Array.isArray(value) || value.length > max) throw new Error("Lista inválida ou muito extensa.");
  return value.map(parse);
}
function bool(value: unknown): boolean | null {
  if (value === null || typeof value === "boolean") return value;
  throw new Error("Resposta inválida.");
}
function choice(value: unknown, options: readonly string[], name: string) {
  const v = string(value, name, 100); if (v && !options.includes(v)) throw new Error(`Opção inválida: ${name}.`); return v;
}
export function validDate(value: unknown, name: string, optional = false) {
  const v = string(value, name, 10);
  if (optional && !v) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0, 10) !== v) throw new Error(`Data inválida: ${name}.`);
  return v;
}
export function parseSalon(value: unknown): SalonFields {
  const v = object(value); const result = emptySalon();
  for (const key of Object.keys(result) as (keyof SalonFields)[]) result[key] = string(v[key], key, 200);
  if (!result.name || !result.contact || !result.country || !result.city) throw new Error("Informe salão, responsável, país e cidade.");
  return result;
}
export function parseDiagnostic(value: unknown): Diagnostic {
  const v = object(value); const d = emptyDiagnostic();
  for (const key of ["source", "influenceEvidence", "protocol", "technicalResult", "retailEvidence", "note"] as const) d[key] = string(v[key], key);
  d.annualPurchase = number(v.annualPurchase, "compra anual");
  if (d.annualPurchase !== null && Math.abs(d.annualPurchase * 100 - Math.round(d.annualPurchase * 100)) > 0.00001) throw new Error("Use até duas casas decimais na compra.");
  for (const key of ["orders", "suppliers", "professionals", "stations"] as const) d[key] = number(v[key], key, true);
  d.cutoff = validDate(v.cutoff, "data de corte");
  if (d.cutoff > new Date().toISOString().slice(0, 10)) throw new Error("A data de corte não pode estar no futuro.");
  if (d.annualPurchase !== null && !d.source) throw new Error("Informe a origem dos dados de compra.");
  d.brands = array(v.brands, row => { const b = object(row); return { name: choice(b.name, BRANDS, "marca"), purchased: bool(b.purchased), used: bool(b.used), references: number(b.references, "referências", true) }; }, 3);
  if (d.brands.length !== 3 || new Set(d.brands.map(b => b.name)).size !== 3 || d.brands.some(b => !BRANDS.includes(b.name))) throw new Error("Informe as três marcas Grace Pro.");
  for (const [key, options] of [["services", SERVICES], ["products", PRODUCTS], ["retailProducts", RETAIL_PRODUCTS], ["retailBrands", [...BRANDS, "Outras"]], ["content", ["Trabalhos e resultados", "Explicação técnica", "Serviços / produtos", "Outros", "Não publica"]]] as const) d[key] = array(v[key], item => choice(item, options, key));
  if (d.content.includes("Não publica") && d.content.length > 1) throw new Error("Revise o conteúdo: não publica não pode coexistir com tipos de publicação.");
  d.competitors = array(v.competitors, row => { const b = object(row); return { brand: string(b.brand, "marca", 200), category: string(b.category, "categoria", 200) }; });
  d.training = array(v.training, row => { const t = object(row); return { brand: string(t.brand, "marca", 200), course: string(t.course, "curso", 500), format: choice(t.format, ["Online", "No salão", "Evento"], "formato") }; });
  if (d.competitors.some(r => !r.brand || !r.category)) throw new Error("Complete marca e categoria das outras marcas ou remova a linha.");
  if (d.training.some(r => !r.brand || !r.course || !r.format)) throw new Error("Complete marca, curso e formato da formação ou remova a linha.");
  if (d.brands.some(b => b.purchased === false && b.references !== null && b.references > 0)) throw new Error("Uma marca sem compras no período não pode ter referências compradas.");
  if (typeof v.noTraining !== "boolean") throw new Error("Formação inválida.");
  d.noTraining = v.noTraining;
  if (d.noTraining && d.training.length) throw new Error("Revise a formação: há cursos e a opção sem cursos está marcada.");
  d.audience = choice(v.audience, ["Consumidores", "Profissionais", "Ambos", "Sem resposta relevante comprovada"], "público");
  d.protocolEvidence = choice(v.protocolEvidence, ["Uso observado", "Declarado pelo salão", "Não aplica nossos protocolos"], "protocolo");
  d.appliedTraining = choice(v.appliedTraining, ["Sim", "Não", "Não recebeu formação"], "aplicação da formação");
  d.recommends = choice(v.recommends, ["Toda a equipe", "Alguns profissionais", "Só o proprietário", "Ninguém"], "recomendação");
  d.routine = choice(v.routine, ["Não existe", "Menos de um mês", "Entre um e dois meses", "Três meses ou mais"], "rotina");
  d.measured = choice(v.measured, ["Medidos", "Sem medir"], "resultados");
  const scores = object(v.assessments);
  for (const key of DIMENSIONS) {
    if (key === "capacidade") continue;
    const a = object(scores[key]); const score = number(a.score, key, true); const evidence = string(a.evidence, key);
    if (score !== null && (score < 1 || score > 5)) throw new Error(`Nota inválida: ${LABELS[key]}.`);
    if (score !== null && evidence.length < 8) throw new Error(`Registre uma evidência ou justificativa para ${LABELS[key]}.`);
    d.assessments[key] = { score, evidence };
  }
  const agreement = object(v.agreement);
  d.agreement = { title: string(agreement.title, "objetivo", 500), responsible: string(agreement.responsible, "responsável", 200), due: validDate(agreement.due, "prazo", true) };
  if (Object.values(d.agreement).some(Boolean) && !Object.values(d.agreement).every(Boolean)) throw new Error("Complete objetivo, responsável e prazo do acordo.");
  return normalizeDiagnostic(d);
}
export function parseDraft(value: unknown): Draft {
  const v = object(value); const s = object(v.salon); const raw = object(v.diagnostic);
  const salon = emptySalon(); for (const key of Object.keys(salon) as (keyof SalonFields)[]) salon[key] = string(s[key], key, 200);
  const d = emptyDiagnostic();
  for (const key of ["source", "influenceEvidence", "protocol", "technicalResult", "retailEvidence", "note", "audience", "protocolEvidence", "appliedTraining", "recommends", "routine", "measured"] as const) d[key] = string(raw[key], key);
  d.cutoff = validDate(raw.cutoff, "data de corte", true);
  d.annualPurchase = number(raw.annualPurchase, "compra anual");
  for (const key of ["orders", "suppliers", "professionals", "stations"] as const) d[key] = number(raw[key], key);
  if (typeof raw.noTraining !== "boolean") throw new Error("Formação inválida no rascunho."); d.noTraining = raw.noTraining;
  for (const key of ["services", "products", "content", "retailBrands", "retailProducts"] as const) d[key] = array(raw[key], item => string(item, key, 200));
  d.brands = array(raw.brands, row => { const b = object(row); return { name: choice(b.name, BRANDS, "marca"), purchased: bool(b.purchased), used: bool(b.used), references: number(b.references, "referências") }; }, 3);
  if (d.brands.length !== 3 || new Set(d.brands.map(b => b.name)).size !== 3 || d.brands.some(b => !BRANDS.includes(b.name))) throw new Error("Marcas inválidas no rascunho.");
  d.competitors = array(raw.competitors, row => { const b = object(row); return { brand: string(b.brand, "marca", 200), category: string(b.category, "categoria", 200) }; });
  d.training = array(raw.training, row => { const t = object(row); return { brand: string(t.brand, "marca", 200), course: string(t.course, "curso", 500), format: string(t.format, "formato", 100) }; });
  const scores = object(raw.assessments);
  for (const key of DIMENSIONS) { const a = object(scores[key]); const score = number(a.score, key, true); if (score !== null && (score < 1 || score > 5)) throw new Error("Nota inválida no rascunho."); d.assessments[key] = { score, evidence: string(a.evidence, key) }; }
  const agreement = object(raw.agreement); d.agreement = { title: string(agreement.title, "objetivo", 500), responsible: string(agreement.responsible, "responsável", 200), due: validDate(agreement.due, "prazo", true) };
  const step = number(v.step, "etapa", true); const version = number(v.version, "versão", true);
  if (step === null || step > 6 || version === null) throw new Error("Etapa ou versão inválida no rascunho.");
  return { salonId: string(v.salonId, "salão", 100), version, step, salon, diagnostic: d };
}
export function makeVisit(salonId: string, diagnostic: Diagnostic, author: User, id: string, now: string, kind: Visit["kind"] = "visit"): Visit {
  const d = normalizeDiagnostic(diagnostic);
  return { id, salonId, createdAt: now, authorId: author.id, author: author.name, ruleVersion: RULE_VERSION, diagnostic: d, category: categoryFor(d.annualPurchase), kind };
}
export function actionFromVisit(visit: Visit, id: string): CommercialAction | null {
  const a = visit.diagnostic.agreement;
  return a.title ? { id, salonId: visit.salonId, visitId: visit.id, title: a.title, responsible: a.responsible, due: a.due, status: "pending", result: "", completedAt: null, version: 1 } : null;
}
