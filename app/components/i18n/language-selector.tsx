"use client";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Globe2, LoaderCircle, Search, X } from "lucide-react";
import { LANGUAGES, languageFor, searchLanguages } from "../../../lib/i18n/core";
import { useI18n } from "./language-provider";

export default function LanguageSelector() {
  const { language, pending, failure, selectLanguage, t } = useI18n();
  const selected = languageFor(language)!;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const display = useMemo(() => new Intl.DisplayNames([selected.locale], { type: "language", fallback: "code" }), [selected.locale]);
  const languageName = (code: string) => { const item = languageFor(code)!; try { const translated = display.of(item.locale); return translated && translated !== item.locale ? translated : item.name; } catch { return item.name; } };
  const results = searchLanguages(query, languageName);
  const close = () => { setOpen(false); trigger.current?.focus({ preventScroll: true }); };
  useEffect(() => {
    if (!open) return;
    input.current?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useEffect(() => { if (open) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: "nearest" }); }, [active, open, id]);
  async function choose(code: string) {
    if (await selectLanguage(code)) close();
  }
  function keys(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setActive(value => results.length ? (value + (event.key === "ArrowDown" ? 1 : -1) + results.length) % results.length : 0); }
    if (event.key === "Enter") { event.preventDefault(); if (results[active]) void choose(results[active].code); }
  }
  return <div className="language-selector" ref={root} onKeyDown={event => { if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); } }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} type="button" className="language-trigger" aria-expanded={open} aria-haspopup="dialog" aria-controls={`${id}-panel`} aria-label={`${t("Idioma")}: ${selected.native}`} onClick={() => { setQuery(""); setActive(0); setOpen(value => !value); }}>
      <Globe2 size={15} aria-hidden="true" /><img src={`/flags/${selected.country.toLowerCase()}.svg`} width="21" height="15" alt="" /><span lang={selected.locale}>{selected.native}</span>{pending ? <LoaderCircle className="language-loading" size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
    </button>
    {open && <div className="language-panel" id={`${id}-panel`} role="dialog" aria-label={t("Escolha seu idioma")}>
      <div className="language-panel-heading"><div><strong>{t("Escolha seu idioma")}</strong><span>{t("Sinta-se em casa, em qualquer lugar.")}</span></div><button type="button" aria-label={t("Fechar")} onClick={close}><X size={17} /></button></div>
      <div className="language-search"><Search size={16} aria-hidden="true" /><input ref={input} type="search" value={query} onChange={event => { setQuery(event.target.value); setActive(0); }} onKeyDown={keys} role="combobox" aria-expanded="true" aria-controls={`${id}-options`} aria-autocomplete="list" aria-activedescendant={results[active] ? `${id}-${active}` : undefined} aria-label={t("Buscar idioma")} placeholder={t("Buscar idioma ou país…")} autoComplete="off" /></div>
      <div className="language-options" id={`${id}-options`} role="listbox" aria-label={t("Idiomas disponíveis")} aria-busy={!!pending}>
        {results.map((item, index) => <button type="button" role="option" aria-selected={item.code === language} id={`${id}-${index}`} key={item.code} className={active === index ? "active" : ""} tabIndex={-1} onPointerMove={() => setActive(index)} onClick={() => void choose(item.code)}>
          <img src={`/flags/${item.country.toLowerCase()}.svg`} width="27" height="20" alt="" loading="lazy" /><span><strong lang={item.locale} dir={item.direction}>{item.native}</strong><small>{languageName(item.code)} · {item.country}</small></span>{pending === item.code ? <LoaderCircle size={16} className="language-loading" /> : item.code === language ? <Check size={16} /> : null}
        </button>)}
        {!results.length && <p className="language-empty" role="status">{t("Nenhum idioma encontrado. Tente outro nome.")}</p>}
      </div>
      <div className="language-panel-footer" role="status">{failure ? <span className="language-failure">{t("Não foi possível carregar o idioma. Tente novamente.")}</span> : t("{count} idiomas · Sua preferência fica salva neste navegador.", { count: LANGUAGES.length })}</div>
    </div>}
  </div>;
}
