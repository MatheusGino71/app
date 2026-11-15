"use client";
import { useI18n } from "./i18n/language-provider";
import LanguageSelector from "./i18n/language-selector";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Info, LockKeyhole, Sparkles } from "lucide-react";
type Mode = "login" | "signup" | "forgot" | "reset";
type Field = "name" | "email" | "password" | "confirmPassword" | "code";
const copy = {
  login: { eyebrow: "ACESSO DA EQUIPE GRACE PRO", title: "Entrar", description: "", submit: "Entrar na minha conta" },
  signup: { eyebrow: "ACESSO DA EQUIPE GRACE PRO", title: "Criar conta", description: "", submit: "Criar conta" },
  forgot: { eyebrow: "VAMOS AJUDAR VOCÊ", title: "Recupere seu acesso.", description: "Informe seu e-mail para receber um link de recuperação.", submit: "Enviar link de recuperação" },
  reset: { eyebrow: "UM NOVO ACESSO", title: "Escolha sua nova senha.", description: "Confirme seu e-mail e defina uma nova senha para sua conta.", submit: "Atualizar minha senha" },
};
export default function AccountForm({ embedded = false, onBack, initialMode = "login", initialCode = "" }: { embedded?: boolean; onBack?: () => void; initialMode?: Mode; initialCode?: string }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [values, setValues] = useState<Record<Field,string>>({ name: "", email: "", password: "", confirmPassword: "", code: initialCode });
  const [errors, setErrors] = useState<Partial<Record<Field,string>>>({});
  const [visiblePassword, setVisiblePassword] = useState(false); const [remember, setRemember] = useState(false);
  const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false); const [needsSetup, setNeedsSetup] = useState(false); const [mailReady, setMailReady] = useState(false); const [transition, setTransition] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null); const current = copy[mode]; const Container = embedded ? "div" : "main";
  useEffect(() => { let active = true; fetch("/api/auth", { cache: "no-store" }).then(r => r.json()).then(d => { if (active) { setNeedsSetup(d.needsSetup === true); setMailReady(d.mailReady === true); } }).catch(() => {}); return () => { active = false; }; }, []);
  function changeMode(next: Mode) { setMode(next); setErrors({}); setNotice(""); setVisiblePassword(false); setValues(v => ({ ...v, password: "", confirmPassword: "", code: "" })); heading.current?.focus(); }
  function update(field: Field, value: string) { setValues(v => ({ ...v, [field]: value })); setErrors(e => ({ ...e, [field]: undefined })); setNotice(""); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; const next: Partial<Record<Field,string>> = {};
    if (mode === "signup" && values.name.trim().length < 2) next.name = "Informe seu nome completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = "Informe um e-mail válido.";
    if (mode !== "forgot" && !values.password) next.password = "Informe sua senha.";
    if ((mode === "signup" || mode === "reset") && (values.password.length < 10 || values.password.length > 128)) next.password = "Use entre 10 e 128 caracteres.";
    if ((mode === "signup" || mode === "reset") && values.password !== values.confirmPassword) next.confirmPassword = "As senhas precisam ser iguais.";
    if ((mode === "reset" || mode === "signup") && !values.code.trim()) next.code = "Informe um código válido.";
    setErrors(next); if (Object.keys(next).length) { event.currentTarget.querySelector<HTMLInputElement>(`[name="${Object.keys(next)[0]}"]`)?.focus(); return; }
    setBusy(true); setNotice("");
    try {
      const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: mode, ...values, remember, kind: "staff" }) });
      const result = await r.json(); if (!r.ok) throw new Error(result.error || "Não foi possível acessar sua conta.");
      if (mode === "forgot") setNotice(result.message);
      else if (mode === "reset") { setMode("login"); setNotice("Senha atualizada. Entre com sua nova senha."); }
      else { setTransition(true); if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) await new Promise(resolve => setTimeout(resolve, 550)); window.location.assign(result.redirectTo || "/workspace"); }
    } catch (e) { setNotice((e as Error).message); }
    finally { setValues(v => ({ ...v, password: "", confirmPassword: "" })); setBusy(false); }
  }
  function input(field: Field, label: string, type = "text", autoComplete = "off") {
    return <div className="account-field"><label htmlFor={`account-${field}`}>{t(label)}</label><input id={`account-${field}`} name={field} type={type} autoComplete={autoComplete} value={values[field]} onChange={e => update(field,e.target.value)} required aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `${field}-error` : undefined} />{errors[field] && <span className="account-error" id={`${field}-error`}>{t(errors[field]!)}</span>}</div>;
  }
  return <Container className="account-page">
    {transition && <div className="account-flow-transition" role="status"><span className="account-transition-mark">{t("A.")}</span><span>{t("ATELIER / GRACE PRO")}</span><h2>{mode === "signup" ? t("Sua conta está pronta.") : t("Boas-vindas de volta.")}</h2><p>{t("Preparando o painel da operação.")}</p><ArrowRight size={22}/></div>}
    <div className="account-shell"><section className="account-left" aria-labelledby="account-title">
      <div className="account-topbar">{onBack ? <button type="button" onClick={onBack} className="account-brand">ATELIER<span>.</span></button> : <Link className="account-brand" href="/">ATELIER<span>.</span></Link>}<div className="account-topbar-actions"><LanguageSelector/>{onBack ? <button type="button" onClick={onBack} className="account-back"><ArrowLeft size={14}/>{t("Voltar")}</button> : <Link className="account-back" href="/"><ArrowLeft size={14}/>{t("Voltar")}</Link>}</div></div>
      <div className="account-form-wrap"><span className="account-eyebrow"><i/>{t(current.eyebrow)}</span><h1 id="account-title" className={!current.description ? "account-title-compact" : undefined} ref={heading} tabIndex={-1}>{t(current.title)}</h1>{current.description && <p className="account-description">{t(current.description)}</p>}
      <form onSubmit={submit} noValidate>
        {mode === "signup" && input("name","Nome completo","text","name")}{input("email","E-mail","email","email")}
        {mode !== "forgot" && <div className="account-field"><label htmlFor="account-password">{mode === "reset" ? t("Nova senha") : t("Senha")}</label><div className="account-password"><input id="account-password" name="password" type={visiblePassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} maxLength={128} placeholder={mode === "login" ? t("Digite sua senha") : t("Use 10 ou mais caracteres")} value={values.password} onChange={e => update("password",e.target.value)} aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error" : undefined}/><button type="button" aria-label={visiblePassword ? t("Ocultar senha") : t("Mostrar senha")} onClick={() => setVisiblePassword(!visiblePassword)}>{visiblePassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>{errors.password && <span className="account-error" id="password-error">{t(errors.password)}</span>}</div>}
        {(mode === "signup" || mode === "reset") && input("confirmPassword","Confirmar senha",visiblePassword ? "text" : "password","new-password")}
        {(mode === "reset" || mode === "signup") && input("code",mode === "reset" ? "Código de recuperação" : needsSetup ? "Código de configuração da equipe" : "Código de convite da equipe")}
        {mode === "login" && <div className="account-options"><label className="account-remember"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/>{t("Manter conectado")}</label><button type="button" className="account-text-button" onClick={() => changeMode(mailReady ? "forgot" : "reset")}>{t("Esqueceu a senha?")}</button></div>}
        <button className="account-submit" disabled={busy} type="submit">{busy ? t("Processando…") : t(current.submit)}<ArrowRight size={16}/></button>
      </form>
      {notice && <div className="account-notice" role="status"><Info size={17}/><p>{t(notice)}</p></div>}
      {mode === "signup" && <p className="account-description">{t("Contas da equipe exigem convite ou o código de configuração inicial.")}</p>}
      <p className="account-switch">{mode === "login" ? <>{t("Ainda não tem conta?")} <button type="button" onClick={() => changeMode("signup")}>{t("Criar conta")}</button></> : <>{t("Já tem uma conta?")} <button type="button" onClick={() => changeMode("login")}>{t("Entrar")}</button></>}</p>
      {mode === "forgot" && <p className="account-switch"><button type="button" onClick={() => changeMode("reset")}>{t("Já tenho um código de recuperação")}</button></p>}
      </div><div className="account-bottom"><span>© {new Date().getFullYear()} {t("Atelier")}</span><span><LockKeyhole size={12}/>{t("Informação com propósito.")}</span></div>
    </section>
      <aside className="account-art" aria-label={t("Conheça melhor. Conquiste mais.")}>
        <div className="account-art-texture" aria-hidden="true"><span className="account-ribbon ribbon-one" /><span className="account-ribbon ribbon-two" /><span className="account-ribbon ribbon-three" /><span className="account-ribbon ribbon-four" /><span className="account-ribbon ribbon-five" /></div>
        <div className="account-art-top"><span>{t("UM NOVO OLHAR.")}</span><Sparkles size={19} strokeWidth={1.2} /></div>
        <div className="account-art-heading"><span className="account-art-mark">{t("A")}<span>.</span></span><h2>{t("Conheça melhor.")}<br /><em>{t("Conquiste mais.")}</em></h2><p>{t("Existe potencial em cada conversa.")}<br />{t("A gente ajuda você a enxergar.")}</p></div>
        <div className="account-art-note"><span className="account-note-icon"><Check size={18} /></span><div><strong>{t("Relacionamentos que abrem portas.")}</strong><p>{t("Conecte cada visita a novas possibilidades para o seu negócio.")}</p><span>{t("CAPTAR")} <i /> {t("ENTENDER")} <i /> {t("AGIR")}</span></div></div>
        <span className="account-art-footer">{t("INTELIGÊNCIA EM CADA DECISÃO.")}</span>
      </aside>
    </div>
  </Container>;
}
