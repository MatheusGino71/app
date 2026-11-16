require('./register.cjs');
const { privacyNoticeConfig } = require('../lib/privacy-notice.ts');
const { mfaConfigured } = require('../lib/server/mfa.ts');
const { getStore } = require('../lib/server/store.ts');
const checks = [];
const check = (name, ok) => { checks.push({ name, ok: !!ok }); console.log(`${ok ? 'OK' : 'PENDING'} ${name}`); };
(async () => {
  check('HTTPS application origin', /^https:\/\/[^/]+$/.test(process.env.ATELIER_APP_ORIGIN ?? ''));
  check('Remote database credentials', /^(https|libsql):/.test(process.env.TURSO_DATABASE_URL ?? '') && process.env.TURSO_AUTH_TOKEN);
  check('Approved privacy notice and controller details', privacyNoticeConfig().ready);
  check('Separate MFA encryption key', mfaConfigured() && process.env.ATELIER_MFA_KEY !== process.env.ATELIER_BACKUP_KEY);
  check('Backup encryption key', /^[a-f0-9]{64}$/i.test(process.env.ATELIER_BACKUP_KEY ?? ''));
  check('Maintenance cron secret', (process.env.CRON_SECRET ?? '').length >= 32);
  const days = Number(process.env.ATELIER_RECORD_RETENTION_DAYS);
  check('Approved retention review period', Number.isSafeInteger(days) && days >= 30 && days <= 36500);
  // With no remote credentials, do not accidentally audit a local database as production.
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    const store = await getStore();
    try {
      const count = Number((await store.db.get("SELECT count(*) AS n FROM users u LEFT JOIN customer_accounts c ON c.user_id=u.id WHERE u.role='admin' AND c.user_id IS NULL")).n);
      const protectedCount = Number((await store.db.get("SELECT count(*) AS n FROM users u JOIN mfa_credentials m ON m.user_id=u.id LEFT JOIN customer_accounts c ON c.user_id=u.id WHERE u.role='admin' AND c.user_id IS NULL")).n);
      check('All administrators enrolled in MFA', count > 0 && count === protectedCount);
      await store.db.get('SELECT 1 AS ready'); check('Database reachable', true);
    } finally { store.close(); }
  } else check('Production administrator MFA and connectivity verified', false);
  console.log('Provider region, subprocessors, contracts, backup schedule and notification contacts require separate provider verification.');
  process.exitCode = checks.some(c => !c.ok) ? 1 : 0;
})().catch(() => { console.error('Production verification failed; review provider access and configuration.'); process.exitCode = 1; });
