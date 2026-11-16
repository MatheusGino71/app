"use client";
import { useI18n } from "../i18n/language-provider";
import LanguageSelector from "../i18n/language-selector";
import { useState } from "react";
import Link from "next/link";
export default function VerifyEmail({ token }: { token: string }) {
  const { t } = useI18n();
  const [done,setDone] = useState(false); const [busy,setBusy] = useState(false); const [error,setError] = useState("");
  return <main className="crm crm-journey"><div className="journey-empty"><LanguageSelector/><span className="crm-overline">{t("GRACE PRO")}</span><h1>{done ? t("E-mail confirmado.") : t("Confirme seu e-mail.")}</h1><p>{done ? t("Seu endereço está confirmado. Continue acompanhando seu salão.") : t("Confirme o endereço para que a equipe possa validar seu nível de compra.")}</p>{error && <p className="crm-error" role="alert">{t(error)}</p>}{done ? <Link className="crm-btn primary" href="/meu-nivel">{t("Continuar para meu perfil")}</Link> : <button className="crm-btn primary" disabled={busy || !token} onClick={async () => { setBusy(true); setError(""); try { const r = await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"verify",code:token})}); const d=await r.json(); if(!r.ok)throw new Error(d.error); setDone(true); } catch(e){setError((e as Error).message);} finally{setBusy(false);} }}>{busy ? t("Confirmando…") : t("Confirmar meu e-mail")}</button>}<p><Link href="/entrar">{t("Voltar ao acesso")}</Link></p></div></main>;
}
