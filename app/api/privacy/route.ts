import { NextResponse } from "next/server";
import { currentUser } from "../../../lib/server/auth";
import { AppError, getStore } from "../../../lib/server/store";
import { assertSameOrigin } from "../../../lib/server/http";
import { createPrivacyRequest, exportPersonalData, privacyAction, privacyOverview } from "../../../lib/server/privacy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { const user = await currentUser(); if (!user) throw new AppError("Entre na sua conta.", 401); return NextResponse.json(await privacyOverview(await getStore(), user), { headers: { "Cache-Control": "no-store" } }); }
  catch (e) { return NextResponse.json({ error: e instanceof AppError ? e.message : "Serviço indisponível." }, { status: e instanceof AppError ? e.status : 503 }); }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request); const user = await currentUser(); if (!user) throw new AppError("Entre na sua conta.", 401);
    const raw = await request.text(); if (raw.length > 12000) throw new AppError("Solicitação muito extensa.", 413);
    const input = JSON.parse(raw), store = await getStore(); await store.rateLimit("privacy:" + user.id, 60);
    const result = input.action === "create" ? await createPrivacyRequest(store, user, input) : input.action === "personalExport" ? await exportPersonalData(store, user) : await privacyAction(store, user, input);
    const download = ["export", "personalExport"].includes(input.action);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store", ...(download ? { "Content-Disposition": 'attachment; filename="grace-pro-personal-data.json"' } : {}) } });
  } catch (e) { return NextResponse.json({ error: e instanceof AppError ? e.message : "Não foi possível processar a solicitação." }, { status: e instanceof AppError ? e.status : 400 }); }
}
