import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { resolve } from "node:path";
import { openDatabase, type Row, type SQL } from "./database";
import { actionFromVisit, emptyDiagnostic, makeVisit, parseDiagnostic, parseDraft, parseSalon, validDate, type CommercialAction, type Draft, type OnboardingProfile, type PurchaseReview, type Role, type Salon, type User, type Visit, type WorkspaceData } from "../domain";
export class AppError extends Error { constructor(message: string, public status = 400) { super(message); } }
const hash = (v: string) => createHash("sha256").update(v).digest("hex");
const passwordHash = (v: string) => { const salt = randomBytes(16).toString("hex"); return salt + ":" + scryptSync(v, salt, 64).toString("hex"); };
const matches = (v: string, stored: string) => { const [salt, digest] = stored.split(":"); const actual = scryptSync(v, salt, 64); const expected = Buffer.from(digest, "hex"); return actual.length === expected.length && timingSafeEqual(actual, expected); };
const text = (v: unknown, max = 4000) => { if (typeof v !== "string" || v.length > max) throw new AppError("Texto inválido."); return v.trim(); };
const record = (v: unknown): Row => { if (!v || typeof v !== "object" || Array.isArray(v)) throw new AppError("Formato inválido."); return v as Row; };
const emailOf = (v: unknown) => { const email = text(v, 254).toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError("Informe um e-mail válido."); return email; };
const passwordOf = (v: unknown) => { if (typeof v !== "string" || v.length < 10 || v.length > 128) throw new AppError("Use uma senha entre 10 e 128 caracteres."); return v; };
const json = <T>(row: Row): T => JSON.parse(String(row.data));
const safeUser = (r: Row): User => ({ id: String(r.id), name: String(r.name), email: String(r.email), role: r.customer_id ? "cliente" : r.role as Role, emailVerified: !!r.verified_at });
const USER_SELECT = "SELECT u.*, c.user_id AS customer_id, e.verified_at FROM users u LEFT JOIN customer_accounts c ON c.user_id=u.id LEFT JOIN email_status e ON e.user_id=u.id";
export function requireStaff(user: User) { if (user.role === "cliente") throw new AppError("Este recurso pertence à equipe Grace Pro.", 403); }
export async function createStore(path: string, authToken?: string) {
  const db = openDatabase(path, authToken);
  // Additive migrations preserve existing accounts, passwords and all historical diagnostics.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, role TEXT NOT NULL CHECK(role IN ('admin','gestor','comercial')), password TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS customer_accounts (user_id TEXT PRIMARY KEY REFERENCES users(id));
    CREATE TABLE IF NOT EXISTS email_status (user_id TEXT PRIMARY KEY REFERENCES users(id), verified_at TEXT);
    CREATE TABLE IF NOT EXISTS email_tokens (token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), purpose TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS invitations (token TEXT PRIMARY KEY, email TEXT NOT NULL, role TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS resets (token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS attempts (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS salons (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), version INTEGER NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS visits (id TEXT PRIMARY KEY, salon_id TEXT NOT NULL REFERENCES salons(id), created_at TEXT NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS actions (id TEXT PRIMARY KEY, salon_id TEXT NOT NULL REFERENCES salons(id), visit_id TEXT NOT NULL REFERENCES visits(id), version INTEGER NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS drafts (user_id TEXT PRIMARY KEY REFERENCES users(id), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS account_profiles (user_id TEXT PRIMARY KEY REFERENCES users(id), salon_id TEXT NOT NULL UNIQUE REFERENCES salons(id));
    CREATE TABLE IF NOT EXISTS purchase_reviews (id TEXT PRIMARY KEY, salon_id TEXT NOT NULL REFERENCES salons(id), visit_id TEXT NOT NULL UNIQUE REFERENCES visits(id), status TEXT NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), event TEXT NOT NULL, entity_id TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS evidence_files (id TEXT PRIMARY KEY, salon_id TEXT NOT NULL REFERENCES salons(id), user_id TEXT NOT NULL REFERENCES users(id), name TEXT NOT NULL, mime TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS visits_salon ON visits(salon_id, created_at);
    CREATE INDEX IF NOT EXISTS salons_owner ON salons(owner_id);
    CREATE INDEX IF NOT EXISTS reviews_status ON purchase_reviews(status);`);
  const audit = (q: SQL, user: User, event: string, id: string) => q.run("INSERT INTO audit VALUES (?,?,?,?,?)", randomUUID(), user.id, event, id, new Date().toISOString());
  const userById = async (id: string, q: SQL = db) => { const row = await q.get(USER_SELECT + " WHERE u.id=?", id); return row ? safeUser(row) : null; };
  function admin(user: User) { if (user.role !== "admin") throw new AppError("Acesso restrito à administração.", 403); }
  async function salonFor(user: User, id: string, q: SQL = db): Promise<Salon> {
    requireStaff(user); const row = await q.get("SELECT * FROM salons WHERE id=?", id);
    if (!row || user.role === "comercial" && row.owner_id !== user.id) throw new AppError("Salão não encontrado na sua carteira.", 404);
    return json<Salon>(row);
  }
  async function personalSalon(user: User, id: string, q: SQL = db) {
    const link = await q.get("SELECT salon_id FROM account_profiles WHERE user_id=? AND salon_id=?", user.id, id);
    if (!link) throw new AppError("Salão não encontrado na sua conta.", 404);
    return json<Salon>((await q.get("SELECT * FROM salons WHERE id=?", id))!);
  }
  async function draftFor(user: User): Promise<Draft | null> { const r = await db.get("SELECT * FROM drafts WHERE user_id=?", user.id); return r ? json<Draft>(r) : null; }
  async function onboardingProfile(user: User, q: SQL = db): Promise<OnboardingProfile | null> {
    const link = await q.get("SELECT salon_id FROM account_profiles WHERE user_id=?", user.id); if (!link) return null;
    const id = String(link.salon_id); const salon = await q.get("SELECT * FROM salons WHERE id=?", id);
    const visit = await q.get("SELECT * FROM visits WHERE salon_id=? ORDER BY created_at DESC,rowid DESC LIMIT 1", id);
    if (!salon || !visit) return null;
    const v = json<Visit>(visit); const review = await q.get("SELECT * FROM purchase_reviews WHERE visit_id=?", v.id);
    const official = await q.get("SELECT * FROM purchase_reviews WHERE salon_id=? AND status='approved' ORDER BY rowid DESC LIMIT 1", id);
    return { salon: json<Salon>(salon), visit: v, review: review ? json<PurchaseReview>(review) : null, official: official ? json<PurchaseReview>(official) : null };
  }
  async function insertVisit(q: SQL, visit: Visit, user: User, pending: boolean) {
    for (const row of await q.all("SELECT * FROM purchase_reviews WHERE salon_id=? AND status='pending'", visit.salonId)) {
      const previous = json<PurchaseReview>(row); previous.status = "rejected"; previous.note = "Substituído por um diagnóstico mais recente.";
      await q.run("UPDATE purchase_reviews SET status='rejected',data=? WHERE id=?", JSON.stringify(previous), previous.id);
    }
    await q.run("INSERT INTO visits VALUES (?,?,?,?)", visit.id, visit.salonId, visit.createdAt, JSON.stringify(visit));
    const action = actionFromVisit(visit, randomUUID()); if (action) await q.run("INSERT INTO actions VALUES (?,?,?,?,?)", action.id, action.salonId, action.visitId, action.version, JSON.stringify(action));
    if (visit.diagnostic.annualPurchase !== null) {
      const review: PurchaseReview = { id: randomUUID(), salonId: visit.salonId, visitId: visit.id, annualPurchase: visit.diagnostic.annualPurchase, orders: visit.diagnostic.orders, cutoff: visit.diagnostic.cutoff, source: visit.diagnostic.source, status: pending ? "pending" : "approved", note: "", reviewedBy: pending ? null : user.name, reviewedAt: pending ? null : visit.createdAt };
      await q.run("INSERT INTO purchase_reviews VALUES (?,?,?,?,?)", review.id, review.salonId, review.visitId, review.status, JSON.stringify(review));
    }
  }
  const hasAdmins = async (q: SQL = db) => !!await q.get("SELECT id FROM users WHERE role='admin' LIMIT 1");
  async function issueToken(userId: string, purpose: string) { const code = randomBytes(32).toString("hex"); await db.transaction(async q => { await q.run("DELETE FROM email_tokens WHERE user_id=? AND purpose=?", userId, purpose); await q.run("INSERT INTO email_tokens VALUES (?,?,?,?)", hash(code), userId, purpose, Date.now() + (purpose === "verify" ? 24 : 1) * 3600_000); }); return code; }
  return {
    db, close: () => db.close(), hasAdmins, hasUsers: async () => !!await db.get("SELECT id FROM users LIMIT 1"), draftFor, onboardingProfile,
    async rateLimit(key: string, limit = 12) { await db.transaction(async q => { const now = Date.now(); const k = hash(key); await q.run("DELETE FROM attempts WHERE expires<?", now); const row = await q.get("SELECT * FROM attempts WHERE key=?", k); if (row && Number(row.count) >= limit) throw new AppError("Muitas tentativas. Aguarde 15 minutos.", 429); await q.run("INSERT INTO attempts VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1", k, now + 15 * 60_000); }); },
    async signup(input: unknown): Promise<User> {
      const v = record(input); const email = emailOf(v.email); const name = text(v.name, 120); if (name.length < 2) throw new AppError("Informe seu nome completo."); const digest = passwordHash(passwordOf(v.password));
      return db.transaction(async q => {
        const staff = v.kind === "staff"; let role: Role = "cliente";
        if (staff) {
          const code = text(v.code ?? "", 256);
          if (!await hasAdmins(q)) { const setup = process.env.ATELIER_SETUP_TOKEN; if (!setup || hash(code) !== hash(setup)) throw new AppError("Código de configuração inválido. A primeira conta da equipe exige o código do servidor.", 403); role = "admin"; }
          else { const invite = await q.get("SELECT * FROM invitations WHERE token=? AND email=? AND expires>?", hash(code), email, Date.now()); if (!invite) throw new AppError("Solicite à administração um convite válido para este e-mail.", 403); role = invite.role as Role; await q.run("DELETE FROM invitations WHERE token=?", hash(code)); }
        }
        if (await q.get("SELECT id FROM users WHERE email=?", email)) throw new AppError("Não foi possível criar a conta. Se já possui cadastro, recupere o acesso.", 409);
        const user: User = { id: randomUUID(), name, email, role, emailVerified: false };
        await q.run("INSERT INTO users VALUES (?,?,?,?,?)", user.id, name, email, role === "cliente" ? "comercial" : role, digest);
        if (role === "cliente") await q.run("INSERT INTO customer_accounts VALUES (?)", user.id);
        await q.run("INSERT INTO email_status VALUES (?,NULL)", user.id); await audit(q, user, "account.created", user.id); return user;
      });
    },
    async login(input: unknown): Promise<User> { const v = record(input); const email = emailOf(v.email); const password = typeof v.password === "string" && v.password.length <= 128 ? v.password : ""; const row = await db.get(USER_SELECT + " WHERE u.email=?", email); const correct = matches(password, row ? String(row.password) : "00000000000000000000000000000000:" + "00".repeat(64)); if (!row || !correct) throw new AppError("E-mail ou senha incorretos.", 401); return safeUser(row); },
    async createSession(user: User, remember: boolean) { const token = randomBytes(32).toString("hex"); const maxAge = remember ? 30 * 86400 : 12 * 3600; await db.run("DELETE FROM sessions WHERE expires<?", Date.now()); await db.run("INSERT INTO sessions VALUES (?,?,?)", hash(token), user.id, Date.now() + maxAge * 1000); return { token, maxAge }; },
    async session(token: string | undefined): Promise<User | null> { if (!token || !/^[a-f0-9]{64}$/.test(token)) return null; const row = await db.get("SELECT user_id FROM sessions WHERE token=? AND expires>?", hash(token), Date.now()); return row ? userById(String(row.user_id)) : null; },
    async logout(token: string) { await db.run("DELETE FROM sessions WHERE token=?", hash(token)); },
    async verification(user: User) { const current = await userById(user.id); if (!current || current.emailVerified) return null; return { user: current, code: await issueToken(user.id, "verify") }; },
    async recovery(emailValue: unknown) { const email = emailOf(emailValue); const row = await db.get(USER_SELECT + " WHERE u.email=?", email); if (!row) return null; const user = safeUser(row); return { user, code: await issueToken(user.id, "reset") }; },
    async verifyEmail(codeValue: unknown) { const code = text(codeValue, 256); return db.transaction(async q => { const row = await q.get("SELECT * FROM email_tokens WHERE token=? AND purpose='verify' AND expires>?", hash(code), Date.now()); if (!row) throw new AppError("Link de confirmação inválido ou expirado."); const now = new Date().toISOString(); await q.run("INSERT INTO email_status VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET verified_at=excluded.verified_at", String(row.user_id), now); await q.run("DELETE FROM email_tokens WHERE user_id=? AND purpose='verify'", String(row.user_id)); }); },
    async invite(user: User, input: unknown) { admin(user); const v = record(input); const email = emailOf(v.email); const role = text(v.role); if (!["admin", "gestor", "comercial"].includes(role)) throw new AppError("Papel inválido."); if (await db.get("SELECT id FROM users WHERE email=?", email)) throw new AppError("Este e-mail já possui uma conta."); const code = randomBytes(24).toString("hex"); await db.transaction(async q => { await q.run("DELETE FROM invitations WHERE email=?", email); await q.run("INSERT INTO invitations VALUES (?,?,?,?)", hash(code), email, role, Date.now() + 7 * 86400_000); await audit(q, user, "invitation.created", email); }); return { code, email, role, expiresIn: "7 dias" }; },
    async resetCode(user: User, userId: string) { admin(user); if (!await userById(userId)) throw new AppError("Usuário não encontrado.", 404); const code = randomBytes(24).toString("hex"); await db.transaction(async q => { await q.run("DELETE FROM resets WHERE user_id=?", userId); await q.run("INSERT INTO resets VALUES (?,?,?)", hash(code), userId, Date.now() + 3600_000); await audit(q, user, "password.reset-issued", userId); }); return { code, expiresIn: "1 hora" }; },
    async resetPassword(input: unknown) {
      const v = record(input); const email = emailOf(v.email); const code = text(v.code, 256); const digest = passwordHash(passwordOf(v.password));
      await db.transaction(async q => { const u = await q.get(USER_SELECT + " WHERE u.email=?", email); if (!u) throw new AppError("Código inválido ou expirado."); const manual = await q.get("SELECT * FROM resets WHERE token=? AND user_id=? AND expires>?", hash(code), String(u.id), Date.now()); const mailed = await q.get("SELECT * FROM email_tokens WHERE token=? AND user_id=? AND purpose='reset' AND expires>?", hash(code), String(u.id), Date.now()); if (!manual && !mailed) throw new AppError("Código inválido ou expirado."); await q.run("UPDATE users SET password=? WHERE id=?", digest, String(u.id)); await q.run("DELETE FROM resets WHERE user_id=?", String(u.id)); await q.run("DELETE FROM email_tokens WHERE user_id=? AND purpose='reset'", String(u.id)); await q.run("DELETE FROM sessions WHERE user_id=?", String(u.id)); if (mailed) await q.run("INSERT INTO email_status VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET verified_at=excluded.verified_at", String(u.id), new Date().toISOString()); await audit(q, safeUser(u), "password.changed", String(u.id)); });
    },
    async snapshot(user: User): Promise<WorkspaceData> {
      requireStaff(user); const salons = (await db.all("SELECT * FROM salons WHERE (?<>'comercial' OR owner_id=?) ORDER BY rowid DESC", user.role, user.id)).map(r => json<Salon>(r));
      const visits = (await db.all("SELECT v.* FROM visits v JOIN salons s ON s.id=v.salon_id WHERE (?<>'comercial' OR s.owner_id=?) ORDER BY v.created_at DESC,v.rowid DESC", user.role, user.id)).map(r => json<Visit>(r));
      const actions = (await db.all("SELECT a.* FROM actions a JOIN salons s ON s.id=a.salon_id WHERE (?<>'comercial' OR s.owner_id=?) ORDER BY a.rowid DESC", user.role, user.id)).map(r => json<CommercialAction>(r));
      const reviews = (await db.all("SELECT r.* FROM purchase_reviews r JOIN salons s ON s.id=r.salon_id WHERE (?<>'comercial' OR s.owner_id=?) ORDER BY r.rowid DESC", user.role, user.id)).map(r => json<PurchaseReview>(r));
      const users = (await db.all(USER_SELECT + " WHERE c.user_id IS NULL ORDER BY u.name")).map(safeUser);
      return { salons, visits, actions, reviews, users: user.role === "comercial" ? [user] : users, draft: await draftFor(user) };
    },
    async saveVisit(user: User, input: unknown, onboarding = false) {
      if (!onboarding) requireStaff(user); const v = record(input); const fields = parseSalon(v.salon); const diagnostic = parseDiagnostic(onboarding ? { ...record(v.diagnostic), source: "Informado pelo responsável do salão", assessments: emptyDiagnostic().assessments } : v.diagnostic); if (onboarding && diagnostic.annualPurchase === null) throw new AppError("Informe a compra líquida nos últimos 12 meses. Se não houve compras, informe zero."); const salonId = text(v.salonId ?? "", 100);
      return db.transaction(async q => {
        const profile = onboarding ? await onboardingProfile(user, q) : null; if (profile && salonId !== profile.salon.id) throw new AppError("Atualize o salão vinculado à sua conta.", 403);
        let existing: Salon | null = profile?.salon ?? null;
        if (!existing && salonId) { if (user.role === "cliente") throw new AppError("Cadastre seu próprio salão.", 403); existing = await salonFor(user, salonId, q); }
        if (onboarding && !profile && existing && existing.ownerId !== user.id) throw new AppError("Vincule apenas um salão da sua própria conta.", 403);
        if (onboarding && await q.get("SELECT user_id FROM account_profiles WHERE salon_id=? AND user_id<>?", salonId, user.id)) throw new AppError("Este salão já está vinculado a outra conta.", 409);
        if (existing && existing.version !== v.version) throw new AppError("Este salão mudou em outra sessão. Atualize a página antes de salvar.", 409);
        const id = existing?.id ?? randomUUID(); const now = new Date().toISOString(); const salon: Salon = { ...fields, id, ownerId: existing?.ownerId ?? user.id, createdAt: existing?.createdAt ?? now, version: (existing?.version ?? 0) + 1 };
        if (!existing) { if (await q.get("SELECT id FROM salons WHERE lower(json_extract(data,'$.name'))=lower(?) AND lower(json_extract(data,'$.city'))=lower(?) AND lower(json_extract(data,'$.country'))=lower(?)", salon.name, salon.city, salon.country)) throw new AppError("Já existe um salão com este nome, cidade e país. Consulte a gestão.", 409); await q.run("INSERT INTO salons VALUES (?,?,?,?)", id, salon.ownerId, salon.version, JSON.stringify(salon)); }
        else await q.run("UPDATE salons SET version=?,data=? WHERE id=?", salon.version, JSON.stringify(salon), id);
        const visit = makeVisit(id, diagnostic, user, randomUUID(), now); await insertVisit(q, visit, user, onboarding); await audit(q, user, onboarding ? "onboarding.completed" : "visit.created", visit.id);
        if (onboarding && !profile) await q.run("INSERT INTO account_profiles VALUES (?,?)", user.id, id); await q.run("DELETE FROM drafts WHERE user_id=?", user.id); return { salonId: id, category: visit.category };
      });
    },
    async saveDraft(user: User, input: unknown) { if (JSON.stringify(input).length > 100_000) throw new AppError("Rascunho muito extenso."); const draft = parseDraft(input); if (draft.salonId) { if (user.role === "cliente") await personalSalon(user, draft.salonId); else if ((await onboardingProfile(user))?.salon.id !== draft.salonId) await salonFor(user, draft.salonId); } await db.run("INSERT INTO drafts VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data", user.id, JSON.stringify(draft)); },
    async clearDraft(user: User) { await db.run("DELETE FROM drafts WHERE user_id=?", user.id); },
    async updateAction(user: User, input: unknown) { requireStaff(user); const v = record(input); const id = text(v.id, 100); const status = text(v.status, 20); const result = text(v.result); if (!["pending", "done"].includes(status)) throw new AppError("Estado inválido."); if (status === "done" && result.length < 8) throw new AppError("Registre o resultado do acordo antes de concluir."); await db.transaction(async q => { const row = await q.get("SELECT * FROM actions WHERE id=?", id); if (!row) throw new AppError("Acordo não encontrado.", 404); const a = json<CommercialAction>(row); await salonFor(user, a.salonId, q); if (a.version !== v.version) throw new AppError("Este acordo mudou em outra sessão. Atualize antes de salvar.", 409); const updated = { ...a, status, result, completedAt: status === "done" ? new Date().toISOString() : null, version: a.version + 1 }; await q.run("UPDATE actions SET version=?,data=? WHERE id=?", updated.version, JSON.stringify(updated), id); await audit(q, user, "agreement." + status, id); }); },
    async assign(user: User, input: unknown) { requireStaff(user); if (user.role === "comercial") throw new AppError("A gestão pode transferir carteiras.", 403); const v = record(input); const id = text(v.salonId, 100); const ownerId = text(v.ownerId, 100); await db.transaction(async q => { const s = await salonFor(user, id, q); if (s.version !== v.version) throw new AppError("Cadastro alterado. Atualize a página.", 409); const owner = await userById(ownerId, q); if (!owner || owner.role === "cliente") throw new AppError("Selecione uma pessoa da equipe."); s.ownerId = ownerId; s.version++; await q.run("UPDATE salons SET owner_id=?,version=?,data=? WHERE id=?", ownerId, s.version, JSON.stringify(s), id); await audit(q, user, "salon.assigned", id); }); },
    async reviewPurchase(user: User, input: unknown) {
      requireStaff(user); const v = record(input); const id = text(v.id, 100); const status = text(v.status, 20); if (!["approved", "rejected"].includes(status)) throw new AppError("Decisão inválida."); const note = text(v.note); const source = text(v.source, 500); const amount = v.annualPurchase;
      if (!source || note.length < 8 || typeof amount !== "number" || !Number.isFinite(amount) || amount < 0 || amount > 1e9 || Math.abs(amount * 100 - Math.round(amount * 100)) > .00001) throw new AppError("Informe valor, fonte e justificativa da conferência.");
      await db.transaction(async q => { const row = await q.get("SELECT * FROM purchase_reviews WHERE id=?", id); if (!row) throw new AppError("Conferência não encontrada.", 404); const r = json<PurchaseReview>(row); await salonFor(user, r.salonId, q); if (r.status !== "pending") throw new AppError("Essa conferência já foi concluída. Atualize a página.", 409);
        const customer = await q.get("SELECT e.verified_at FROM account_profiles p JOIN customer_accounts c ON c.user_id=p.user_id LEFT JOIN email_status e ON e.user_id=p.user_id WHERE p.salon_id=?", r.salonId); if (status === "approved" && customer && !customer.verified_at) throw new AppError("O cliente precisa confirmar o e-mail antes da aprovação.");
        const updated: PurchaseReview = { ...r, annualPurchase: amount, source, status: status as "approved" | "rejected", note, reviewedBy: user.name, reviewedAt: new Date().toISOString() }; await q.run("UPDATE purchase_reviews SET status=?,data=? WHERE id=?", status, JSON.stringify(updated), id); await audit(q, user, "purchases." + status, id);
      });
    },
    async importPurchases(user: User, input: unknown) {
      requireStaff(user); if (user.role === "comercial") throw new AppError("Importação restrita à gestão.", 403); if (!Array.isArray(input) || !input.length || input.length > 500) throw new AppError("Importe entre 1 e 500 linhas por arquivo.");
      const rows = input.map(raw => { const r = record(raw); const annualPurchase = r.annualPurchase; if (typeof annualPurchase !== "number" || !Number.isFinite(annualPurchase) || annualPurchase < 0) throw new AppError("Valor de compra inválido."); return { salonId: text(r.salonId, 100), annualPurchase, orders: r.orders === null || r.orders === "" ? null : Number(r.orders), cutoff: validDate(r.cutoff, "data de corte"), source: text(r.source, 500) }; }); if (new Set(rows.map(r => r.salonId)).size !== rows.length) throw new AppError("Há salões repetidos no arquivo.");
      return db.transaction(async q => { for (const r of rows) { const salon = await salonFor(user, r.salonId, q); const row = await q.get("SELECT * FROM visits WHERE salon_id=? ORDER BY created_at DESC,rowid DESC LIMIT 1", r.salonId); if (!row) throw new AppError("Registre um diagnóstico antes de importar compras."); const previous = json<Visit>(row); if (r.cutoff < previous.diagnostic.cutoff) throw new AppError("A data importada é anterior ao último diagnóstico.");
          const d = parseDiagnostic({ ...previous.diagnostic, ...r, agreement: { title: "", responsible: "", due: "" }, brands: previous.diagnostic.brands.map(b => ({ ...b, purchased: null, references: null })), assessments: emptyDiagnostic().assessments, professionals: null, stations: null, note: "Compras conferidas por importação. Reavaliar as dimensões no novo período." }); const visit = makeVisit(salon.id, d, user, randomUUID(), new Date().toISOString(), "import"); await insertVisit(q, visit, user, false); salon.version++; await q.run("UPDATE salons SET version=?,data=? WHERE id=?", salon.version, JSON.stringify(salon), salon.id); await audit(q, user, "purchases.imported", visit.id); }
        return { imported: rows.length }; });
    },
    async evidenceAccess(user: User, salonId: string) { return user.role === "cliente" ? personalSalon(user, salonId) : salonFor(user, salonId); },
    async addEvidence(user: User, salonId: string, file: { name: string; mime: string; content: string }) { return db.transaction(async q => { if (user.role === "cliente") await personalSalon(user, salonId, q); else await salonFor(user, salonId, q); const id = randomUUID(); const total = await q.get("SELECT count(*) AS n,coalesce(sum(length(content)),0) AS bytes FROM evidence_files WHERE salon_id=?", salonId); if (Number(total?.n ?? 0) >= 30 || Number(total?.bytes ?? 0) + file.content.length > 14_000_000) throw new AppError("Limite de anexos do salão atingido (30 arquivos ou 10 MB)."); await q.run("INSERT INTO evidence_files VALUES (?,?,?,?,?,?,?)", id, salonId, user.id, file.name, file.mime, file.content, new Date().toISOString()); await audit(q,user,"evidence.added",id); return { id }; }); },
    async listEvidence(user: User, salonId: string) { if (user.role === "cliente") await personalSalon(user, salonId); else await salonFor(user, salonId); return db.all("SELECT id,name,mime,created_at FROM evidence_files WHERE salon_id=? ORDER BY rowid DESC", salonId); },
    async getEvidence(user: User, id: string) { const file = await db.get("SELECT * FROM evidence_files WHERE id=?", id); if (!file) throw new AppError("Anexo não encontrado.", 404); if (user.role === "cliente") await personalSalon(user, String(file.salon_id)); else await salonFor(user, String(file.salon_id)); return file; },
  };
}
type Store = Awaited<ReturnType<typeof createStore>>;
const shared = globalThis as unknown as { atelierStoreV3?: Promise<Store> };
export function getStore(): Promise<Store> { return shared.atelierStoreV3 ??= createStore(process.env.TURSO_DATABASE_URL || process.env.ATELIER_DATABASE_PATH || resolve(process.cwd(), ".data", "atelier.sqlite"), process.env.TURSO_AUTH_TOKEN).catch(e => { delete shared.atelierStoreV3; throw e; }); }
