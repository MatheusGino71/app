"use client";
import { useI18n } from "../i18n/language-provider";
import { useEffect, useRef, type ReactNode } from "react";
import { Star, X } from "lucide-react";
import type { Category } from "../../../lib/domain";
export function Tier({ category }: { category: Category }) {
  const { t } = useI18n(); return <span className={`crm-tier tier-${category.toLowerCase().replaceAll(" ", "-")}`}>{t(category)}</span>; }
export function Stars({ score }: { score: number | null }) {
  const { t } = useI18n();
  return <span className="crm-stars" aria-label={score === null ? t("Não avaliado") : t("{v0} de 5 estrelas", { v0: score })}>{score === null ? <span className="crm-muted">{t("Não avaliado")}</span> : <>{[1, 2, 3, 4, 5].map(n => <Star key={n} size={17} aria-hidden="true" fill={n <= score ? "currentColor" : "none"} className={n <= score ? "" : "empty"} />)}<small>{score}/5</small></>}</span>;
}
export function Modal({ title, subtitle, children, onClose, wide = false }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null); const close = useRef(onClose); close.current = onClose;
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); const old = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { dialog?.close(); document.body.style.overflow = old; }; }, []);
  return <dialog ref={ref} className={`crm-dialog ${wide ? "wide" : ""}`} onCancel={e => { e.preventDefault(); close.current(); }} aria-labelledby="crm-dialog-title"><header><div><span className="crm-overline">{t("ATELIER / GRACE PRO")}</span><h2 id="crm-dialog-title">{t(title)}</h2>{subtitle && <p>{t(subtitle)}</p>}</div><button className="crm-icon" onClick={onClose} aria-label={t("Fechar")}><X size={21} /></button></header>{children}</dialog>;
}
export function FormFrame({ standalone, ...props }: { standalone: boolean; title: string; subtitle: string; children: ReactNode; onClose: () => void; wide: boolean }) {
  const { t } = useI18n();
  if (!standalone) return <Modal {...props} />;
  return <section className="crm-onboarding-panel" aria-labelledby="diagnostic-title"><header><span className="crm-overline">{t("SEU DIAGNÓSTICO GRACE PRO")}</span><h2 id="diagnostic-title">{t(props.title)}</h2><p>{t(props.subtitle)}</p></header>{props.children}</section>;
}
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  const { t } = useI18n(); return <label className="crm-field"><span>{t(label)}</span>{children}{hint && <small>{t(hint)}</small>}</label>; }
export function Choices({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string[]; onChange: (values: string[]) => void }) {
  const { t } = useI18n();
  return <fieldset className="crm-choices"><legend>{t(label)}</legend><div>{options.map(option => <label key={option}><input type="checkbox" checked={value.includes(option)} onChange={() => onChange(value.includes(option) ? value.filter(v => v !== option) : option === "Não publica" ? [option] : [...value.filter(v => v !== "Não publica"), option])} /><span>{t(option)}</span></label>)}</div></fieldset>;
}
export function Select({ value, onChange, options, label = "Não informado" }: { value: string; onChange: (v: string) => void; options: readonly string[]; label?: string }) {
  const { t } = useI18n(); return <select value={value} onChange={e => onChange(e.target.value)}><option value="">{t(label)}</option>{options.map(v => <option key={v} value={v}>{t(v)}</option>)}</select>; }
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  const { t } = useI18n(); return <div className="crm-empty"><span className="crm-empty-mark">{t("A.")}</span><h3>{t(title)}</h3><p>{children}</p></div>; }
