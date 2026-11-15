"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronRight, Layers3, Sparkles } from "lucide-react";
import { categoryFor, profileLevel, type User, dateLabel, DIMENSIONS, LABELS, money, PURCHASE_LEVELS, type OnboardingProfile } from "../../../lib/domain";
import { ONBOARDING_DEMO_KEY } from "../../../lib/onboarding";
import EmailStatus from "./email-status";
import EvidenceFiles from "./evidence-files";
import { Stars, Tier } from "../crm/ui";
type LevelName = typeof PURCHASE_LEVELS[number]["name"];
export default function LevelResult({ demo, profile: initialProfile, user }: { demo: boolean; profile: OnboardingProfile | null; user?: User }) {
  const [profile, setProfile] = useState(initialProfile); const [ready, setReady] = useState(!demo);
  const initialCategory = initialProfile ? profileLevel(initialProfile).category : null;
  const [comparing, setComparing] = useState<LevelName | null>(PURCHASE_LEVELS.some(l => l.name === initialCategory) ? initialCategory as LevelName : null);
  useEffect(() => {
    if (!demo) return;
    try { const saved = JSON.parse(localStorage.getItem(ONBOARDING_DEMO_KEY) || "{}"); if (saved.profile?.salon && saved.profile?.visit?.diagnostic) { setProfile(saved.profile); const category = categoryFor(saved.profile.visit.diagnostic.annualPurchase); if (PURCHASE_LEVELS.some(l => l.name === category)) setComparing(category as LevelName); } } catch {}
    setReady(true);
  }, [demo]);
  const diagnosticUrl = demo ? "/diagnostico?demo=1" : "/diagnostico";
  if (!ready) return <main className="crm crm-journey"><div className="journey-loading" role="status">Preparando seu nível…</div></main>;
  if (!profile) return <main className="crm crm-journey"><div className="journey-empty"><span className="crm-overline">ATELIER / GRACE PRO</span><h1>Seu salão tem uma história.</h1><p>Preencha o diagnóstico para descobrir seu nível e comparar os demais.</p><Link className="crm-btn primary" href={diagnosticUrl}>Preencher diagnóstico <ArrowRight size={17} /></Link></div></main>;
  const { salon, visit } = profile; const d = visit.diagnostic; const effective = profileLevel(profile); const category = effective.category;
  const amount = effective.amount ?? 0; const nextLevel = PURCHASE_LEVELS.find(level => amount < level.minimum);
  const selectedLevel = PURCHASE_LEVELS.find(level => level.name === comparing);
  return <main className="crm crm-journey crm-level-page">
    <header className="journey-header"><Link className="crm-brand" href="/">ATELIER<span>.</span></Link><span>GRACE PRO <i /> SEU PERFIL COMERCIAL</span><Link href={diagnosticUrl}>Atualizar diagnóstico <ArrowUpRight size={15} /></Link></header>
    <div className="journey-result-content">
      {demo && <div className="crm-demo-banner">Demonstração · O resultado usa apenas os dados fictícios preenchidos neste navegador.</div>}
      {!demo && user?.role === "cliente" && <EmailStatus verified={user.emailVerified}/>}
      {!effective.confirmed && <div className="crm-note">Seu enquadramento é uma estimativa com base no valor informado. A equipe vai conferir as compras antes de confirmar o nível.</div>}
      {profile.review?.status === "rejected" && <div className="crm-error-banner">A equipe solicitou uma correção: {profile.review.note}</div>}
      {effective.confirmed && effective.pending && <div className="crm-note">Um novo diagnóstico aguarda conferência. Seu nível confirmado permanece válido até a nova análise.</div>}
      <div className="journey-breadcrumb"><span className="complete"><Check size={13} />Conta</span><i /><span className="complete"><Check size={13} />Diagnóstico</span><i /><span className="current">03 · Seu nível</span></div>
      <section className={`journey-level-hero level-${category.toLowerCase().replaceAll(" ", "-")}`} aria-labelledby="my-level-title"><div><span className="crm-overline"><CheckCircle2 size={14} />{effective.confirmed ? "NÍVEL CONFERIDO PELA GRACE PRO" : "ESTIMATIVA · AGUARDANDO CONFERÊNCIA"}</span><h1 id="my-level-title">{category === "EM DESENVOLVIMENTO" ? "Seu próximo capítulo começa aqui." : category === "SEM DADOS" ? "Seu perfil está em construção." : <>{effective.confirmed ? "Seu salão é" : "Seu nível estimado é"}<br /><em>{category}.</em></>}</h1><p>{salon.name} · {salon.city}, {salon.country}</p><div className="journey-assigned-level"><span>SEU NÍVEL ATUAL</span><Tier category={category} /></div></div><div className="journey-level-seal" aria-hidden="true"><span>GRACE PRO</span><strong>{category === "EM DESENVOLVIMENTO" || category === "SEM DADOS" ? "A." : category.charAt(0)}</strong><span>{category === "EM DESENVOLVIMENTO" ? "UM NOVO COMEÇO" : category}</span></div></section>
      <div className="journey-result-facts"><div><span>Compra líquida em 12 meses</span><strong>{money(effective.amount)}</strong></div><div><span>Data de corte</span><strong>{dateLabel(effective.cutoff)}</strong></div><div><span>Como seu nível foi definido</span><strong>Automaticamente, pela compra anual</strong></div></div>
      <p className="journey-result-note">Resultado calculado com base nos dados informados. Fonte: {effective.source || "não informada"}. As estrelas são independentes e não alteram seu nível.</p>
      {nextLevel ? <section className="journey-next-level"><Sparkles size={20} /><div><strong>Seu próximo marco: {nextLevel.name}</strong><p>Faltam {money(Math.max(0, nextLevel.minimum - amount))} para a faixa de {money(nextLevel.minimum)} nos últimos 12 meses.</p></div><a href="#comparar-niveis">Comparar níveis <ArrowRight size={16} /></a></section> : category === "ICON" && <section className="journey-next-level"><Sparkles size={20} /><div><strong>Você está no maior nível de compra.</strong><p>Continue acompanhando a evolução do seu salão nas seis dimensões.</p></div><a href="#comparar-niveis">Conhecer os níveis <ArrowRight size={16} /></a></section>}
      <section id="comparar-niveis" className="journey-comparison" aria-labelledby="compare-title"><div className="journey-section-head"><span className="crm-overline">UM OLHAR PARA CADA ETAPA</span><h2 id="compare-title">Conheça os outros níveis.</h2><p>Compare as faixas de compra e entenda onde seu salão está hoje.</p></div><div className="journey-level-cards">{PURCHASE_LEVELS.map((level, index) => { const assigned = category === level.name; const selected = comparing === level.name; return <article key={level.name} className={`${assigned ? "assigned" : ""} ${selected ? "selected" : ""}`}><div className="journey-card-top"><span>0{index + 1}</span>{assigned && <span className="journey-your-level"><Check size={12} />Seu nível</span>}</div><Tier category={level.name} /><h3>{level.name}</h3><div className="journey-card-amount">{money(level.minimum)}<span>{level.maximum ? `a menos de ${money(level.maximum)}` : "ou mais"}</span></div><p>{level.description}</p><button className="crm-btn" aria-pressed={selected} aria-controls="level-comparison-detail" onClick={() => setComparing(level.name)}>{selected ? "Visualizando este nível" : assigned ? "Conhecer meu nível" : "Comparar este nível"}<ChevronRight size={16} /></button></article>; })}</div>
        <div id="level-comparison-detail" className="journey-comparison-detail" aria-live="polite">{selectedLevel ? <><Layers3 size={22} /><div><span className="crm-overline">{selectedLevel.name === category ? "SEU ENQUADRAMENTO" : "COMPARANDO COM SEU NÍVEL ATUAL"}</span><h3>{selectedLevel.name}</h3><p>{selectedLevel.description}</p><p>Faixa: {money(selectedLevel.minimum)} {selectedLevel.maximum ? `a menos de ${money(selectedLevel.maximum)}` : "ou mais"} em 12 meses.{selectedLevel.name !== category && <> Seu nível permanece <strong>{category}</strong>, com {money(effective.amount)}.</>}</p></div></> : <p>Selecione um nível acima para explorar. Abaixo de €400, seu salão fica em desenvolvimento; ao atingir esse marco, entra em ORIGIN.</p>}</div>
      </section>
      <section className="journey-dimensions"><div className="journey-section-head"><span className="crm-overline">ALÉM DA COMPRA</span><h2>Seis perspectivas do seu salão.</h2><p>As avaliações qualitativas dependem das evidências e da análise comercial. A capacidade é calculada pela estrutura informada.</p></div><div>{DIMENSIONS.map(key => <article key={key}><span>{LABELS[key]}</span><Stars score={d.assessments[key].score} /></article>)}</div></section>
      {!demo && <EvidenceFiles salonId={salon.id}/>}
      <div className="journey-result-actions"><Link className="crm-btn primary" href={diagnosticUrl}>Atualizar informações <ArrowRight size={16} /></Link>{(demo || user?.role !== "cliente") && <Link className="crm-btn quiet" href={demo ? "/workspace?demo=1" : "/workspace"}>Explorar workspace <ArrowUpRight size={16} /></Link>}<button className="crm-btn quiet" onClick={async()=>{await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"logout"})});window.location.assign("/entrar");}}>Sair da conta</button></div><footer className="journey-footer">ATELIER. · Informação com propósito.</footer>
    </div>
  </main>;
}
