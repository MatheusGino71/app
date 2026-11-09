import type { Metadata } from "next";
import AccountForm from "../components/account-form";
import "./account.css";

export const metadata: Metadata = {
  title: "Entrar ou criar conta — ATELIER.",
  description: "Acesse seu workspace Atelier e transforme cada relacionamento em uma nova oportunidade.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountForm />;
}
