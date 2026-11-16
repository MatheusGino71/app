import languages from "./languages.json";
import availableCatalogs from "./available.json";

export type Language = { code: string; name: string; native: string; country: string; countryName: string; englishName: string; direction: "ltr" | "rtl"; locale: string; catalog: string };
export type Messages = Record<string, string>;
export const LANGUAGES = (languages as Language[]).filter(language => availableCatalogs.includes(language.catalog));
export const DEFAULT_LANGUAGE = "en";
export const LANGUAGE_STORAGE_KEY = "grace-pro-language-v1";
export const CATALOG_VERSION = "2026-11-15-1";

export function languageFor(code: string | null | undefined) {
  return LANGUAGES.find(language => language.code === code);
}

export function preferredLanguage(saved: string | null | undefined) {
  return languageFor(saved)?.code ?? DEFAULT_LANGUAGE;
}

export const normalizeSearch = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().trim();

export function searchLanguages(query: string, displayName?: (code: string) => string) {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return LANGUAGES.filter(language => {
    const searchable = normalizeSearch([language.name, language.native, language.englishName, language.code, language.country, language.countryName, displayName?.(language.code) ?? ""].join(" "));
    return terms.every(term => searchable.includes(term));
  });
}

export function translate(messages: Messages, source: string, values?: Record<string, string | number>) {
  const text = Object.hasOwn(messages, source) ? messages[source] : source;
  return values ? text.replace(/\{(\w+)\}/g, (placeholder, name: string) => String(values[name] ?? placeholder)) : text;
}
