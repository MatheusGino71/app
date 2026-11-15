import type { Metadata } from "next";
import AtelierEntry from "./components/atelier-entry";
import "./home.css";
import "./entrar/account.css";

export const metadata: Metadata = {
  title: "ATELIER. — Commercial Intelligence",
  description: "Understand better. Achieve more. Welcome to your Atelier workspace.",
};

export default function Home() {
  return <main><AtelierEntry /></main>;
}
