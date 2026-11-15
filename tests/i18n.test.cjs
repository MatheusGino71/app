require("./register.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { LANGUAGES, DEFAULT_LANGUAGE, preferredLanguage, languageFor, searchLanguages, translate } = require("../lib/i18n/core.ts");

test("English is the default and only an explicit saved choice changes it", () => {
  assert.equal(DEFAULT_LANGUAGE, "en");
  assert.equal(preferredLanguage(null), "en");
  assert.equal(preferredLanguage(undefined), "en");
  assert.equal(preferredLanguage("unknown"), "en");
  assert.equal(preferredLanguage("pl"), "pl");
  assert.equal(preferredLanguage("es"), "es");
  assert.equal(preferredLanguage("pt-PT"), "pt-PT");
  assert.equal(preferredLanguage("pt-BR"), "pt-BR");
  assert.equal(preferredLanguage("en"), "en");
});

test("language search accepts native, Portuguese, English and country names without accents", () => {
  for (const query of ["polonês", "polones", "Polski", "Poland", "Polônia", "polonia"]) assert.ok(searchLanguages(query).some(language => language.code === "pl"), query);
  for (const query of ["espanhol", "espanol", "España", "Spain", "Spanish"]) assert.ok(searchLanguages(query).some(language => language.code === "es"), query);
  assert.deepEqual(searchLanguages("zzzz-unknown-language"), []);
  assert.equal(searchLanguages("").length, LANGUAGES.length);
});

test("every supported language has a valid locale, unique code and bundled flag", () => {
  assert.ok(LANGUAGES.length >= 200);
  assert.equal(new Set(LANGUAGES.map(language => language.code)).size, LANGUAGES.length);
  for (const language of LANGUAGES) {
    assert.ok(language.native && language.name && language.englishName);
    assert.ok(["ltr", "rtl"].includes(language.direction));
    assert.doesNotThrow(() => new Intl.DateTimeFormat(language.locale));
    assert.ok(fs.existsSync(path.join(__dirname, "../public/flags", language.country.toLowerCase() + ".svg")), language.code);
  }
  assert.equal(languageFor("ar").direction, "rtl");
  assert.equal(languageFor("he").direction, "rtl");
  assert.equal(languageFor("pl").direction, "ltr");
  assert.equal(languageFor("../../private"), undefined);
});

test("interpolation preserves user values and never interprets them as translated copy", () => {
  const messages = { "Bem-vindo, {name}": "Welcome, {name}", "João": "John" };
  assert.equal(translate(messages, "Bem-vindo, {name}", { name: "João" }), "Welcome, João");
  assert.equal(translate(messages, "Bem-vindo, {name}", { name: "<script>" }), "Welcome, <script>");
  assert.equal(translate(messages, "Unknown"), "Unknown");
  assert.equal(translate(messages, "toString"), "toString");
  assert.equal(translate({ "{count} itens": "{count} items" }, "{count} itens", { count: 0 }), "0 items");
});

test("all published catalogs cover the source messages and preserve interpolation placeholders", () => {
  const source = require("../public/locales/en.json");
  const expected = Object.keys(source).sort();
  const placeholders = text => [...text.matchAll(/\{\w+\}/g)].map(match => match[0]).sort();
  for (const catalog of new Set(LANGUAGES.map(language => language.catalog))) {
    const file = path.join(__dirname, "../public/locales", `${catalog}.json`);
    assert.ok(fs.existsSync(file), `Missing catalog: ${catalog}`);
    const messages = JSON.parse(fs.readFileSync(file, "utf8"));
    assert.deepEqual(Object.keys(messages).sort(), expected, catalog);
    for (const [key, value] of Object.entries(messages)) {
      assert.equal(typeof value, "string", `${catalog}: ${key}`);
      assert.ok(value.trim(), `${catalog}: ${key}`);
      assert.deepEqual(placeholders(value), placeholders(key), `${catalog}: ${key}`);
    }
  }
});

test("Polish and Spanish translate real signup, assessment and level comparison messages", () => {
  for (const code of ["pl", "es"]) {
    const messages = require(`../public/locales/${code}.json`);
    for (const key of ["Nome completo", "Senha", "Criar conta e continuar", "Vamos conhecer seu salão.", "Comparar níveis"]) {
      assert.ok(messages[key] && messages[key] !== key, `${code}: ${key}`);
    }
  }
  assert.equal(require("../public/locales/es.json")["Buscar idioma"], "Buscar idioma");
  assert.equal(require("../public/locales/pl.json")["Buscar idioma"], "Szukaj języka");
});
