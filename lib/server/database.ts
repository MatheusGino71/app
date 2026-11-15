import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createClient, type InValue } from "@libsql/client/web";
export type Row = Record<string, unknown>;
export type Value = string | number | null;
export interface SQL {
  get(sql: string, ...args: Value[]): Promise<Row | undefined>;
  all(sql: string, ...args: Value[]): Promise<Row[]>;
  run(sql: string, ...args: Value[]): Promise<unknown>;
  exec(sql: string): Promise<void>;
}
export interface Database extends SQL {
  transaction<T>(fn: (sql: SQL) => Promise<T>): Promise<T>;
  close(): void;
  native?: DatabaseSync;
}
export function openDatabase(path: string, authToken?: string): Database {
  if (/^(libsql|https):/.test(path)) {
    const client = createClient({ url: path.replace(/^libsql:/, "https:"), authToken });
    function wrap(executor: Pick<typeof client, "execute" | "executeMultiple">): SQL {
      return {
        async get(sql, ...args) { return (await executor.execute({ sql, args: args as InValue[] })).rows[0] as Row | undefined; },
        async all(sql, ...args) { return (await executor.execute({ sql, args: args as InValue[] })).rows as unknown as Row[]; },
        async run(sql, ...args) { return executor.execute({ sql, args: args as InValue[] }); },
        async exec(sql) { await executor.executeMultiple(sql); },
      };
    }
    return { ...wrap(client), async transaction(fn) { const tx = await client.transaction("write"); try { const result = await fn(wrap(tx)); await tx.commit(); return result; } catch (e) { if (!tx.closed) await tx.rollback(); throw e; } finally { tx.close(); } }, close() { client.close(); } };
  }
  if (process.env.VERCEL) throw new Error("Configure TURSO_DATABASE_URL e TURSO_AUTH_TOKEN na Vercel. O banco local não é usado em funções serverless.");
  if (path !== ":memory:") mkdirSync(dirname(resolve(path)), { recursive: true });
  const db = new DatabaseSync(path); db.exec("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000");
  // All local statements and transactions share one lock; independent requests cannot join another transaction.
  let tail: Promise<void> = Promise.resolve();
  async function lock<T>(fn: () => Promise<T>): Promise<T> { const previous = tail; let release!: () => void; tail = new Promise(r => { release = r; }); await previous; try { return await fn(); } finally { release(); } }
  const direct: SQL = {
    async get(sql, ...args) { return db.prepare(sql).get(...args); }, async all(sql, ...args) { return db.prepare(sql).all(...args); },
    async run(sql, ...args) { return db.prepare(sql).run(...args); }, async exec(sql) { db.exec(sql); },
  };
  return { native: db,
    get: (sql, ...args) => lock(() => direct.get(sql, ...args)), all: (sql, ...args) => lock(() => direct.all(sql, ...args)),
    run: (sql, ...args) => lock(() => direct.run(sql, ...args)), exec: sql => lock(() => direct.exec(sql)),
    transaction: fn => lock(async () => { db.exec("BEGIN IMMEDIATE"); try { const result = await fn(direct); db.exec("COMMIT"); return result; } catch (e) { db.exec("ROLLBACK"); throw e; } }),
    close() { db.close(); },
  };
}
