import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { SQL } from "./database";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function encodeBase32(bytes: Buffer) {
  let bits = 0, value = 0, result = "";
  for (const byte of bytes) { value = (value << 8) | byte; bits += 8; while (bits >= 5) { result += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits) result += alphabet[(value << (5 - bits)) & 31];
  return result;
}
function decodeBase32(secret: string) {
  let bits = 0, value = 0; const bytes: number[] = [];
  for (const char of secret.replace(/=+$/, "").toUpperCase()) { const n = alphabet.indexOf(char); if (n < 0) throw new Error("Invalid authenticator key"); value = (value << 5) | n; bits += 5; if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 255); bits -= 8; } }
  return Buffer.from(bytes);
}
// RFC 4226/6238: SHA-1, 30-second periods, six digits; accepts one adjacent period.
export function totp(secret: string, step: number, digits = 6) {
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac("sha1", decodeBase32(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 15;
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits).toString().padStart(digits, "0");
}
export function validStep(secret: string, code: string, lastStep = -1, now = Date.now()) {
  if (!/^\d{6}$/.test(code)) return null;
  const current = Math.floor(now / 30000);
  for (const step of [current, current - 1, current + 1]) if (step > lastStep && timingSafeEqual(Buffer.from(code), Buffer.from(totp(secret, step)))) return step;
  return null;
}
export function mfaConfigured() { return /^[a-f0-9]{64}$/i.test(process.env.ATELIER_MFA_KEY ?? ""); }
function encryptionKey() { if (!mfaConfigured()) throw new Error("Configure ATELIER_MFA_KEY no servidor para ativar a autenticação em duas etapas."); return Buffer.from(process.env.ATELIER_MFA_KEY!, "hex"); }
export function sealSecret(secret: string, userId: string) {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(userId));
  return Buffer.concat([iv, cipher.update(secret, "utf8"), cipher.final(), cipher.getAuthTag()]).toString("base64");
}
export function openSecret(value: string, userId: string) {
  const bytes = Buffer.from(value, "base64"), decipher = createDecipheriv("aes-256-gcm", encryptionKey(), bytes.subarray(0, 12));
  decipher.setAAD(Buffer.from(userId)); decipher.setAuthTag(bytes.subarray(-16));
  return Buffer.concat([decipher.update(bytes.subarray(12, -16)), decipher.final()]).toString("utf8");
}
export const recoveryHash = (code: string) => createHash("sha256").update(code.trim().toLowerCase()).digest("hex");
export async function consumeMfa(q: SQL, userId: string, code: string) {
  const row = await q.get("SELECT * FROM mfa_credentials WHERE user_id=?", userId);
  if (!row) return true;
  const step = validStep(openSecret(String(row.secret), userId), code, Number(row.last_step));
  if (step !== null) { await q.run("UPDATE mfa_credentials SET last_step=? WHERE user_id=?", step, userId); return true; }
  if (!/^[a-f0-9]{16}$/i.test(code.trim())) return false;
  const digest = recoveryHash(code), recovery = await q.get("SELECT code_hash FROM mfa_recovery WHERE user_id=? AND code_hash=?", userId, digest);
  if (!recovery) return false;
  await q.run("DELETE FROM mfa_recovery WHERE user_id=? AND code_hash=?", userId, digest);
  return true;
}
