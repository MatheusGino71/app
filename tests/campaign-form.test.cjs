require('./register.cjs');
const fs = require('node:fs');
const ts = require('typescript');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
require.extensions['.tsx'] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX }, fileName: filename });
  module._compile(output.outputText, filename);
};
const LanguageProvider = require('../app/components/i18n/language-provider.tsx').default;
const CampaignEnrollment = require('../app/components/crm/campaign-enrollment.tsx').default;
const { createDemoData } = require('../lib/demo.ts');

test('enrollment renders user data literally, labels editable quantities and marks ties without promising prizes', () => {
  const data = createDemoData();
  const draft = { campaignId: 'salon-sales', salonId: data.salons[0].id, version: 1, status: 'confirmed', startDate: '2026-11-16', packages: 0, orderReference: '', note: '', professionals: [{ name: 'João <script>', units: 50 }, { name: 'Anna', units: 50 }] };
  const original = structuredClone(draft);
  const html = renderToStaticMarkup(React.createElement(LanguageProvider, null, React.createElement(CampaignEnrollment, { draft, onChange() {}, campaignName: 'Salon Sales Competition', salons: data.salons, entries: [], saving: false, error: '', async onSave() {}, onClose() {} })));
  assert.ok(html.includes('João &lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('Professional 1 name'));
  assert.ok(html.includes('step="1"'));
  assert.ok(html.includes('Tie'));
  assert.ok(!html.includes('€150'));
  assert.match(html, /<select[^>]*disabled=""/);
  assert.deepEqual(draft, original);
});
