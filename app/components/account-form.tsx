"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Eye, EyeOff, Info, LockKeyhole, Sparkles } from "lucide-react";
type Mode = "login" | "signup" | "forgot" | "reset";
type Field = "name" | "email" | "password" | "confirmPassword" | "code";
const copy = {
  login: { eyebrow: "SEU ESPAÇO ESPERA POR VOCÊ", title: "Boas-vindas de volta.", description: "Entre para acompanhar seu salão e seu nível Grace Pro.", submit: "Entrar na minha conta" },
  signup: { eyebrow: "UM NOVO CAPÍTULO COMEÇA AQUI", title: "Vamos nos conhecer?", description: "Crie sua conta e descubra o perfil do seu salão.", submit: "Criar conta e continuar" },
  forgot: { eyebrow: "VAMOS AJUDAR VOCÊ", title: "Recupere seu acesso.", description: "Informe seu e-mail para receber um link de recuperação.", submit: "Enviar link de recuperação" },
  reset: { eyebrow: "UM NOVO ACESSO", title: "Escolha sua nova senha.", description: "Confirme seu e-mail e defina uma nova senha para sua conta.", submit: "Atualizar minha senha" },
};
export default function AccountForm({ embedded = false, onBack, staff = false, initialMode = "login", initialCode = "" }: { embedded?: boolean; onBack?: () => void; staff?: boolean; initialMode?: Mode; initialCode?: string }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [values, setValues] = useState<Record<Field,string>>({ name: "", email: "", password: "", confirmPassword: "", code: initialCode });
  const [errors, setErrors] = useState<Partial<Record<Field,string>>>({});
  const [visiblePassword, setVisiblePassword] = useState(false); const [remember, setRemember] = useState(false);
  const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false); const [needsSetup, setNeedsSetup] = useState(false); const [transition, setTransition] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null); const current = copy[mode]; const Container = embedded ? "div" : "main";
  useEffect(() => { if (!staff) return; let active = true; fetch("/api/auth", { cache: "no-store" }).then(r => r.json()).then(d => { if (active) setNeedsSetup(d.needsSetup === true); }).catch(() => {}); return () => { active = false; }; }, [staff]);
  function changeMode(next: Mode) { setMode(next); setErrors({}); setNotice(""); setVisiblePassword(false); setValues(v => ({ ...v, password: "", confirmPassword: "", code: "" })); heading.current?.focus(); }
  function update(field: Field, value: string) { setValues(v => ({ ...v, [field]: value })); setErrors(e => ({ ...e, [field]: undefined })); setNotice(""); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; const next: Partial<Record<Field,string>> = {};
    if (mode === "signup" && values.name.trim().length < 2) next.name = "Informe seu nome completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = "Informe um e-mail válido.";
    if (mode !== "forgot" && !values.password) next.password = "Informe sua senha.";
    if ((mode === "signup" || mode === "reset") && (values.password.length < 10 || values.password.length > 128)) next.password = "Use entre 10 e 128 caracteres.";
    if ((mode === "signup" || mode === "reset") && values.password !== values.confirmPassword) next.confirmPassword = "As senhas precisam ser iguais.";
    if ((mode === "reset" || staff && mode === "signup") && !values.code.trim()) next.code = "Informe um código válido.";
    setErrors(next); if (Object.keys(next).length) { event.currentTarget.querySelector<HTMLInputElement>(`[name="${Object.keys(next)[0]}"]`)?.focus(); return; }
    setBusy(true); setNotice("");
    try {
      const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: mode, ...values, remember, kind: staff ? "staff" : "customer" }) });
      const result = await r.json(); if (!r.ok) throw new Error(result.error || "Não foi possível acessar sua conta.");
      if (mode === "forgot") setNotice(result.message);
      else if (mode === "reset") { setMode("login"); setNotice("Senha atualizada. Entre com sua nova senha."); }
      else { setTransition(true); if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) await new Promise(resolve => setTimeout(resolve, 550)); window.location.assign(result.redirectTo || "/diagnostico"); }
    } catch (e) { setNotice((e as Error).message); }
    finally { setValues(v => ({ ...v, password: "", confirmPassword: "" })); setBusy(false); }
  }
  function input(field: Field, label: string, type = "text", autoComplete = "off") {
    return <div className="account-field"><label htmlFor={`account-${field}`}>{label}</label><input id={`account-${field}`} name={field} type={type} autoComplete={autoComplete} value={values[field]} onChange={e => update(field,e.target.value)} required aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `${field}-error` : undefined} />{errors[field] && <span className="account-error" id={`${field}-error`}>{errors[field]}</span>}</div>;
  }
  return <Container className="account-page">
    {transition && <div className="account-flow-transition" role="status"><span className="account-transition-mark">A.</span><span>ATELIER / GRACE PRO</span><h2>{mode === "signup" ? "Sua conta está pronta." : "Boas-vindas de volta."}</h2><p>{staff ? "Preparando o painel da operação." : mode === "signup" ? "Agora, vamos conhecer seu salão." : "Preparando seu perfil."}</p><ArrowRight size={22}/></div>}
    <div className="account-shell"><section className="account-left" aria-labelledby="account-title">
      <div className="account-topbar">{onBack ? <><button type="button" onClick={onBack} className="account-brand">ATELIER<span>.</span></button><button type="button" onClick={onBack} className="account-back"><ArrowLeft size={14}/>Voltar</button></> : <><Link className="account-brand" href="/">ATELIER<span>.</span></Link><Link className="account-back" href="/"><ArrowLeft size={14}/>Voltar</Link></>}</div>
      <div className="account-form-wrap"><span className="account-eyebrow"><i/>{staff ? "ACESSO DA EQUIPE GRACE PRO" : current.eyebrow}</span><h1 id="account-title" ref={heading} tabIndex={-1}>{current.title}</h1><p className="account-description">{staff ? "Ambiente interno para comerciais, gestores e administradores." : current.description}</p>
      <form onSubmit={submit} noValidate>
        {mode === "signup" && input("name","Nome completo","text","name")}{input("email","E-mail","email","email")}
        {mode !== "forgot" && <div className="account-field"><label htmlFor="account-password">{mode === "reset" ? "Nova senha" : "Senha"}</label><div className="account-password"><input id="account-password" name="password" type={visiblePassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} maxLength={128} placeholder={mode === "login" ? "Digite sua senha" : "Use 10 ou mais caracteres"} value={values.password} onChange={e => update("password",e.target.value)} aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error" : undefined}/><button type="button" aria-label={visiblePassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setVisiblePassword(!visiblePassword)}>{visiblePassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>{errors.password && <span className="account-error" id="password-error">{errors.password}</span>}</div>}
        {(mode === "signup" || mode === "reset") && input("confirmPassword","Confirmar senha",visiblePassword ? "text" : "password","new-password")}
        {(mode === "reset" || staff && mode === "signup") && input("code",mode === "reset" ? "Código de recuperação" : needsSetup ? "Código de configuração da equipe" : "Código de convite da equipe")}
        {mode === "login" && <div className="account-options"><label className="account-remember"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/>Manter conectado</label><button type="button" className="account-text-button" onClick={() => changeMode("forgot")}>Esqueceu a senha?</button></div>}
        <button className="account-submit" disabled={busy} type="submit">{busy ? "Processando?" : current.submit}<ArrowRight size={16}/></button>
      </form>
      {notice && <div className="account-notice" role="status"><Info size={17}/><p>{notice}</p></div>}
      {mode === "signup" && <p className="account-description">{staff ? "Contas da equipe exigem convite ou o código de configuração inicial." : "O cadastro de clientes é livre. Você receberá um e-mail para confirmar seu endereço."}</p>}
      <p className="account-switch">{mode === "login" ? <>Ainda não tem conta? <button type="button" onClick={() => changeMode("signup")}>Criar conta</button></> : <>Já tem uma conta? <button type="button" onClick={() => changeMode("login")}>Entrar</button></>}</p>
      {mode === "forgot" && <p className="account-switch"><button type="button" onClick={() => changeMode("reset")}>Já tenho um código de recuperação</button></p>}
      <div className="account-demo"><span><i/>CONHEÇA O ATELIER</span><p>Experimente o formulário e compare os níveis com dados fictícios.</p><Link href="/diagnostico?demo=1">Experimentar diagnóstico <ArrowUpRight size={15}/></Link></div>
      <p className="account-switch"><Link href={staff ? "/entrar" : "/equipe"}>{staff ? "Sou cliente: acessar meu salão" : "Sou da equipe Grace Pro"}</Link></p>
      </div><div className="account-bottom"><span>© {new Date().getFullYear()} Atelier</span><span><LockKeyhole size={12}/>Informação com propósito.</span></div>
    </section>
      <aside className="account-art" aria-label="Conheça melhor. Conquiste mais.">
        <div className="account-art-texture" aria-hidden="true"><span className="account-ribbon ribbon-one" /><span className="account-ribbon ribbon-two" /><span className="account-ribbon ribbon-three" /><span className="account-ribbon ribbon-four" /><span className="account-ribbon ribbon-five" /></div>
        <div className="account-art-top"><span>UM NOVO OLHAR.</span><Sparkles size={19} strokeWidth={1.2} /></div>
        <div className="account-art-heading"><span className="account-art-mark">A<span>.</span></span><h2>Conheça melhor.<br /><em>Conquiste mais.</em></h2><p>Existe potencial em cada conversa.<br />A gente ajuda você a enxergar.</p></div>
        <div className="account-art-note"><span className="account-note-icon"><Check size={18} /></span><div><strong>Relacionamentos que abrem portas.</strong><p>Conecte cada visita a novas possibilidades para o seu negócio.</p><span>CAPTAR <i /> ENTENDER <i /> AGIR</span></div></div>
        <span className="account-art-footer">INTELIGÊNCIA EM CADA DECISÃO.</span>
      </aside>
    </div>
  </Container>;
}
