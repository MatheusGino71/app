import {NextResponse} from "next/server";
import {getStore} from "../../../lib/server/store";
import {mailAvailable} from "../../../lib/server/mail";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){try{await (await getStore()).db.get("SELECT 1 AS ok");const ready=mailAvailable();return NextResponse.json({status:ready?"ready":"mail-unconfigured",database:process.env.TURSO_DATABASE_URL?"remote":"local",mail:ready?"configured":"unconfigured"},{status:ready?200:503,headers:{"Cache-Control":"no-store"}});}catch{return NextResponse.json({status:"database-unconfigured"},{status:503,headers:{"Cache-Control":"no-store"}});}}
