import { redirect } from "next/navigation";
import { currentUser } from "../../lib/server/auth";
import { getStore } from "../../lib/server/store";
import { DEMO_USER } from "../../lib/demo";
import OnboardingFlow from "../components/onboarding/flow";
import "../workspace/workspace.css";
import "./onboarding.css";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function DiagnosticPage({ searchParams }: { searchParams: Promise<{ demo?: string; inicio?: string }> }) {
  const params = await searchParams;
  if (params.demo === "1") return <OnboardingFlow demo user={DEMO_USER} profile={null} savedDraft={null} fresh />;
  const user = await currentUser(); if (!user) redirect("/entrar");
  const store = await getStore();
  return <OnboardingFlow demo={false} user={user} profile={await store.onboardingProfile(user)} savedDraft={await store.draftFor(user)} fresh={params.inicio === "1"} />;
}
