import { NextResponse } from "next/server";
import { currentUser } from "../../../lib/server/auth";
import { AppError, getStore } from "../../../lib/server/store";
import { assertSameOrigin } from "../../../lib/server/http";
import { securityAction, securityStatus } from "../../../lib/server/security";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { const user = await currentUser(); if (!user) throw new AppError("Entre na sua conta.", 401); return NextResponse.json(await securityStatus(await getStore(), user), { headers: { "Cache-Control": "no-store" } }); }
  catch (e) { return NextResponse.json({ error: e instanceof AppError ? e.message : "Serviço indisponível." }, { status: e instanceof AppError ? e.status : 503 }); }
}
export async function POST(request: Request) {
  try { assertSameOrigin(request); const user = await currentUser(); if (!user) throw new AppError("Entre na sua conta.", 401); const body = await request.text(); if (body.length > 6000) throw new AppError("Solicitação muito extensa.", 413); return NextResponse.json(await securityAction(await getStore(), user, JSON.parse(body)), { headers: { "Cache-Control": "no-store" } }); }
  catch (e) { return NextResponse.json({ error: e instanceof AppError ? e.message : "Não foi possível alterar a segurança da conta." }, { status: e instanceof AppError ? e.status : 400 }); }
}
