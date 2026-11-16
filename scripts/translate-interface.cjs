// Development-only: translate reviewed, fixed UI copy. Never receives customer data.
// Public API: https://translate.wmcloud.org/docs (Wikimedia MinT).
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const languages = require("../lib/i18n/languages.json");
const publishedCatalogs = require("../lib/i18n/available.json");
const models = require("../lib/i18n/models.json");
const base = { ...require("../public/locales/en.json"), ...require("../lib/i18n/english-overrides.json") };
const localeDirectory = path.join(root, "public", "locales");
const cacheDirectory = path.join(root, ".data");
const fallbackFile = path.join(root, "lib", "i18n", "fallbacks.json");
const pendingFallbacks = readJSON(fallbackFile);
const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const protectedCopy = /(\{\w+\}|\bEUR(?:150|100|50)\b|\b(?:ATELIER|Grace Pro|GRACE PRO|Deep Test|ORIGIN|SIGNATURE|ICON|BRAÉ|Braé|The Icons Edit|Home Care|Wanna Be Blonde|Revival Oil|OX|SKU)\b|salao_id;compra_eur;pedidos;data_corte;fonte)/g;
const segmentsOf = text => text.split(protectedCopy).filter((part, index) => index % 2 === 0 && /\p{L}/u.test(part)).map(part => part.trim());
const segments = [...new Set(Object.values(base).flatMap(segmentsOf))];
const partKeys = new Map(segments.map((segment, index) => [segment, `m${index}`]));
const version = crypto.createHash("sha256").update(JSON.stringify(base) + protectedCopy.source).digest("hex").slice(0, 12);
const argumentsList = process.argv.slice(2);
const attempts = argumentsList.includes("--quick") ? 1 : 3;
const timeoutMs = argumentsList.includes("--quick") ? 30000 : 90000;
const force = argumentsList.includes("--force");
const requested = argumentsList.filter(argument => !argument.startsWith("--"));
// Experimental models require an explicitly requested language and editorial review.
const targets = [...new Set(languages.map(language => language.catalog))].filter(code => !["en", "pt-BR", "pt-PT"].includes(code) && (requested.length ? requested.includes(code) : publishedCatalogs.includes(code) && models[code] !== "madlad-400"));
const errors = [];
let finished = 0;

function readJSON(file, fallback = {}) {
  for (let attempt = 0; ; attempt++) {
    try { return JSON.parse(fs.readFileSync(file, "utf8")); }
    catch (error) {
      if (error.code === "ENOENT") return fallback;
      if (attempt >= 7) throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
}
function writeJSON(file, value) {
  const temporary = path.join(cacheDirectory, `catalog-write-${crypto.randomUUID()}.tmp`);
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + "\n");
  try {
    for (let attempt = 0; ; attempt++) {
      try { fs.renameSync(temporary, file); return; }
      catch (error) { if (attempt >= 7) throw error; Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100); }
    }
  } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}
function customMessages(code) { return readJSON(path.join(root, "lib", "i18n", "overrides", `${code}.json`)); }
const placeholders = text => (text.match(/\{\w+\}/g) ?? []).sort().join(",");

