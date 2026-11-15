import {NextResponse} from "next/server";
import {getStore} from "../../../lib/server/store";
import {mailAvailable} from "../../../lib/server/mail";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET() {
  try {
    await (await getStore()).db.get("SELECT 1 AS ok");
    // Invitations and administrator-issued recovery codes work without email.
    return NextResponse.json({ status: "ready", database: process.env.TURSO_DATABASE_URL ? "remote" : "local", mail: mailAvailable() ? "configured" : "unconfigured" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "database-unconfigured" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
