import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getStore } from "../../../lib/server/store";
import { cleanupExpiredData } from "../../../lib/server/privacy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET, supplied = request.headers.get("authorization") ?? "", expected = "Bearer " + secret;
  const actualBytes = Buffer.from(supplied), expectedBytes = Buffer.from(expected);
  if (!secret || actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json(await cleanupExpiredData(await getStore()), { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ error: "Maintenance failed" }, { status: 503 }); }
}
