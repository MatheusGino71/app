"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CATALOG_VERSION, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, preferredLanguage, languageFor, translate, type Messages } from "../../../lib/i18n/core";
import englishMessages from "../../../public/locales/en.json";

const cache = new Map<string, Messages>([[DEFAULT_LANGUAGE, englishMessages]]);
type Context = {
  language: string; pending: string | null; failure: boolean;
  selectLanguage: (code: string) => Promise<boolean>;
  t: (source: string, values?: Record<string, string | number>) => string;
  money: (amount: number | null) => string; dateLabel: (date: string) => string;
};
const LanguageContext = createContext<Context | null>(null);

export default function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [messages, setMessages] = useState<Messages>(englishMessages);
  const [pending, setPending] = useState<string | null>(null);
  const [failure, setFailure] = useState(false);
  const request = useRef(0);
  const selectLanguage = useCallback(async (code: string) => {
    const selected = languageFor(code);
    if (!selected) return false;
    const id = ++request.current;
    setPending(code); setFailure(false);
    try {
      let catalog = cache.get(selected.catalog);
      if (!catalog) {
        const response = await fetch(`/locales/${selected.catalog}.json?v=${CATALOG_VERSION}`, { signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error("Language unavailable");
        const value: unknown = await response.json();
        if (!value || typeof value !== "object" || Array.isArray(value) || Object.values(value).some(text => typeof text !== "string") || Object.keys(englishMessages).some(key => typeof (value as Messages)[key] !== "string")) throw new Error("Invalid language catalog");
        catalog = value as Messages;
        cache.set(selected.catalog, catalog);
      }
      if (id !== request.current) return false;
      setMessages(catalog); setLanguage(code);
      document.documentElement.lang = selected.locale;
      document.documentElement.dir = selected.direction;
      try { localStorage.setItem(LANGUAGE_STORAGE_KEY, code); } catch { /* The current session still works when storage is blocked. */ }
      return true;
    } catch {
      if (id === request.current) setFailure(true);
      return false;
    } finally {
      if (id === request.current) setPending(null);
    }
  }, []);
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(LANGUAGE_STORAGE_KEY); } catch { /* Keep the English default. */ }
    void selectLanguage(preferredLanguage(saved));
    const sync = (event: StorageEvent) => { if (event.key === LANGUAGE_STORAGE_KEY && languageFor(event.newValue)) void selectLanguage(event.newValue!); };
    window.addEventListener("storage", sync);
    return () => { request.current++; window.removeEventListener("storage", sync); };
  }, [selectLanguage]);
  const effectiveMessages = useMemo(() => ({ ...englishMessages, ...messages }), [messages]);
  const t = useCallback((source: string, values?: Record<string, string | number>) => translate(effectiveMessages, source, values), [effectiveMessages]);
  const locale = languageFor(language)!.locale;
  const money = (value: number | null) => value === null ? t("Sem dados") : new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(value);
  const dateLabel = (value: string) => value ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value.length === 10 ? value + "T12:00:00Z" : value)) : "—";
  return <LanguageContext.Provider value={{ language, pending, failure, selectLanguage, t, money, dateLabel }}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("LanguageProvider is required");
  return context;
}
