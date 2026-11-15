import { redirect } from "next/navigation";
import { currentUser } from "../../lib/server/auth";
import { getStore } from "../../lib/server/store";
import { createDemoData, DEMO_USER } from "../../lib/demo";
import Workspace from "../components/crm/workspace";
import "./workspace.css";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function WorkspacePage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const demo = (await searchParams).demo === "1";
  if (demo) return <Workspace demo user={DEMO_USER} initialData={createDemoData()} />;
  const user = await currentUser();
  if (!user) redirect("/equipe");
  if (user.role === "cliente") redirect("/meu-nivel");
  return <Workspace demo={false} user={user} initialData={await (await getStore()).snapshot(user)} />;
}
