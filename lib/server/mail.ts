import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { randomUUID } from "node:crypto";
export function mailTransport() { return process.env.MAIL_TRANSPORT || (process.env.NODE_ENV === "production" ? "resend" : "file"); }
export function mailAvailable() { return mailTransport() === "file" && !process.env.VERCEL || !!(process.env.RESEND_API_KEY && process.env.MAIL_FROM && process.env.ATELIER_APP_ORIGIN); }
export async function sendAccountMail(to: string, code: string, purpose: "verify" | "reset"): Promise<"sent" | "local"> {
  if (!mailAvailable()) throw new Error("O envio de e-mail ainda não está configurado no servidor.");
  const origin = process.env.ATELIER_APP_ORIGIN || "http://localhost:3000";
  const url = new URL(purpose === "verify" ? "/confirmar-email" : "/recuperar", origin); url.searchParams.set("token", code);
  const subject = purpose === "verify" ? "Confirme seu e-mail no ATELIER" : "Recupere seu acesso ao ATELIER";
  const text = `${subject}\n\nAcesse ${url.toString()}\n\n${purpose === "verify" ? "O link é válido por 24 horas." : "O link é válido por uma hora e só pode ser usado uma vez."}\nSe você não solicitou esta mensagem, ignore este e-mail.\n\nATELIER · Grace Pro`;
  if (mailTransport() === "file" && !process.env.VERCEL) {
    const folder = resolve(/* turbopackIgnore: true */ process.env.ATELIER_MAIL_OUTBOX || ".data/mail"); await mkdir(folder, { recursive: true });
    await writeFile(join(folder, randomUUID() + ".json"), JSON.stringify({ to, subject, text }, null, 2), { mode: 0o600 }); return "local";
  }
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `atelier-${purpose}-${code.slice(0, 24)}` }, body: JSON.stringify({ from: process.env.MAIL_FROM, to: [to], subject, text }), signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("O provedor de e-mail não aceitou a mensagem. Tente reenviar em instantes.");
  return "sent";
}
