const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const en = require('../public/locales/en.json');
const missing = new Map();
const failures = [];
const pending = require('../lib/i18n/fallbacks.json');
function scan(directory) {
  for (const file of fs.readdirSync(directory, { withFileTypes: true })) {
    const name = path.join(directory, file.name);
    if (file.isDirectory()) scan(name);
    else if (/\.tsx?$/.test(name)) {
      const source = ts.createSourceFile(name, fs.readFileSync(name, 'utf8'), ts.ScriptTarget.Latest, true);
      function visit(node) {
        if (ts.isCallExpression(node) && node.expression.getText(source) === 't' && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
          const key = node.arguments[0].text;
          if (!Object.hasOwn(en, key)) missing.set(key, path.relative(root, name));
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
  }
}
scan(path.join(root, 'app'));
const published = require('../lib/i18n/available.json');
const placeholders = text => (text.match(/\{\w+\}/g) || []).sort().join(',');
for (const code of published) {
  const messages = JSON.parse(fs.readFileSync(path.join(root, 'public/locales', code + '.json'), 'utf8'));
  const incomplete = Object.keys(en).filter(key => typeof messages[key] !== 'string' || !messages[key].trim());
  const invalid = Object.keys(en).filter(key => typeof messages[key] === 'string' && placeholders(messages[key]) !== placeholders(key));
  if (incomplete.length || invalid.length) failures.push({ code, missing: incomplete.length, invalidPlaceholders: invalid.length });
}
console.log(JSON.stringify({ catalogKeys: Object.keys(en).length, publishedCatalogs: published.length, missingSourceMessages: [...missing], catalogFailures: failures, pendingTranslations: Object.fromEntries(Object.entries(pending).map(([code, keys]) => [code, keys.length])) }, null, 2));
process.exitCode = missing.size || failures.length ? 1 : 0;
