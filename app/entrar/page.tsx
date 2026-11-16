import type { Metadata } from "next";
import AccountForm from "../components/account-form";
import "./account.css";

export const metadata: Metadata = {
  title: "Team access — GRACE PRO",
  description: "Internal access for the Grace Pro commercial team.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountForm />;
}
