import type { Metadata } from "next";
import AccountForm from "../components/account-form";
import "./account.css";

export const metadata: Metadata = {
  title: "Sign in or create an account — ATELIER.",
  description: "Access your Atelier workspace and turn every relationship into a new opportunity.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountForm />;
}
