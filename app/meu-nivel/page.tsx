import { redirect } from "next/navigation";
import { currentUser } from "../../lib/server/auth";
import { getStore } from "../../lib/server/store";
import LevelResult from "../components/onboarding/level-result";
import "../workspace/workspace.css";
import "../diagnostico/onboarding.css";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function MyLevelPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  if ((await searchParams).demo === "1") return <LevelResult demo profile={null} />;
  const user = await currentUser(); if (!user) redirect("/entrar");
  const profile = await (await getStore()).onboardingProfile(user); if (!profile) redirect("/diagnostico");
  return <LevelResult demo={false} profile={profile} user={user} />;
}