function publishCatalog(code, messages) {
  const custom = customMessages(code);
  const catalog = {};
  for (const [source, fallback] of Object.entries(base)) {
    const value = custom[source] ?? messages[source] ?? fallback;
    catalog[source] = typeof value === "string" && value.trim() && placeholders(source) === placeholders(value) ? value : fallback;
  }
  writeJSON(path.join(localeDirectory, `${code}.json`), catalog);
}
function updateAvailableCatalogs() {
  const catalogs = fs.readdirSync(localeDirectory).filter(file => file.endsWith(".json")).map(file => file.slice(0, -5)).filter(code => {
    const messages = readJSON(path.join(localeDirectory, `${code}.json`));
    return Object.keys(base).every(source => typeof messages[source] === "string" && messages[source].trim());
  }).sort();
  writeJSON(path.join(root, "lib", "i18n", "available.json"), catalogs);
}
function createBatches(entries, limit = 9000) {
  const batches = [[]];
  for (const entry of entries) {
    if (JSON.stringify(Object.fromEntries([...batches.at(-1), entry])).length > limit) batches.push([]);
    batches.at(-1).push(entry);
  }
  return batches.filter(batch => batch.length);
}
async function translateBatch(code, batch, index, total) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch("https://translate.wmcloud.org/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "AtelierInterfaceLocalization/1.0 (static public UI copy)" },
        body: JSON.stringify({ source_language: "en", target_language: code, model: models[code], format: "json", content: JSON.stringify(Object.fromEntries(batch)) }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} ${(await response.text()).slice(0, 300)}`);
      const result = await response.json();
      const output = JSON.parse(result.translation);
      if (!output || typeof output !== "object" || Array.isArray(output)) throw new Error("Invalid translation response");
      const valid = Object.fromEntries(batch.filter(([key]) => typeof output[key] === "string" && output[key].trim()).map(([key]) => [key, output[key]]));
      if (Object.keys(valid).length !== batch.length) console.warn(`${code}: ${batch.length - Object.keys(valid).length} untranslated segments remain pending`);
      return valid;
    } catch (error) {
      if (attempt === attempts - 1) throw new Error(`${code}: ${error.message} ${error.cause?.code ?? ""}`);
      console.warn(`${code}: retry batch ${index + 1}/${total}`);
      await sleep(2000 * (attempt + 1));
    }
  }
}
async function translateLanguage(code) {
  const start = Date.now();
  const existing = readJSON(path.join(localeDirectory, `${code}.json`));
  const missing = Object.entries(base).filter(([source]) => force || typeof existing[source] !== "string" || !existing[source].trim() || pendingFallbacks[code]?.includes(source));
  if (!missing.length) { publishCatalog(code, existing); finished++; return; }
  const needed = new Set(missing.flatMap(([, english]) => segmentsOf(english)));
  const entries = [...partKeys].filter(([text]) => needed.has(text)).map(([text, key]) => [key, text]);
  const batches = createBatches(entries, argumentsList.includes("--small-batches") ? 2500 : models[code] === "nllb200-600M" ? 9000 : 1500);
  const cacheFile = path.join(cacheDirectory, `translation-${code}-${version}.json`);
  const translated = readJSON(cacheFile);
  for (const [index, batch] of batches.entries()) {
    const pending = batch.filter(([key]) => typeof translated[key] !== "string" || !translated[key].trim());
    if (!pending.length) continue;
    Object.assign(translated, await translateBatch(code, pending, index, batches.length));
    writeJSON(cacheFile, translated);
    console.log(`${code}: batch ${index + 1}/${batches.length}`);
    await sleep(300);
  }
  const catalog = { ...existing };
  const unresolved = [];
  for (const [source, english] of missing) {
    if (segmentsOf(english).some(part => typeof translated[partKeys.get(part)] !== "string" || !translated[partKeys.get(part)].trim())) { unresolved.push(source); continue; }
    catalog[source] = english.split(protectedCopy).map((part, index) => {
      if (index % 2 || !/\p{L}/u.test(part)) return part;
      return (part.match(/^\s*/)?.[0] ?? "") + translated[partKeys.get(part.trim())].trim() + (part.match(/\s*$/)?.[0] ?? "");
    }).join("");
  }
  publishCatalog(code, catalog);
  if (unresolved.length) { pendingFallbacks[code] = unresolved; errors.push(code); }
  else delete pendingFallbacks[code];
  writeJSON(fallbackFile, pendingFallbacks);
  finished++;
  console.log(`${code}: ${missing.length - unresolved.length} messages updated, ${unresolved.length} pending, ${Math.round((Date.now() - start) / 1000)}s (${finished}/${targets.length})`);
}
function publishPortuguese() {
  publishCatalog("pt-BR", Object.fromEntries(Object.keys(base).map(source => [source, source])));
  const portuguese = Object.fromEntries(Object.keys(base).map(source => [source, source.replace(/\bsenha\b/g, "palavra-passe").replace(/\bSenha\b/g, "Palavra-passe").replace(/\bsenhas\b/g, "palavras-passe").replace(/\bequipe\b/g, "equipa").replace(/\bEQUIPE\b/g, "EQUIPA").replace(/\bEquipe\b/g, "Equipa").replace(/\bcadastro\b/g, "registo").replace(/\bCadastro\b/g, "Registo").replace(/\bCadastrar\b/g, "Registar").replace(/\bCadastre\b/g, "Registe").replace(/\be-mail\b/g, "email").replace(/\bE-mail\b/g, "Email") ]));
  portuguese["Manter conectado"] = "Manter sessão iniciada";
  portuguese["Digite sua senha"] = "Introduza a sua palavra-passe";
  publishCatalog("pt-PT", portuguese);
}

(async () => {
  fs.mkdirSync(cacheDirectory, { recursive: true });
  publishCatalog("en", base);
  publishPortuguese();
  const priority = ["pl", "es", "fr", "de", "it", "ar", "uk", "ru", "ja", "zh", "ko"];
  const remaining = targets.filter(code => !priority.includes(code)).sort((a, b) => Number(models[b] === "nllb200-600M") - Number(models[a] === "nllb200-600M"));
  const queue = [...priority.filter(code => targets.includes(code)), ...remaining];
  console.log(`${targets.length} languages; translating missing messages${force ? " (--force)" : ""}`);
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const code = queue.shift();
      try { await translateLanguage(code); } catch (error) { errors.push(code); console.error(error.message); }
    }
  }));
  updateAvailableCatalogs();
  if (errors.length) { console.error("Incomplete languages:", errors.join(", ")); process.exitCode = 1; }
})();
