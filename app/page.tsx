import type { Metadata } from "next";
import AtelierEntry from "./components/atelier-entry";
import "./home.css";
import "./entrar/account.css";

export const metadata: Metadata = {
  title: "ATELIER. — Inteligência Comercial",
  description: "Conheça melhor. Conquiste mais. Entre no seu workspace Atelier.",
};

export default function Home() {
  return <main><AtelierEntry /></main>;
}