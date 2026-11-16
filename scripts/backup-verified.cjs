require('./register.cjs');
const { mkdir, writeFile, readFile, mkdtemp, rm } = require('node:fs/promises');
const { resolve, join, dirname } = require('node:path');
const { tmpdir } = require('node:os');
const { createStore, getStore } = require('../lib/server/store.ts');
const { snapshotDatabase, encryptBackup, decryptBackup, restoreDatabase, BACKUP_TABLES } = require('../lib/server/backup.ts');

async function verifyRestore(bytes, secret, snapshot) {
  const folder = await mkdtemp(join(tmpdir(), 'grace-pro-restore-'));
  const target = await createStore(join(folder, 'verification.sqlite'));
  try {
    await restoreDatabase(target.db, decryptBackup(bytes, secret));
    for (const table of BACKUP_TABLES) {
      const count = Number((await target.db.get(`SELECT count(*) AS n FROM ${table}`)).n);
      if (count !== snapshot.tables[table].length) throw new Error(`Restore verification failed for ${table}`);
    }
    if (Number((await target.db.get('SELECT count(*) AS n FROM sessions')).n)) throw new Error('Restore included sessions');
  } finally {
    target.close();
    if (dirname(resolve(folder)) !== resolve(tmpdir()) || !folder.includes('grace-pro-restore-')) throw new Error('Temporary restore path validation failed');
    await rm(folder, { recursive: true, force: true });
  }
}
(async () => {
  const secret = process.env.ATELIER_BACKUP_KEY;
  if (!secret) throw new Error('Configure ATELIER_BACKUP_KEY before running backup or restore.');
  if (process.env.CI && (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN)) throw new Error('Remote database credentials are required in CI.');
  const store = await getStore();
  try {
    if (process.argv[2] === 'restore') {
      if (!process.argv[3] || !process.argv[4]) throw new Error('Provide the backup and the latest erasure ledger: restore backup.enc erasure-ledger.enc');
      const snapshot = decryptBackup(await readFile(resolve(process.argv[3])), secret);
      const ledger = decryptBackup(await readFile(resolve(process.argv[4])), secret);
      if (Date.parse(ledger.createdAt) < Date.parse(snapshot.createdAt)) throw new Error('The erasure ledger predates the backup. Obtain the latest ledger before restoring.');
      await restoreDatabase(store.db, snapshot, ledger.tables.erased_salons);
      console.log('Restored into an empty database, with erasure ledger applied. Sessions were not restored.');
    } else {
      const snapshot = await snapshotDatabase(store.db), bytes = encryptBackup(snapshot, secret);
      await verifyRestore(bytes, secret, snapshot);
      const folder = resolve(process.env.ATELIER_BACKUP_DIR || '.data/backups'); await mkdir(folder, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const ledger = { version: 2, createdAt: snapshot.createdAt, tables: Object.fromEntries(BACKUP_TABLES.map(t => [t, t === 'erased_salons' ? snapshot.tables[t] : []])) };
      await writeFile(join(folder, `grace-pro-${stamp}.enc`), bytes, { mode: 0o600 });
      await writeFile(join(folder, 'erasure-ledger.enc'), encryptBackup(ledger, secret), { mode: 0o600 });
      console.log('Encrypted backup created; isolated restore verified; erasure ledger included.');
    }
  } finally { store.close(); }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
