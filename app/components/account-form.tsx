"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Eye, EyeOff, Info, LockKeyhole, Sparkles } from "lucide-react";

type Mode = "login" | "signup" | "recovery";
type Field = "name" | "email" | "password" | "confirmPassword";
type FormValues = Record<Field, string>;
const copy = {
  login: { eyebrow: "SEU WORKSPACE ESPERA POR VOCÊ", title: "Boas-vindas de volta.", description: "Acesse sua conta e continue de onde parou.", submit: "Entrar na minha conta" },
  signup: { eyebrow: "UM NOVO CAPÍTULO COMEÇA AQUI", title: "Vamos nos conhecer?", description: "Crie sua conta para cultivar novas oportunidades.", submit: "Criar minha conta" },
  recovery: { eyebrow: "VAMOS AJUDAR VOCÊ", title: "Esqueceu a senha?", description: "Informe o e-mail que você usa para acessar o Atelier.", submit: "Recuperar acesso" },
};

function GoogleMark() {
  return <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" /><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.05v2.59A10 10 0 0 0 12 22Z" /><path fill="#FBBC05" d="M6.4 13.92a6 6 0 0 1 0-3.84V7.49H3.05a10 10 0 0 0 0 9.02l3.35-2.59Z" /><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.95 5.49l3.35 2.59C7.19 7.72 9.4 5.96 12 5.96Z" /></svg>;
}

export default function AccountForm({ embedded = false, onBack }: { embedded?: boolean; onBack?: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [values, setValues] = useState<FormValues>({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [notice, setNotice] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const current = copy[mode];
  const Container = embedded ? "div" : "main";

  function changeMode(next: Mode) {
    setMode(next);
    setErrors({});
    setNotice("");
    setVisiblePassword(false);
    // Passwords stay only in the active form and never enter persistent storage.
    setValues(previous => ({ ...previous, password: "", confirmPassword: "" }));
    heading.current?.focus();
  }

  function update(field: Field, value: string) {
    setValues(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: undefined }));
    setNotice("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Partial<Record<Field, string>> = {};
    if (mode === "signup" && values.name.trim().length < 2) nextErrors.name = "Informe seu nome completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) nextErrors.email = "Informe um e-mail válido.";
    if (mode !== "recovery" && !values.password) nextErrors.password = "Informe sua senha.";
    if (mode === "signup" && values.password.length < 8) nextErrors.password = "Use pelo menos 8 caracteres.";
    if (mode === "signup" && values.password !== values.confirmPassword) nextErrors.confirmPassword = "As senhas precisam ser iguais.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      event.currentTarget.querySelector<HTMLInputElement>(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus();
      return;
    }
    setNotice(mode === "recovery"
      ? "O envio de recuperação ainda não está disponível nesta demonstração. Nenhum e-mail foi enviado. Você pode explorar o workspace pelo acesso demonstrativo abaixo."
      : mode === "signup"
        ? "O cadastro de contas estará disponível quando a autenticação for conectada. Nenhuma conta foi criada e sua senha não foi salva. Explore o workspace demonstrativo abaixo."
        : "A autenticação ainda não está conectada nesta demonstração. Sua senha não foi enviada nem salva. Use o acesso demonstrativo abaixo para conhecer o workspace.");
    setValues(previous => ({ ...previous, password: "", confirmPassword: "" }));
  }

  return <Container className="account-page">
    <div className="account-shell">
      <section className="account-left" aria-labelledby="account-title">
        <div className="account-topbar">{onBack ? <><button type="button" onClick={onBack} className="account-brand" aria-label="Atelier, voltar à animação">ATELIER<span>.</span></button><button type="button" onClick={onBack} className="account-back"><ArrowLeft size={14} /> Voltar</button></> : <><Link href="/" className="account-brand" aria-label="Atelier, voltar à home">ATELIER<span>.</span></Link><Link href="/" className="account-back"><ArrowLeft size={14} /> Voltar</Link></>}</div>
        <div className="account-form-wrap">
          <span className="account-eyebrow"><i /> {current.eyebrow}</span>
          <h1 id="account-title" ref={heading} tabIndex={-1}>{current.title}</h1>
          <p className="account-description">{current.description}</p>
          <form onSubmit={submit} noValidate>
            {mode === "signup" && <div className="account-field"><label htmlFor="account-name">Nome completo</label><input id="account-name" name="name" type="text" autoComplete="name" placeholder="Como podemos chamar você?" value={values.name} onChange={event => update("name", event.target.value)} required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} />{errors.name && <span id="name-error" className="account-error">{errors.name}</span>}</div>}
            <div className="account-field"><label htmlFor="account-email">E-mail</label><input id="account-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="voce@empresa.com.br" value={values.email} onChange={event => update("email", event.target.value)} required aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} />{errors.email && <span id="email-error" className="account-error">{errors.email}</span>}</div>
            {mode !== "recovery" && <div className="account-field"><label htmlFor="account-password">Senha</label><div className="account-password"><input id="account-password" name="password" type={visiblePassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder={mode === "signup" ? "Crie uma senha com 8 ou mais caracteres" : "Digite sua senha"} value={values.password} onChange={event => update("password", event.target.value)} required minLength={mode === "signup" ? 8 : undefined} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "password-error" : undefined} /><button type="button" aria-label={visiblePassword ? "Ocultar senha" : "Mostrar senha"} aria-pressed={visiblePassword} onClick={() => setVisiblePassword(previous => !previous)}>{visiblePassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{errors.password && <span id="password-error" className="account-error">{errors.password}</span>}</div>}
            {mode === "signup" && <div className="account-field"><label htmlFor="account-confirm">Confirmar senha</label><input id="account-confirm" name="confirmPassword" type={visiblePassword ? "text" : "password"} autoComplete="new-password" placeholder="Digite sua senha novamente" value={values.confirmPassword} onChange={event => update("confirmPassword", event.target.value)} required aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? "confirm-error" : undefined} />{errors.confirmPassword && <span id="confirm-error" className="account-error">{errors.confirmPassword}</span>}</div>}
            {mode === "login" && <div className="account-options"><label className="account-remember"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} /><span>Manter conectado</span></label><button type="button" className="account-text-button" onClick={() => changeMode("recovery")}>Esqueceu a senha?</button></div>}
            <button className="account-submit" type="submit">{current.submit}<ArrowRight size={16} /></button>
          </form>
          {notice && <div className="account-notice" role="status"><Info size={17} /><p>{notice}</p></div>}
          {mode !== "recovery" && <><div className="account-separator"><span />ou continue com<span /></div><button className="account-google" type="button" onClick={() => setNotice("O login com Google ainda não está configurado. Use o acesso demonstrativo abaixo para explorar o Atelier.")}><GoogleMark />Continuar com Google<ArrowUpRight size={14} /></button></>}
          <p className="account-switch">{mode === "login" ? <>Ainda não tem uma conta? <button type="button" onClick={() => changeMode("signup")}>Criar conta</button></> : <>Já tem uma conta? <button type="button" onClick={() => changeMode("login")}>Entrar</button></>}</p>
          <div className="account-demo"><span><i /> VERSÃO DEMONSTRATIVA</span><p>A autenticação está em preparação. Conheça a plataforma sem usar suas credenciais reais.</p><Link href="/workspace">Explorar demonstração <ArrowUpRight size={15} /></Link></div>
        </div>
        <div className="account-bottom"><span>© {new Date().getFullYear()} Atelier</span><span><LockKeyhole size={12} /> Informação com propósito.</span></div>
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
