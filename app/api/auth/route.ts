import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "../../../lib/server/auth";
import { AppError, getStore, requireStaff } from "../../../lib/server/store";
import { assertSameOrigin } from "../../../lib/server/http";
import { mailAvailable, sendAccountMail } from "../../../lib/server/mail";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { const store = await getStore(); const user = await store.session((await cookies()).get(SESSION_COOKIE)?.value); return NextResponse.json({ user, needsSetup: !await store.hasAdmins(), mailReady: mailAvailable() }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ error: "Serviço de contas indisponível. Confira a configuração do banco no servidor." }, { status: 503 }); }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request); const raw = await request.text(); if (raw.length > 12000) throw new AppError("Solicitação muito extensa.", 413);
    const input = JSON.parse(raw); const store = await getStore(); const jar = await cookies();
    if (input.action === "logout") { const token = jar.get(SESSION_COOKIE)?.value; if (token) await store.logout(token); jar.delete(SESSION_COOKIE); return NextResponse.json({ ok: true }); }
    if (input.action === "verify") { await store.rateLimit("verify-server", 100); await store.verifyEmail(input.code); return NextResponse.json({ ok: true }); }
    if (input.action === "resendVerification") {
      const user = await store.session(jar.get(SESSION_COOKIE)?.value); if (!user) throw new AppError("Entre na sua conta.", 401); await store.rateLimit("verify:" + user.id, 4);
      if (!mailAvailable()) throw new AppError("O envio de e-mail ainda não está configurado no servidor.", 503);
      const token = await store.verification(user); const delivery = token ? await sendAccountMail(user.email, token.code, "verify") : "sent"; return NextResponse.json({ ok: true, delivery });
    }
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase().slice(0, 254) : "invalid";
    await store.rateLimit("auth-server", 250); await store.rateLimit("auth-email:" + email);
    if (input.action === "forgot") {
      if (!mailAvailable()) throw new AppError("O envio de recuperação ainda não está configurado no servidor.", 503);
      const token = await store.recovery(email); if (token) { try { await sendAccountMail(token.user.email, token.code, "reset"); } catch { /* A uniform response does not reveal whether an account exists. */ } }
      return NextResponse.json({ ok: true, message: "Se houver uma conta com esse e-mail, você receberá um link para escolher uma nova senha." });
    }
    if (input.action === "reset") { await store.resetPassword(input); return NextResponse.json({ ok: true }); }
    if (input.action !== "login" && input.action !== "signup") throw new AppError("Operação inválida.");
    if (input.action === "signup" && input.kind !== "staff") throw new AppError("Este recurso pertence à equipe Grace Pro.", 403);
    const user = input.action === "signup" ? await store.signup(input) : await store.login(input); requireStaff(user); const session = await store.createSession(user, input.remember === true);
    jar.set(SESSION_COOKIE, session.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: session.maxAge });
    return NextResponse.json({ user, redirectTo: "/workspace" });
  } catch (e) { return NextResponse.json({ error: e instanceof AppError ? e.message : "Não foi possível processar o acesso. Tente novamente." }, { status: e instanceof AppError ? e.status : 400 }); }
}
