import type { Metadata } from "next";
import GraceProEntry from "./components/atelier-entry";
import "./home.css";
import "./entrar/account.css";

export const metadata: Metadata = {
  title: "GRACE PRO — Commercial Intelligence",
  description: "Understand better. Achieve more. Welcome to your Grace Pro workspace.",
};

export default function Home() {
  return <main><GraceProEntry /></main>;
}
