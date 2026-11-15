import { NextResponse } from "next/server";
import { currentUser } from "../../../lib/server/auth";
import { AppError, getStore, requireStaff } from "../../../lib/server/store";
import { assertSameOrigin } from "../../../lib/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { const user = await currentUser(); if (!user) throw new AppError("Entre na sua conta.", 401); requireStaff(user); return NextResponse.json(await (await getStore()).snapshot(user), { headers: { "Cache-Control": "no-store" } }); }
  catch (e) { return NextResponse.json({ error: e instanceof AppError ? e.message : "Serviço indisponível." }, { status: e instanceof AppError ? e.status : 503 }); }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request); const user = await currentUser(); if (!user) throw new AppError("Sua sessão expirou. Entre novamente.", 401);
    const raw = await request.text(); if (raw.length > 1_000_000) throw new AppError("Solicitação muito extensa.", 413);
    const input = JSON.parse(raw); const store = await getStore(); let result: unknown = null;
    if (input.action !== "draft" && input.action !== "clearDraft") requireStaff(user);
    switch (input.action) {
      case "visit": result = await store.saveVisit(user, input.payload); break;
      case "draft": await store.saveDraft(user, input.payload); break;
      case "clearDraft": await store.clearDraft(user); break;
      case "agreement": await store.updateAction(user, input.payload); break;
      case "invite": result = await store.invite(user, input.payload); break;
      case "resetCode": result = await store.resetCode(user, String(input.payload?.userId ?? "")); break;
      case "assign": await store.assign(user, input.payload); break;
      case "import": result = await store.importPurchases(user, input.payload); break;
      case "review": await store.reviewPurchase(user, input.payload); break;
      default: throw new AppError("Operação inválida.");
    }
    return NextResponse.json({ data: user.role === "cliente" ? { draft: await store.draftFor(user) } : await store.snapshot(user), result });
  } catch (e) { return NextResponse.json({ error: e instanceof Error && !/SQLITE|libSQL|SQL_/.test(e.message) ? e.message : "Não foi possível salvar os dados." }, { status: e instanceof AppError ? e.status : 400 }); }
}
