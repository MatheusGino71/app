"use client";
import { useI18n } from "../i18n/language-provider";
import LanguageSelector from "../i18n/language-selector";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { actionFromVisit, emptyDiagnostic, makeVisit, parseDiagnostic, parseDraft, parseSalon, type Draft, type OnboardingProfile, type Salon, type User, type WorkspaceData } from "../../../lib/domain";
import { initialOnboardingDraft, ONBOARDING_DEMO_KEY } from "../../../lib/onboarding";
import DiagnosticForm from "../crm/diagnostic-form";
import EmailStatus from "./email-status";
export default function OnboardingFlow({ demo, user, profile, savedDraft, fresh }: { demo: boolean; user: User; profile: OnboardingProfile | null; savedDraft: Draft | null; fresh: boolean }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(() => initialOnboardingDraft(user, profile, savedDraft));
  const [ready, setReady] = useState(!demo); const [notice, setNotice] = useState(""); const [transition, setTransition] = useState(false);
  useEffect(() => {
    if (!demo) return;
    try { const raw = localStorage.getItem(ONBOARDING_DEMO_KEY); if (raw) { const saved = JSON.parse(raw); setDraft(initialOnboardingDraft(user, saved.profile ?? null, saved.draft ? parseDraft(saved.draft) : null)); } }
    catch { setNotice("Não foi possível restaurar o rascunho. Você pode preencher uma nova ficha."); }
    setReady(true);
  }, [demo, user]);
  const data: WorkspaceData = { salons: profile ? [profile.salon] : [], visits: profile ? [profile.visit] : [], actions: [], users: [user], draft: savedDraft };
  async function finish(value: Draft) {
    if (value.diagnostic.annualPurchase === null) throw new Error("Informe a compra anual para descobrir seu nível.");
    if (demo) {
      const previous = JSON.parse(localStorage.getItem(ONBOARDING_DEMO_KEY) || "{}");
      const fields = parseSalon(value.salon); const diagnostic = parseDiagnostic({ ...value.diagnostic, assessments: emptyDiagnostic().assessments, source: "Informado pelo responsável do salão" });
      const now = new Date().toISOString(); const salon: Salon = { ...fields, id: value.salonId || crypto.randomUUID(), ownerId: user.id, createdAt: previous.profile?.salon.createdAt ?? now, version: value.version + 1 };
      const visit = makeVisit(salon.id, diagnostic, user, crypto.randomUUID(), now);
      const agreement = actionFromVisit(visit, crypto.randomUUID());
      localStorage.setItem(ONBOARDING_DEMO_KEY, JSON.stringify({ profile: { salon, visit }, draft: null, agreement }));
    } else {
      const response = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Não foi possível concluir seu diagnóstico.");
    }
    setTransition(true);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) await new Promise(resolve => setTimeout(resolve, 650));
    window.location.assign(demo ? "/meu-nivel?demo=1" : "/meu-nivel");
  }
  async function save(value: Draft) {
    const parsed = parseDraft(value);
    if (demo) { const previous = JSON.parse(localStorage.getItem(ONBOARDING_DEMO_KEY) || "{}"); localStorage.setItem(ONBOARDING_DEMO_KEY, JSON.stringify({ ...previous, draft: parsed })); }
    else { const response = await fetch("/api/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "draft", payload: parsed }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Não foi possível salvar o rascunho."); }
    setNotice("Rascunho salvo. Você pode continuar agora ou retomar ao acessar sua conta.");
  }
  return <main className="crm crm-journey">
    <header className="journey-header"><LanguageSelector/><Link className="crm-brand" href="/">{t("ATELIER")}<span>.</span></Link><span>{t("GRACE PRO")} <i /> {t("CONHECER PARA CRESCER")}</span><Link href={demo || user.role === "cliente" ? "/entrar" : "/workspace"}>{demo || user.role === "cliente" ? t("Voltar ao acesso") : t("Meu workspace")}<ArrowRight size={15} /></Link></header>
    <div className="journey-content"><div className="journey-breadcrumb" aria-label={t("Progresso do cadastro")}><span className="complete"><Check size={13} />{demo ? t("Demonstração") : t("Conta criada")}</span><i /><span className="current">{t("02 · Seu salão")}</span><i /><span>{t("03 · Seu nível")}</span></div>
      {fresh && <p className="journey-welcome">{demo ? t("Experimente o caminho completo com dados fictícios.") : t("Bem-vindo, {v0}. Sua conta está pronta; agora é a vez do seu salão.", { v0: user.name.split(" ")[0] })}</p>}
      {!demo && user.role === "cliente" && <EmailStatus verified={user.emailVerified}/>}
      {notice && <div className="crm-note" role="status">{t(notice)}</div>}
      {ready ? <DiagnosticForm data={data} initialDraft={draft} onboarding onSave={finish} onDraft={save} onCancel={() => window.location.assign(demo || user.role === "cliente" ? "/entrar" : "/workspace")} /> : <div className="journey-loading" role="status">{t("Preparando sua ficha…")}</div>}
      <footer className="journey-footer"><ShieldCheck size={14} />{t("Seu perfil é construído com as informações do seu salão.")}</footer>
    </div>
    {transition && <div className="journey-transition" role="status" aria-live="polite"><span className="journey-transition-mark">{t("A.")}</span><span className="crm-overline">{t("DIAGNÓSTICO CONCLUÍDO")}</span><h2>{t("Seu perfil está pronto.")}</h2><p>{t("Vamos conhecer seu nível Grace Pro.")}</p><ArrowRight size={24} /></div>}
  </main>;
}
