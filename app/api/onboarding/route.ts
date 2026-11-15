import { NextResponse } from "next/server";
import { currentUser } from "../../../lib/server/auth";
import { assertSameOrigin } from "../../../lib/server/http";
import { AppError, getStore } from "../../../lib/server/store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await currentUser(); if (!user) throw new AppError("Entre na sua conta para continuar.", 401);
    const raw = await request.text(); if (raw.length > 100_000) throw new AppError("Formulário muito extenso.", 413);
    const store = await getStore(); await store.rateLimit("diagnostic:" + user.id, 30); const result = await store.saveVisit(user, JSON.parse(raw), true);
    return NextResponse.json({ ...result, redirectTo: "/meu-nivel" });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error && !e.message.includes("SQLITE") ? e.message : "Não foi possível salvar seu diagnóstico." }, { status: e instanceof AppError ? e.status : 400 });
  }
}
