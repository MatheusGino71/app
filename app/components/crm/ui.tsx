"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { Star, X } from "lucide-react";
import type { Category } from "../../../lib/domain";
export function Tier({ category }: { category: Category }) { return <span className={`crm-tier tier-${category.toLowerCase().replaceAll(" ", "-")}`}>{category}</span>; }
export function Stars({ score }: { score: number | null }) {
  return <span className="crm-stars" aria-label={score === null ? "Não avaliado" : `${score} de 5 estrelas`}>{score === null ? <span className="crm-muted">Não avaliado</span> : <>{[1, 2, 3, 4, 5].map(n => <Star key={n} size={17} aria-hidden="true" fill={n <= score ? "currentColor" : "none"} className={n <= score ? "" : "empty"} />)}<small>{score}/5</small></>}</span>;
}
export function Modal({ title, subtitle, children, onClose, wide = false }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null); const close = useRef(onClose); close.current = onClose;
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); const old = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { dialog?.close(); document.body.style.overflow = old; }; }, []);
  return <dialog ref={ref} className={`crm-dialog ${wide ? "wide" : ""}`} onCancel={e => { e.preventDefault(); close.current(); }} aria-labelledby="crm-dialog-title"><header><div><span className="crm-overline">ATELIER / GRACE PRO</span><h2 id="crm-dialog-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="crm-icon" onClick={onClose} aria-label="Fechar"><X size={21} /></button></header>{children}</dialog>;
}
export function FormFrame({ standalone, ...props }: { standalone: boolean; title: string; subtitle: string; children: ReactNode; onClose: () => void; wide: boolean }) {
  if (!standalone) return <Modal {...props} />;
  return <section className="crm-onboarding-panel" aria-labelledby="diagnostic-title"><header><span className="crm-overline">SEU DIAGNÓSTICO GRACE PRO</span><h2 id="diagnostic-title">{props.title}</h2><p>{props.subtitle}</p></header>{props.children}</section>;
}
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) { return <label className="crm-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
export function Choices({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string[]; onChange: (values: string[]) => void }) {
  return <fieldset className="crm-choices"><legend>{label}</legend><div>{options.map(option => <label key={option}><input type="checkbox" checked={value.includes(option)} onChange={() => onChange(value.includes(option) ? value.filter(v => v !== option) : option === "Não publica" ? [option] : [...value.filter(v => v !== "Não publica"), option])} /><span>{option}</span></label>)}</div></fieldset>;
}
export function Select({ value, onChange, options, label = "Não informado" }: { value: string; onChange: (v: string) => void; options: readonly string[]; label?: string }) { return <select value={value} onChange={e => onChange(e.target.value)}><option value="">{label}</option>{options.map(v => <option key={v} value={v}>{v}</option>)}</select>; }
export function Empty({ title, children }: { title: string; children?: ReactNode }) { return <div className="crm-empty"><span className="crm-empty-mark">A.</span><h3>{title}</h3><p>{children}</p></div>; }
