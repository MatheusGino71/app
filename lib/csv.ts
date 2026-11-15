export type PurchaseRow = { salonId: string; annualPurchase: number; orders: number | null; cutoff: string; source: string };
export function parsePurchaseCSV(input: string): PurchaseRow[] {
  const text = input.replace(/^\uFEFF/, "");
  const delimiter = text.slice(0, text.indexOf("\n") < 0 ? undefined : text.indexOf("\n")).includes(";") ? ";" : ",";
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (c === delimiter && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((c === "\n" || c === "\r") && !quoted) { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (quoted) throw new Error("O CSV contém aspas sem fechamento.");
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row);
  const header = rows.shift(); const expected = ["salao_id", "compra_eur", "pedidos", "data_corte", "fonte"];
  if (!header || header.length !== 5 || header.some((v, i) => v !== expected[i])) throw new Error("Cabeçalho esperado: salao_id;compra_eur;pedidos;data_corte;fonte");
  if (!rows.length || rows.length > 500) throw new Error("O CSV deve conter entre 1 e 500 linhas.");
  return rows.map((values, i) => {
    if (values.length !== 5) throw new Error(`Confira as cinco colunas da linha ${i + 2}.`);
    const [salonId, amount, count, cutoff, source] = values;
    const annualPurchase = Number(delimiter === ";" ? amount.replace(",", ".") : amount); const orders = count === "" ? null : Number(count);
    if (!salonId || !amount || !Number.isFinite(annualPurchase) || annualPurchase < 0 || (orders !== null && (!Number.isInteger(orders) || orders < 0))) throw new Error(`Valor inválido na linha ${i + 2}.`);
    return { salonId, annualPurchase, orders, cutoff, source };
  });
}
export function csvCell(value: unknown): string {
  const text = String(value ?? ""); const safe = /^[\s]*[=+\-@]/.test(text) ? "'" + text : text;
  return '"' + safe.replaceAll('"', '""') + '"';
}
