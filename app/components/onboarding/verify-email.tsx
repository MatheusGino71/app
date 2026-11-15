"use client";
import { useState } from "react";
import Link from "next/link";
export default function VerifyEmail({ token }: { token: string }) {
  const [done,setDone] = useState(false); const [busy,setBusy] = useState(false); const [error,setError] = useState("");
  return <main className="crm crm-journey"><div className="journey-empty"><span className="crm-overline">ATELIER / GRACE PRO</span><h1>{done ? "E-mail confirmado." : "Confirme seu e-mail."}</h1><p>{done ? "Seu endereço está confirmado. Continue acompanhando seu salão." : "Confirme o endereço para que a equipe possa validar seu nível de compra."}</p>{error && <p className="crm-error" role="alert">{error}</p>}{done ? <Link className="crm-btn primary" href="/meu-nivel">Continuar para meu perfil</Link> : <button className="crm-btn primary" disabled={busy || !token} onClick={async () => { setBusy(true); setError(""); try { const r = await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"verify",code:token})}); const d=await r.json(); if(!r.ok)throw new Error(d.error); setDone(true); } catch(e){setError((e as Error).message);} finally{setBusy(false);} }}>{busy ? "Confirmando…" : "Confirmar meu e-mail"}</button>}<p><Link href="/entrar">Voltar ao acesso</Link></p></div></main>;
}
