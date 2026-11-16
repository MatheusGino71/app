require('./register.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { campaignProjection, campaignRanking, parseCampaignEntry, ICONS_PRODUCTS } = require('../lib/campaigns.ts');
const entry = changes => ({ campaignId: 'salon-sales', salonId: 'salon-1', status: 'planned', startDate: '2026-11-16', packages: 0, version: 0, orderReference: '', note: '', professionals: [{ name: 'Alice', units: 40 }], ...changes });

test('campaign projections distinguish paid units, product bonuses and prize budgets', () => {
  assert.equal(campaignProjection('salon-sales', 30).revenue, 135000);
  assert.equal(campaignProjection('salon-sales', 30, 450).prizeValue, 13500);
  assert.equal(campaignProjection('brae-12-12', 40).revenue, 15840);
  assert.equal(campaignProjection('brae-12-12', 1).bonusUnits, 12);
  assert.equal(campaignProjection('icons-edit', 1).revenue * 100, ICONS_PRODUCTS.reduce((sum, p) => sum + p.quantity * p.cents, 0));
  assert.equal(ICONS_PRODUCTS.reduce((sum, p) => sum + p.quantity, 0), 13);
  assert.throws(() => campaignProjection('salon-sales', 1.5));
  assert.throws(() => campaignProjection('salon-sales', 30, 500));
});

test('campaign validation preserves zero, rejects fractions and requires a reference for recorded orders', () => {
  assert.equal(parseCampaignEntry(entry({ professionals: [] })).packages, 0);
  for (const units of [-1, .5, NaN, 1000001]) assert.throws(() => parseCampaignEntry(entry({ professionals: [{ name: 'Alice', units }] })));
  assert.throws(() => parseCampaignEntry(entry({ startDate: '2026-02-30' })));
  assert.throws(() => parseCampaignEntry(entry({ professionals: [{ name: 'Alice', units: 1 }, { name: 'alice', units: 2 }] })));
  assert.throws(() => parseCampaignEntry(entry({ campaignId: 'brae-12-12', packages: 1, professionals: [] })));
  assert.equal(parseCampaignEntry(entry({ campaignId: 'brae-12-12', packages: 0, professionals: [] })).packages, 0);
  assert.equal(parseCampaignEntry(entry({ campaignId: 'brae-12-12', packages: 2, orderReference: ' PO-42 ', professionals: [] })).orderReference, 'PO-42');
});

test('ranking preserves ties and leaves the editable professional list untouched', () => {
  const professionals = [{ name: 'Zoe', units: 10 }, { name: 'Alice', units: 30 }, { name: 'Bob', units: 30 }];
  const original = structuredClone(professionals);
  const ranking = campaignRanking(professionals);
  assert.deepEqual(ranking.map(p => [p.name, p.rank, p.tied]), [['Alice', 1, true], ['Bob', 1, true], ['Zoe', 3, false]]);
  assert.deepEqual(professionals, original);
});

test('campaign interface uses the selected catalog including full operational conditions', () => {
  const { CAMPAIGN_COPY, campaignContent } = require('../lib/campaigns-i18n.ts');
  const { translate } = require('../lib/i18n/core.ts');
  for (const code of ['en', 'pt-BR', 'pt-PT', 'es', 'pl', 'fr', 'de']) {
    const messages = require(`../public/locales/${code}.json`);
    for (const source of Object.values(CAMPAIGN_COPY)) assert.equal(typeof messages[source], 'string', `${code}: ${source}`);
    const content = campaignContent('salon-sales', source => translate(messages, source));
    assert.ok(content.name && content.conditions && content.timeline.length === 4);
    if (code === 'pt-BR') assert.match(content.conditions, /capacidade não alocada/);
    if (code === 'en') assert.match(content.conditions, /not profit/);
  }
});

test('every published campaign describes prize valuations instead of cash payouts', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const { CAMPAIGNS } = require('../lib/campaigns.ts');
  const { CAMPAIGN_COPY, campaignContent } = require('../lib/campaigns-i18n.ts');
  const { translate } = require('../lib/i18n/core.ts');
  assert.match(CAMPAIGNS[0].mechanic, /prize valued at EUR150/);
  assert.doesNotMatch(CAMPAIGNS[0].mechanic, /EUR?150 cash|€150 cash|€100 cash/);
  for (const code of require('../lib/i18n/available.json')) {
    const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/locales', `${code}.json`), 'utf8'));
    assert.equal(Object.hasOwn(messages, 'Prêmio em dinheiro'), false, code);
    const description = campaignContent('salon-sales', source => translate(messages, source)).mechanic;
    assert.match(description, /EUR150/, code);
    assert.match(description, /EUR100/, code);
    const label = translate(messages, CAMPAIGN_COPY.prize_valued_at, { value: 'EUR150' });
    assert.ok(label.includes('EUR150') && !label.includes('{value}'), code);
  }
});
