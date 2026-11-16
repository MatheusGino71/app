import type { SQL } from "./database";

/** Shared by approved erasures and restore, so old backups cannot undo an erasure ledger. */
export async function eraseSalonRecords(q: SQL, salonId: string, erasedAt: string) {
  const accounts = await q.all("SELECT p.user_id FROM account_profiles p JOIN customer_accounts c ON c.user_id=p.user_id WHERE p.salon_id=?", salonId);
  for (const account of accounts) {
    const id = String(account.user_id);
    for (const table of ["sessions", "email_tokens", "resets", "drafts", "mfa_recovery", "mfa_credentials", "mfa_pending"]) await q.run(`DELETE FROM ${table} WHERE user_id=?`, id);
    await q.run("UPDATE users SET name='Removed',email=?,password=? WHERE id=?", `removed-${id}@privacy.invalid`, "disabled", id);
    await q.run("UPDATE email_status SET verified_at=NULL WHERE user_id=?", id);
    await q.run("UPDATE privacy_requests SET note='',response='' WHERE requested_by=?", id);
  }
  for (const row of await q.all("SELECT user_id,data FROM drafts")) {
    const draft = JSON.parse(String(row.data));
    if (draft.salonId === salonId) await q.run("DELETE FROM drafts WHERE user_id=?", String(row.user_id));
  }
  // Clear free text in all related requests; preserve only procedural evidence.
  await q.run("UPDATE privacy_requests SET note='',response='',salon_id=NULL WHERE salon_id=?", salonId);
  for (const table of ["restricted_salons", "campaign_entries", "evidence_files", "account_profiles", "purchase_reviews", "actions", "visits"]) await q.run(`DELETE FROM ${table} WHERE salon_id=?`, salonId);
  await q.run("DELETE FROM salons WHERE id=?", salonId);
  await q.run("INSERT INTO erased_salons VALUES (?,?) ON CONFLICT(salon_id) DO NOTHING", salonId, erasedAt);
}
