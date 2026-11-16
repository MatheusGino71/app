"use client";
import { useI18n } from "../i18n/language-provider";
import LanguageSelector from "../i18n/language-selector";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronRight, Layers3, Sparkles } from "lucide-react";
import { categoryFor, profileLevel, type User, DIMENSIONS, LABELS, PURCHASE_LEVELS, type OnboardingProfile } from "../../../lib/domain";
import { ONBOARDING_DEMO_KEY } from "../../../lib/onboarding";
import EmailStatus from "./email-status";
import EvidenceFiles from "./evidence-files";
import { Stars, Tier } from "../crm/ui";
type LevelName = typeof PURCHASE_LEVELS[number]["name"];
export default function LevelResult({ demo, profile: initialProfile, user }: { demo: boolean; profile: OnboardingProfile | null; user?: User }) {
  const { t, money, dateLabel } = useI18n();
  const [profile, setProfile] = useState(initialProfile); const [ready, setReady] = useState(!demo);
  const initialCategory = initialProfile ? profileLevel(initialProfile).category : null;
  const [comparing, setComparing] = useState<LevelName | null>(PURCHASE_LEVELS.some(l => l.name === initialCategory) ? initialCategory as LevelName : null);
  useEffect(() => {
    if (!demo) return;
    try { const saved = JSON.parse(localStorage.getItem(ONBOARDING_DEMO_KEY) || "{}"); if (saved.profile?.salon && saved.profile?.visit?.diagnostic) { setProfile(saved.profile); const category = categoryFor(saved.profile.visit.diagnostic.annualPurchase); if (PURCHASE_LEVELS.some(l => l.name === category)) setComparing(category as LevelName); } } catch {}
    setReady(true);
  }, [demo]);
  const diagnosticUrl = demo ? "/diagnostico?demo=1" : "/diagnostico";
  if (!ready) return <main className="crm crm-journey"><div className="journey-loading" role="status">{t("Preparando seu nível…")}</div></main>;
  if (!profile) return <main className="crm crm-journey"><div className="journey-empty"><span className="crm-overline">{t("GRACE PRO")}</span><h1>{t("Seu salão tem uma história.")}</h1><p>{t("Preencha o diagnóstico para descobrir seu nível e comparar os demais.")}</p><Link className="crm-btn primary" href={diagnosticUrl}>{t("Preencher diagnóstico")} <ArrowRight size={17} /></Link></div></main>;
  const { salon, visit } = profile; const d = visit.diagnostic; const effective = profileLevel(profile); const category = effective.category;
  const amount = effective.amount ?? 0; const nextLevel = PURCHASE_LEVELS.find(level => amount < level.minimum);
  const selectedLevel = PURCHASE_LEVELS.find(level => level.name === comparing);
  const sourceLabel = effective.source === "Informado pelo responsável do salão" ? t(effective.source) : effective.source || t("não informada");
  return <main className="crm crm-journey crm-level-page">
    <header className="journey-header"><LanguageSelector/><Link className="crm-brand" href="/">{t("GRACE PRO")}<span>.</span></Link><span>{t("GRACE PRO")} <i /> {t("SEU PERFIL COMERCIAL")}</span><Link href={diagnosticUrl}>{t("Atualizar diagnóstico")} <ArrowUpRight size={15} /></Link></header>
    <div className="journey-result-content">
      {demo && <div className="crm-demo-banner">{t("Demonstração · O resultado usa apenas os dados fictícios preenchidos neste navegador.")}</div>}
      {!demo && user?.role === "cliente" && <EmailStatus verified={user.emailVerified}/>}
      {!effective.confirmed && <div className="crm-note">{t("Seu enquadramento é uma estimativa com base no valor informado. A equipe vai conferir as compras antes de confirmar o nível.")}</div>}
      {profile.review?.status === "rejected" && <div className="crm-error-banner">{t("A equipe solicitou uma correção:")} {profile.review.note}</div>}
      {effective.confirmed && effective.pending && <div className="crm-note">{t("Um novo diagnóstico aguarda conferência. Seu nível confirmado permanece válido até a nova análise.")}</div>}
      <div className="journey-breadcrumb"><span className="complete"><Check size={13} />{t("Conta")}</span><i /><span className="complete"><Check size={13} />{t("Diagnóstico")}</span><i /><span className="current">{t("03 · Seu nível")}</span></div>
      <section className={`journey-level-hero level-${category.toLowerCase().replaceAll(" ", "-")}`} aria-labelledby="my-level-title"><div><span className="crm-overline"><CheckCircle2 size={14} />{effective.confirmed ? t("NÍVEL CONFERIDO PELA GRACE PRO") : t("ESTIMATIVA · AGUARDANDO CONFERÊNCIA")}</span><h1 id="my-level-title">{category === "EM DESENVOLVIMENTO" ? t("Seu próximo capítulo começa aqui.") : category === "SEM DADOS" ? t("Seu perfil está em construção.") : <>{effective.confirmed ? t("Seu salão é") : t("Seu nível estimado é")}<br /><em>{t(category)}.</em></>}</h1><p>{salon.name} · {salon.city}, {salon.country}</p><div className="journey-assigned-level"><span>{t("SEU NÍVEL ATUAL")}</span><Tier category={category} /></div></div><div className="journey-level-seal" aria-hidden="true"><span>{t("GRACE PRO")}</span><strong>{category === "EM DESENVOLVIMENTO" || category === "SEM DADOS" ? t("G.") : category.charAt(0)}</strong><span>{category === "EM DESENVOLVIMENTO" ? t("UM NOVO COMEÇO") : t(category)}</span></div></section>
      <div className="journey-result-facts"><div><span>{t("Compra líquida em 12 meses")}</span><strong>{money(effective.amount)}</strong></div><div><span>{t("Data de corte")}</span><strong>{dateLabel(effective.cutoff)}</strong></div><div><span>{t("Como seu nível foi definido")}</span><strong>{t("Automaticamente, pela compra anual")}</strong></div></div>
      <p className="journey-result-note">{t("Resultado calculado com base nos dados informados. Fonte:")} {sourceLabel}{t(". As estrelas são independentes e não alteram seu nível.")}</p>
      {nextLevel ? <section className="journey-next-level"><Sparkles size={20} /><div><strong>{t("Seu próximo marco:")} {nextLevel.name}</strong><p>{t("Faltam")} {money(Math.max(0, nextLevel.minimum - amount))} {t("para a faixa de")} {money(nextLevel.minimum)} {t("nos últimos 12 meses.")}</p></div><a href="#comparar-niveis">{t("Comparar níveis")} <ArrowRight size={16} /></a></section> : category === "ICON" && <section className="journey-next-level"><Sparkles size={20} /><div><strong>{t("Você está no maior nível de compra.")}</strong><p>{t("Continue acompanhando a evolução do seu salão nas seis dimensões.")}</p></div><a href="#comparar-niveis">{t("Conhecer os níveis")} <ArrowRight size={16} /></a></section>}
      <section id="comparar-niveis" className="journey-comparison" aria-labelledby="compare-title"><div className="journey-section-head"><span className="crm-overline">{t("UM OLHAR PARA CADA ETAPA")}</span><h2 id="compare-title">{t("Conheça os outros níveis.")}</h2><p>{t("Compare as faixas de compra e entenda onde seu salão está hoje.")}</p></div><div className="journey-level-cards">{PURCHASE_LEVELS.map((level, index) => { const assigned = category === level.name; const selected = comparing === level.name; return <article key={level.name} className={`${assigned ? "assigned" : ""} ${selected ? "selected" : ""}`}><div className="journey-card-top"><span>0{index + 1}</span>{assigned && <span className="journey-your-level"><Check size={12} />{t("Seu nível")}</span>}</div><Tier category={level.name} /><h3>{level.name}</h3><div className="journey-card-amount">{money(level.minimum)}<span>{level.maximum ? t("a menos de {v0}", { v0: money(level.maximum) }) : t("ou mais")}</span></div><p>{t(level.description)}</p><button className="crm-btn" aria-pressed={selected} aria-controls="level-comparison-detail" onClick={() => setComparing(level.name)}>{selected ? t("Visualizando este nível") : assigned ? t("Conhecer meu nível") : t("Comparar este nível")}<ChevronRight size={16} /></button></article>; })}</div>
        <div id="level-comparison-detail" className="journey-comparison-detail" aria-live="polite">{selectedLevel ? <><Layers3 size={22} /><div><span className="crm-overline">{selectedLevel.name === category ? t("SEU ENQUADRAMENTO") : t("COMPARANDO COM SEU NÍVEL ATUAL")}</span><h3>{selectedLevel.name}</h3><p>{t(selectedLevel.description)}</p><p>{t("Faixa:")} {money(selectedLevel.minimum)} {selectedLevel.maximum ? t("a menos de {v0}", { v0: money(selectedLevel.maximum) }) : t("ou mais")} {t("em 12 meses.")}{selectedLevel.name !== category && <> {t("Seu nível permanece")} <strong>{t(category)}</strong>{t(", com")} {money(effective.amount)}.</>}</p></div></> : <p>{t("Selecione um nível acima para explorar. Abaixo de €400, seu salão fica em desenvolvimento; ao atingir esse marco, entra em ORIGIN.")}</p>}</div>
      </section>
      <section className="journey-dimensions"><div className="journey-section-head"><span className="crm-overline">{t("ALÉM DA COMPRA")}</span><h2>{t("Seis perspectivas do seu salão.")}</h2><p>{t("As avaliações qualitativas dependem das evidências e da análise comercial. A capacidade é calculada pela estrutura informada.")}</p></div><div>{DIMENSIONS.map(key => <article key={key}><span>{t(LABELS[key])}</span><Stars score={d.assessments[key].score} /></article>)}</div></section>
      {!demo && <EvidenceFiles salonId={salon.id}/>}
      <div className="journey-result-actions"><Link className="crm-btn primary" href={diagnosticUrl}>{t("Atualizar informações")} <ArrowRight size={16} /></Link>{(demo || user?.role !== "cliente") && <Link className="crm-btn quiet" href={demo ? "/workspace?demo=1" : "/workspace"}>{t("Explorar workspace")} <ArrowUpRight size={16} /></Link>}<button className="crm-btn quiet" onClick={async()=>{await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"logout"})});window.location.assign("/entrar");}}>{t("Sair da conta")}</button></div><footer className="journey-footer">{t("GRACE PRO. · Informação com propósito.")}</footer>
    </div>
  </main>;
}
