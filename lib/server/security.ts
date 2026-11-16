import { randomBytes, randomUUID } from "node:crypto";
import type { User } from "../domain";
import { AppError, type Store } from "./store";
import { encodeBase32, mfaConfigured, openSecret, recoveryHash, sealSecret, validStep } from "./mfa";

export async function securityStatus(store: Store, user: User) {
  return { enabled: !!await store.db.get("SELECT user_id FROM mfa_credentials WHERE user_id=?", user.id), configured: mfaConfigured(), sessions: Number((await store.db.get("SELECT count(*) AS n FROM sessions WHERE user_id=? AND expires>?", user.id, Date.now()))?.n ?? 0), recoveryRemaining: Number((await store.db.get("SELECT count(*) AS n FROM mfa_recovery WHERE user_id=?", user.id))?.n ?? 0) };
}
export async function securityAction(store: Store, user: User, input: { action: string; password?: string; otp?: string; code?: string }) {
  await store.rateLimit("security:" + user.id, 8);
  // Password and the active second factor are both required for security changes.
  await store.login({ email: user.email, password: input.password, otp: input.otp });
  const audit = (event: string) => store.db.run("INSERT INTO audit VALUES (?,?,?,?,?)", randomUUID(), user.id, event, user.id, new Date().toISOString());
  if (input.action === "beginMfa") {
    if (!mfaConfigured()) throw new AppError("Configure ATELIER_MFA_KEY no servidor para ativar a autenticação em duas etapas.", 503);
    if ((await securityStatus(store, user)).enabled) throw new AppError("A autenticação em duas etapas já está ativa.", 409);
    const secret = encodeBase32(randomBytes(20));
    await store.db.run("INSERT INTO mfa_pending VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET secret=excluded.secret,expires=excluded.expires", user.id, sealSecret(secret, user.id), Date.now() + 10 * 60000);
    return { secret, uri: `otpauth://totp/${encodeURIComponent("Grace Pro:" + user.email)}?secret=${secret}&issuer=Grace%20Pro&algorithm=SHA1&digits=6&period=30` };
  }
  if (input.action === "confirmMfa") {
    const recoveryCodes = Array.from({ length: 10 }, () => randomBytes(8).toString("hex"));
    await store.db.transaction(async q => {
      if (await q.get("SELECT user_id FROM mfa_credentials WHERE user_id=?", user.id)) throw new AppError("A autenticação em duas etapas já está ativa.", 409);
      const pending = await q.get("SELECT * FROM mfa_pending WHERE user_id=? AND expires>?", user.id, Date.now());
      if (!pending) throw new AppError("A configuração expirou. Inicie novamente.");
      const step = validStep(openSecret(String(pending.secret), user.id), input.code ?? "");
      if (step === null) throw new AppError("Informe um código válido do autenticador ou de recuperação.");
      await q.run("INSERT INTO mfa_credentials VALUES (?,?,?,?)", user.id, String(pending.secret), step, new Date().toISOString());
      for (const code of recoveryCodes) await q.run("INSERT INTO mfa_recovery VALUES (?,?)", user.id, recoveryHash(code));
      await q.run("DELETE FROM mfa_pending WHERE user_id=?", user.id);
      await q.run("DELETE FROM sessions WHERE user_id=?", user.id);
    });
    await audit("mfa.enabled"); return { recoveryCodes, signedOut: true };
  }
  if (input.action === "disableMfa") {
    await store.db.transaction(async q => {
      await q.run("DELETE FROM mfa_credentials WHERE user_id=?", user.id); await q.run("DELETE FROM mfa_recovery WHERE user_id=?", user.id); await q.run("DELETE FROM mfa_pending WHERE user_id=?", user.id); await q.run("DELETE FROM sessions WHERE user_id=?", user.id);
    });
    await audit("mfa.disabled"); return { signedOut: true };
  }
  if (input.action === "revokeSessions") { await store.db.run("DELETE FROM sessions WHERE user_id=?", user.id); await audit("sessions.revoked"); return { signedOut: true }; }
  throw new AppError("Operação inválida.");
}
