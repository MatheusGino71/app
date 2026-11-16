import { redirect } from "next/navigation";
import { currentUser } from "../../lib/server/auth";
import { getStore } from "../../lib/server/store";
import AccountPrivacy from "../components/account-privacy";
import "../workspace/workspace.css";
import "./privacy.css";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function AccountPage() {
  const user = await currentUser(); if (!user) redirect("/entrar");
  const store = await getStore();
  const salons = user.role === "cliente" ? [(await store.onboardingProfile(user))?.salon].filter(s => !!s) : (await store.snapshot(user)).salons;
  return <AccountPrivacy user={user} salons={salons} />;
}
