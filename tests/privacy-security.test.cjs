require('./register.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { createStore } = require('../lib/server/store.ts');
const { emptySalon, emptyDiagnostic } = require('../lib/domain.ts');
const { createPrivacyRequest, privacyAction, privacyOverview, exportPersonalData, cleanupExpiredData, oneMonthAfter } = require('../lib/server/privacy.ts');
const { securityAction, securityStatus } = require('../lib/server/security.ts');
const { totp, encodeBase32, openSecret } = require('../lib/server/mfa.ts');
const { snapshotDatabase, encryptBackup, decryptBackup, restoreDatabase } = require('../lib/server/backup.ts');
const password = 'Private-test-password-2026';
process.env.ATELIER_SETUP_TOKEN = 'private-test-setup';
process.env.ATELIER_MFA_KEY = randomBytes(32).toString('hex');
async function fixture() {
  const store = await createStore(':memory:');
  const admin = await store.signup({ kind: 'staff', name: 'Admin', email: 'admin@example.test', password, code: process.env.ATELIER_SETUP_TOKEN });
  const invite = await store.invite(admin, { email: 'sales@example.test', role: 'comercial' });
  const sales = await store.signup({ kind: 'staff', name: 'Sales', email: 'sales@example.test', password, code: invite.code });
  const otherInvite = await store.invite(admin, { email: 'other@example.test', role: 'comercial' });
  const other = await store.signup({ kind: 'staff', name: 'Other', email: 'other@example.test', password, code: otherInvite.code });
  const draft = { salonId: '', version: 0, step: 6, salon: { ...emptySalon(), name: 'Salon to review', contact: 'Contact', country: 'Portugal', city: 'Lisbon' }, diagnostic: emptyDiagnostic() };
  const saved = await store.saveVisit(sales, draft);
  return { store, admin, sales, other, salonId: saved.salonId };
}
async function request(f, kind = 'access', owner = f.sales) {
  const { id } = await createPrivacyRequest(f.store, owner, { kind, salonId: f.salonId, note: 'Verified subject request details' });
  return (await privacyOverview(f.store, f.admin)).requests.find(r => r.id === id);
}
async function verify(f, row) {
  await privacyAction(f.store, f.admin, { action: 'verify', id: row.id, version: row.version, response: 'Identity and authority checked privately' });
  return (await privacyOverview(f.store, f.admin)).requests.find(r => r.id === row.id);
}

test('TOTP matches independent RFC vectors and month deadlines clamp correctly', () => {
  const secret = encodeBase32(Buffer.from('12345678901234567890'));
  for (const [seconds, expected] of [[59, '94287082'], [1111111109, '07081804'], [1111111111, '14050471'], [1234567890, '89005924'], [2000000000, '69279037']]) assert.equal(totp(secret, Math.floor(seconds / 30), 8), expected);
  assert.equal(oneMonthAfter('2026-01-31T12:00:00.000Z'), '2026-02-28T12:00:00.000Z');
  assert.equal(oneMonthAfter('2028-01-31T12:00:00.000Z'), '2028-02-29T12:00:00.000Z');
});

test('MFA setup reauthenticates, encrypts its key, revokes sessions and prevents OTP/recovery replay', async () => {
  const f = await fixture();
  try {
    const session = await f.store.createSession(f.admin, true);
    await assert.rejects(() => securityAction(f.store, f.admin, { action: 'beginMfa', password: 'wrong' }));
    const setup = await securityAction(f.store, f.admin, { action: 'beginMfa', password });
    const beforeEnrollment = await f.store.login({ email: f.admin.email, password });
    const row = await f.store.db.get('SELECT secret FROM mfa_pending WHERE user_id=?', f.admin.id);
    assert.notEqual(row.secret, setup.secret); assert.equal(openSecret(row.secret, f.admin.id), setup.secret);
    assert.throws(() => openSecret(row.secret, f.sales.id));
    assert.equal((await securityStatus(f.store, f.admin)).enabled, false);
    await assert.rejects(() => securityAction(f.store, f.admin, { action: 'confirmMfa', password, code: 'invalid' }));
    const code = totp(setup.secret, Math.floor(Date.now() / 30000));
    const result = await securityAction(f.store, f.admin, { action: 'confirmMfa', password, code });
    assert.equal(result.recoveryCodes.length, 10); assert.equal(await f.store.session(session.token), null);
    await assert.rejects(() => f.store.createSession(beforeEnrollment, true), e => e.status === 401);
    await assert.rejects(() => f.store.login({ email: f.admin.email, password }));
    await assert.rejects(() => f.store.login({ email: f.admin.email, password, otp: code }));
    const recovery = result.recoveryCodes[0];
    assert.equal((await f.store.login({ email: f.admin.email, password, otp: recovery })).id, f.admin.id);
    await assert.rejects(() => f.store.login({ email: f.admin.email, password, otp: recovery }));
    assert.equal((await securityStatus(f.store, f.admin)).recoveryRemaining, 9);
  } finally { f.store.close(); }
});

test('privacy requests isolate portfolios and never export password or authentication material', async () => {
  const f = await fixture();
  try {
    await assert.rejects(() => createPrivacyRequest(f.store, f.other, { kind: 'access', salonId: f.salonId, note: 'Attempt outside assigned portfolio' }), e => e.status === 404);
    const row = await request(f);
    await f.store.addEvidence(f.sales, f.salonId, { name: 'subject-evidence.pdf', mime: 'application/pdf', content: 'private-test-content' });
    assert.equal((await privacyOverview(f.store, f.other)).requests.length, 0);
    await assert.rejects(() => privacyAction(f.store, f.sales, { action: 'verify', id: row.id, version: 0, response: 'Not an administrator' }), e => e.status === 403);
    await assert.rejects(() => privacyAction(f.store, f.admin, { action: 'export', id: row.id, version: 0, password }), e => e.status === 409);
    const verified = await verify(f, row);
    const exported = await privacyAction(f.store, f.admin, { action: 'export', id: row.id, version: verified.version, password });
    assert.equal(exported.salon.id, f.salonId); assert.equal(exported.visits.length, 1);
    assert.equal(exported.attachments[0].content, undefined);
    assert.match(exported.attachments[0].downloadPath, /^\/api\/evidence\?id=/);
    const personal = await exportPersonalData(f.store, f.sales);
    assert.deepEqual(Object.keys(personal.account).sort(), ['email', 'id', 'name']);
    assert.ok(!JSON.stringify(personal).includes('password'));
    await assert.rejects(() => verify(f, row), e => e.status === 409);
  } finally { f.store.close(); }
});

test('verified restrictions block routine processing and can be lifted with a recorded decision', async () => {
  const f = await fixture();
  try {
    const row = await verify(f, await request(f, 'restriction'));
    await privacyAction(f.store, f.admin, { action: 'restrict', id: row.id, version: row.version, password, response: 'Processing restricted while subject request is assessed' });
    assert.equal((await f.store.snapshot(f.sales)).salons.length, 0);
    assert.equal((await f.store.snapshot(f.sales)).visits.length, 0);
    await assert.rejects(() => f.store.addEvidence(f.sales, f.salonId, { name: 'a.pdf', mime: 'application/pdf', content: 'x' }), e => e.status === 409);
    const current = (await privacyOverview(f.store, f.admin)).requests.find(r => r.id === row.id);
    await privacyAction(f.store, f.admin, { action: 'liftRestriction', id: row.id, version: current.version, password, response: 'Subject confirmed that processing may resume' });
    assert.equal((await f.store.snapshot(f.sales)).salons.length, 1);
  } finally { f.store.close(); }
});

test('erasure requires reviewed retention and exact confirmation; latest ledger prevents backup resurrection', async () => {
  const f = await fixture(); const target = await createStore(':memory:');
  try {
    await f.store.addEvidence(f.sales, f.salonId, { name: 'evidence.pdf', mime: 'application/pdf', content: 'cHJpdmF0ZQ==' });
    const before = await snapshotDatabase(f.store.db);
    const row = await verify(f, await request(f, 'erasure'));
    const input = { action: 'erase', id: row.id, version: row.version, password, response: 'No retention obligation prevents this approved erasure', confirmation: 'DELETE Salon to review' };
    await assert.rejects(() => privacyAction(f.store, f.admin, input));
    await privacyAction(f.store, f.admin, { ...input, retentionReviewed: true });
    for (const table of ['salons', 'visits', 'evidence_files']) assert.equal(Number((await f.store.db.get(`SELECT count(*) AS n FROM ${table}`)).n), 0);
    const ledger = await f.store.db.all('SELECT * FROM erased_salons');
    await restoreDatabase(target.db, before, ledger);
    assert.equal((await target.snapshot(f.sales)).salons.length, 0);
    assert.equal(Number((await target.db.get('SELECT count(*) AS n FROM evidence_files')).n), 0);
    assert.equal(Number((await target.db.get('SELECT count(*) AS n FROM erased_salons')).n), 1);
  } finally { f.store.close(); target.close(); }
});

test('corrections update the record atomically and reject stale record versions', async () => {
  const f = await fixture();
  try {
    const row = await verify(f, await request(f, 'correction'));
    const salon = (await f.store.snapshot(f.admin)).salons[0];
    const input = { action: 'rectify', id: row.id, version: row.version, password, response: 'Subject confirmed the corrected business contact', fields: { ...salon, contact: 'Corrected contact' }, salonVersion: salon.version - 1 };
    await assert.rejects(() => privacyAction(f.store, f.admin, input), e => e.status === 409);
    await privacyAction(f.store, f.admin, { ...input, salonVersion: salon.version });
    assert.equal((await f.store.snapshot(f.admin)).salons[0].contact, 'Corrected contact');
    assert.equal((await f.store.snapshot(f.admin)).visits.length, 1);
  } finally { f.store.close(); }
});

test('maintenance removes only expired credentials, preserving business records', async () => {
  const f = await fixture();
  try {
    const current = await f.store.createSession(f.admin, false);
    await f.store.db.run('INSERT INTO sessions VALUES (?,?,?)', 'expired', f.admin.id, 1);
    await f.store.db.run('INSERT INTO mfa_pending VALUES (?,?,?)', f.admin.id, 'expired-secret', 1);
    await cleanupExpiredData(f.store);
    assert.equal(await f.store.db.get("SELECT token FROM sessions WHERE token='expired'"), undefined);
    assert.equal(await f.store.db.get('SELECT user_id FROM mfa_pending'), undefined);
    assert.equal((await f.store.session(current.token)).id, f.admin.id);
    assert.equal((await f.store.snapshot(f.admin)).salons.length, 1);
  } finally { f.store.close(); }
});

test('backups preserve MFA and privacy data while excluding sessions and pending setup', async () => {
  const f = await fixture(); const target = await createStore(':memory:');
  try {
    const setup = await securityAction(f.store, f.admin, { action: 'beginMfa', password });
    const codes = await securityAction(f.store, f.admin, { action: 'confirmMfa', password, code: totp(setup.secret, Math.floor(Date.now() / 30000)) });
    await request(f);
    const key = randomBytes(32).toString('hex'), snapshot = await snapshotDatabase(f.store.db);
    assert.equal(snapshot.tables.sessions, undefined); assert.equal(snapshot.tables.mfa_pending, undefined);
    await restoreDatabase(target.db, decryptBackup(encryptBackup(snapshot, key), key));
    await assert.rejects(() => target.login({ email: f.admin.email, password }));
    assert.equal((await target.login({ email: f.admin.email, password, otp: codes.recoveryCodes[0] })).id, f.admin.id);
    assert.equal((await privacyOverview(target, f.admin)).requests.length, 1);
  } finally { f.store.close(); target.close(); }
});

test('password recovery does not bypass an enrolled second factor', async () => {
  const f = await fixture();
  try {
    const setup = await securityAction(f.store, f.admin, { action: 'beginMfa', password });
    const result = await securityAction(f.store, f.admin, { action: 'confirmMfa', password, code: totp(setup.secret, Math.floor(Date.now() / 30000)) });
    const reset = await f.store.resetCode(f.admin, f.admin.id);
    const changed = 'Changed-test-password-2026';
    await f.store.resetPassword({ email: f.admin.email, code: reset.code, password: changed });
    await assert.rejects(() => f.store.login({ email: f.admin.email, password: changed }));
    assert.equal((await f.store.login({ email: f.admin.email, password: changed, otp: result.recoveryCodes[0] })).id, f.admin.id);
  } finally { f.store.close(); }
});

test('legacy version-one backups remain readable after the additive security migrations', async () => {
  const f = await fixture(), target = await createStore(':memory:');
  try {
    const snapshot = await snapshotDatabase(f.store.db);
    for (const table of ['mfa_credentials', 'mfa_recovery', 'privacy_requests', 'erased_salons', 'restricted_salons']) delete snapshot.tables[table];
    snapshot.version = 1;
    const key = randomBytes(32).toString('hex');
    await restoreDatabase(target.db, decryptBackup(encryptBackup(snapshot, key), key));
    assert.equal((await target.login({ email: f.admin.email, password })).id, f.admin.id);
    assert.equal((await target.snapshot(f.admin)).salons.length, 1);
  } finally { f.store.close(); target.close(); }
});
