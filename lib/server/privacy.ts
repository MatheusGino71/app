import { randomUUID } from "node:crypto";
import { parseSalon, type User } from "../domain";
import { AppError, type Store } from "./store";
import { eraseSalonRecords } from "./erasure";

const kinds = ["access", "correction", "erasure", "restriction", "objection"];
const clean = (v: unknown, max = 2000) => { if (typeof v !== "string" || v.trim().length > max) throw new AppError("Texto inválido."); return v.trim(); };
function admin(user: User) { if (user.role !== "admin") throw new AppError("Acesso restrito à administração.", 403); }
export function oneMonthAfter(value: string) {
  const date = new Date(value), day = date.getUTCDate(); date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + 1);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate(); date.setUTCDate(Math.min(day, last)); return date.toISOString();
}
export async function privacyOverview(store: Store, user: User) {
  const requests = await store.db.all("SELECT * FROM privacy_requests WHERE (?='admin' OR requested_by=?) ORDER BY created_at DESC", user.role, user.id);
  const days = Number(process.env.ATELIER_RECORD_RETENTION_DAYS);
  const retentionDays = Number.isSafeInteger(days) && days >= 30 && days <= 36500 ? days : null;
  const review = user.role === "admin" && retentionDays ? await store.db.all("SELECT s.id,s.data,coalesce(max(v.created_at),json_extract(s.data,'$.createdAt')) AS last_activity FROM salons s LEFT JOIN visits v ON v.salon_id=s.id GROUP BY s.id HAVING last_activity<?", new Date(Date.now() - retentionDays * 86400000).toISOString()) : [];
  const restricted = user.role === "admin" ? await store.db.all("SELECT salon_id,request_id,restricted_at FROM restricted_salons") : [];
  return { requests, restricted, retentionDays, review: review.map(row => ({ id: row.id, name: JSON.parse(String(row.data)).name, lastActivity: row.last_activity })) };
}
export async function createPrivacyRequest(store: Store, user: User, input: { kind?: unknown; salonId?: unknown; note?: unknown }) {
  const kind = clean(input.kind, 20), salonId = clean(input.salonId ?? "", 100), note = clean(input.note ?? "");
  if (!kinds.includes(kind) || note.length < 8) throw new AppError("Descreva a solicitação e selecione um direito válido.");
  if (salonId) {
    const row = await store.db.get("SELECT id,owner_id FROM salons WHERE id=?", salonId);
    const linked = user.role === "cliente" ? await store.db.get("SELECT user_id FROM account_profiles WHERE user_id=? AND salon_id=?", user.id, salonId) : null;
    if (!row || user.role === "comercial" && row.owner_id !== user.id || user.role === "cliente" && !linked) throw new AppError("Salão não encontrado na sua carteira.", 404);
  }
  const now = new Date().toISOString(), id = randomUUID();
  await store.db.run("INSERT INTO privacy_requests VALUES (?,?,?,?,?,?,?,?,?,?,NULL,0)", id, user.id, salonId || null, kind, "open", now, oneMonthAfter(now), now, note, "");
  return { id };
}
export async function exportPersonalData(store: Store, user: User) {
  const account = await store.db.get("SELECT id,name,email FROM users WHERE id=?", user.id);
  return { exportedAt: new Date().toISOString(), account, requests: await store.db.all("SELECT id,kind,status,created_at,due_at,note,response FROM privacy_requests WHERE requested_by=? AND salon_id IS NULL", user.id) };
}
export async function privacyAction(store: Store, user: User, input: Record<string, unknown>) {
  admin(user);
  const id = clean(input.id, 100), action = clean(input.action, 30), response = clean(input.response ?? "");
  // Destructive and disclosure actions require a fresh password and any active MFA.
  if (["erase", "export", "rectify", "restrict", "liftRestriction"].includes(action)) {
    await store.rateLimit("privacy-sensitive:" + user.id, 8);
    await store.login({ email: user.email, password: input.password, otp: input.otp });
  }
  return store.db.transaction(async q => {
    const request = await q.get("SELECT * FROM privacy_requests WHERE id=?", id);
    if (!request) throw new AppError("Solicitação não encontrada.", 404);
    if (request.version !== input.version || action !== "liftRestriction" && ["completed", "rejected"].includes(String(request.status))) throw new AppError("A solicitação mudou. Atualize a página.", 409);
    const now = new Date().toISOString();
    const audit = (event: string) => q.run("INSERT INTO audit VALUES (?,?,?,?,?)", randomUUID(), user.id, event, id, now);
    if (action === "verify") {
      if (response.length < 8) throw new AppError("Registre como a identidade e a representação foram verificadas.");
      await q.run("UPDATE privacy_requests SET verified_at=?,status='in_progress',response=?,updated_at=?,version=version+1 WHERE id=?", now, response, now, id);
      await audit("privacy.identity-verified"); return { ok: true };
    }
    if (["export", "erase", "rectify", "restrict", "liftRestriction"].includes(action) && !request.verified_at) throw new AppError("Verifique a identidade e a representação antes de executar a solicitação.", 409);
    const salonId = String(request.salon_id ?? "");
    if (["restrict", "liftRestriction"].includes(action)) {
      if (!["restriction", "objection"].includes(String(request.kind)) || !salonId || response.length < 8) throw new AppError("Registre a decisão para a restrição de tratamento.");
      if (action === "restrict") {
        if (!await q.get("SELECT id FROM salons WHERE id=?", salonId)) throw new AppError("Salão não encontrado.", 404);
        await q.run("INSERT INTO restricted_salons VALUES (?,?,?) ON CONFLICT(salon_id) DO NOTHING", salonId, id, now);
        for (const row of await q.all("SELECT user_id,data FROM drafts")) if (JSON.parse(String(row.data)).salonId === salonId) await q.run("DELETE FROM drafts WHERE user_id=?", String(row.user_id));
      } else {
        const active = await q.get("SELECT request_id FROM restricted_salons WHERE salon_id=?", salonId);
        if (!active || active.request_id !== id) throw new AppError("Restrição ativa não encontrada para esta solicitação.", 409);
        await q.run("DELETE FROM restricted_salons WHERE salon_id=?", salonId);
      }
      await q.run("UPDATE privacy_requests SET status='completed',response=?,updated_at=?,version=version+1 WHERE id=?", response, now, id);
      await audit("privacy." + action); return { ok: true };
    }
    if (action === "export") {
      if (request.kind !== "access" || !salonId) throw new AppError("Selecione uma solicitação de acesso de um salão.");
      const salon = await q.get("SELECT data FROM salons WHERE id=?", salonId); if (!salon) throw new AppError("Salão não encontrado.", 404);
      const result: Record<string, unknown> = { exportedAt: now, salon: JSON.parse(String(salon.data)) };
      for (const table of ["visits", "actions", "purchase_reviews", "campaign_entries"]) result[table] = (await q.all(`SELECT data FROM ${table} WHERE salon_id=?`, salonId)).map(r => JSON.parse(String(r.data)));
      // Attachments are downloaded separately through the authenticated endpoint,
      // avoiding an oversized serverless response and public download credentials.
      result.attachments = (await q.all("SELECT id,name,mime,created_at FROM evidence_files WHERE salon_id=?", salonId)).map(file => ({ ...file, downloadPath: "/api/evidence?id=" + encodeURIComponent(String(file.id)) }));
      await audit("privacy.exported"); return result;
    }
    if (action === "erase") {
      if (request.kind !== "erasure" || !salonId || response.length < 8) throw new AppError("Registre a decisão para uma solicitação de exclusão de salão.");
      const salon = await q.get("SELECT data FROM salons WHERE id=?", salonId);
      if (!salon || input.confirmation !== `DELETE ${JSON.parse(String(salon.data)).name}` || input.retentionReviewed !== true) throw new AppError("Confirme o nome do salão e a avaliação das obrigações de retenção.");
      await eraseSalonRecords(q, salonId, now);
      await q.run("UPDATE privacy_requests SET status='completed',response='Erasure completed after identity and retention review.',updated_at=?,version=version+1 WHERE id=?", now, id);
      await audit("privacy.erased"); return { erased: true };
    }
    if (action === "rectify") {
      if (request.kind !== "correction" || !salonId || response.length < 8) throw new AppError("Selecione uma solicitação de correção e registre a decisão.");
      const row = await q.get("SELECT data,version FROM salons WHERE id=?", salonId);
      if (!row || row.version !== input.salonVersion) throw new AppError("O cadastro mudou. Atualize a página.", 409);
      const salon = { ...JSON.parse(String(row.data)), ...parseSalon(input.fields), version: Number(row.version) + 1 };
      await q.run("UPDATE salons SET data=?,version=? WHERE id=?", JSON.stringify(salon), salon.version, salonId);
      await audit("privacy.rectified");
    } else if (!["complete", "reject"].includes(action)) throw new AppError("Operação inválida.");
    if (response.length < 8) throw new AppError("Registre a resposta e a justificativa da decisão.");
    if (action === "complete" && ["erasure", "correction", "restriction", "objection"].includes(String(request.kind)) && salonId) throw new AppError("Execute a operação verificada ou registre uma recusa justificada.");
    await q.run("UPDATE privacy_requests SET status=?,response=?,updated_at=?,version=version+1 WHERE id=?", action === "reject" ? "rejected" : "completed", response, now, id);
    await audit("privacy." + action); return { ok: true };
  });
}

export async function cleanupExpiredData(store: Store, now = Date.now()) {
  return store.db.transaction(async q => {
    for (const table of ["sessions", "email_tokens", "invitations", "resets", "attempts", "mfa_pending"]) await q.run(`DELETE FROM ${table} WHERE expires<?`, now);
    return { cleanedAt: new Date(now).toISOString(), businessRecordsDeleted: 0 };
  });
}
