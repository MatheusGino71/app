export const CAMPAIGN_SOURCE = "https://www.canva.com/design/DAHYf6ZHcmU/5kFg4XhsAtIPsdZOpXY2cQ/view";
export const CAMPAIGNS = [
  { id: "salon-sales", name: "Salon Sales Competition", brand: "GRACE PRO", pages: "1–8", duration: 30, subtitle: "A 30-day Home Care sell-out competition inside each salon.", mechanic: "150 Home Care units per salon. Three professionals rewarded per qualifying salon: €150 cash, €100 cash and €50 in products at price-list value.", timeline: ["Week 1 · Confirm salons, rules, training and opening inventory.", "Week 2 · Monitor sales and support the teams.", "Week 3 · Support underperforming salons and encourage replenishment.", "Week 4 · Validate sales, eligibility, prizes and actual replenishment orders."], conditions: "The €135,000 scenario is potential sell-in equivalent, assuming full replenishment of 4,500 units at €30. It is not confirmed orders or profit. The €13,500 ceiling is 10% of this projection; €4,500 is unallocated capacity, not profit." },
  { id: "brae-12-12", name: "Braé 12+12 Professional Offer", brand: "BRAÉ", pages: "9–13", duration: 10, subtitle: "Buy 12 Wanna Be Blonde bleaching powders. Receive 12 OX developers free.", mechanic: "12 × 500 g bleaching powders at €33 = €396 paid. 12 × 900 ml OX developers at €13 = €156 bonus price-list value. 24 units delivered, €552 combined value.", timeline: ["Days 1–2 · Check stock, variants, margins and supplier support.", "Days 3–4 · Approve the mechanic and sales materials.", "Days 5–7 · Contact selected salons.", "Days 8–10 · Track orders, stock allocation and uptake."], conditions: "One package per participating salon is assumed. Bonus products are not revenue. Stock, actual acquisition costs, supplier funding and contribution margins remain subject to confirmation. The source has conflicting figures for 40 salons; the system calculates 40 × €396 = €15,840." },
  { id: "icons-edit", name: "The Icons Edit", brand: "GRACE PRO · MULTI-BRAND", pages: "14–18", duration: null, subtitle: "13 professional favourites. One €414 multi-brand bundle, plus a product bonus.", mechanic: "The bundle is sold at its full combined price-list value, without a cash discount. The extra product must still be selected and approved. The illustrative €19 bonus is not an approved SKU or actual promotional cost.", timeline: ["Confirm the 13-unit composition and €414 commercial price.", "Select the bonus SKU and validate stock and acquisition costs.", "Confirm contribution margins and participation targets.", "Approve sales communication and launch."], conditions: "One bundle per salon is assumed. Scenarios cover 30, 50 and 70 salons. Paid units exclude the bonus. The source lists Revival Oil at €23.50 but gives a conflicting €33.50 line total; using one unit at €23.50 produces the stated €414 bundle. Confirm before launch." },
] as const;
export type CampaignId = typeof CAMPAIGNS[number]["id"];
export const CAMPAIGN_STATUSES = ["planned", "contacted", "confirmed", "completed", "cancelled"] as const;
export type CampaignStatus = typeof CAMPAIGN_STATUSES[number];
export type CampaignEntry = { campaignId: CampaignId; salonId: string; status: CampaignStatus; startDate: string; packages: number; orderReference: string; note: string; professionals: { name: string; units: number }[]; version: number; updatedAt: string; updatedBy: string };
export const ICONS_PRODUCTS = [
  { name: "Vita Fluid", quantity: 2, cents: 3800 }, { name: "Vitamin Color", quantity: 2, cents: 3300 },
  { name: "Pure Keratin", quantity: 2, cents: 4300 }, { name: "Vita Booster", quantity: 2, cents: 3200 },
  { name: "Essential", quantity: 1, cents: 3300 }, { name: "Revival Oil", quantity: 1, cents: 2350 },
  { name: "Divine 10 In 1", quantity: 1, cents: 3000 }, { name: "Bond Angel Step 3", quantity: 1, cents: 1950 },
  { name: "Tempting Vegan Color Cleaner Set", quantity: 1, cents: 1600 },
] as const;
export function campaignProjection(id: CampaignId, salons: number, prizePerSalon = 300) {
  if (!Number.isSafeInteger(salons) || salons < 0 || salons > 10000) throw new Error("Use a whole number of salons between 0 and 10,000.");
  if (id === "salon-sales") {
    if (![200, 300, 450].includes(prizePerSalon)) throw new Error("Invalid incentive scenario.");
    return { paidUnits: salons * 150, bonusUnits: 0, revenue: salons * 4500, bonusValue: 0, prizeValue: salons * prizePerSalon, ceiling: salons * 450, combinedValue: salons * 4500 };
  }
  if (id === "brae-12-12") return { paidUnits: salons * 12, bonusUnits: salons * 12, revenue: salons * 396, bonusValue: salons * 156, prizeValue: 0, ceiling: 0, combinedValue: salons * 552 };
  if (id === "icons-edit") return { paidUnits: salons * 13, bonusUnits: 0, revenue: salons * 414, bonusValue: salons * 19, prizeValue: 0, ceiling: 0, combinedValue: salons * 414 };
  throw new Error("Campaign not found.");
}
export function parseCampaignEntry(input: unknown): Omit<CampaignEntry, "updatedAt" | "updatedBy"> {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid campaign record.");
  const v = input as Record<string, unknown>;
  const text = (key: string, max: number) => { const value = v[key]; if (typeof value !== "string" || value.length > max) throw new Error("Invalid campaign record."); return value.trim(); };
  const integer = (value: unknown, max: number) => { if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > max) throw new Error("Use non-negative whole quantities."); return value; };
  const campaignId = text("campaignId", 50) as CampaignId; if (!CAMPAIGNS.some(c => c.id === campaignId)) throw new Error("Campaign not found.");
  const salonId = text("salonId", 100); if (!salonId) throw new Error("Select a salon.");
  const status = text("status", 20) as CampaignStatus; if (!CAMPAIGN_STATUSES.includes(status)) throw new Error("Invalid participation status.");
  const startDate = text("startDate", 10); if (startDate && (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !Number.isFinite(Date.parse(startDate)) || new Date(startDate).toISOString().slice(0, 10) !== startDate)) throw new Error("Invalid start date.");
  const packages = integer(v.packages, 10000); const version = integer(v.version, 1e9);
  if (!Array.isArray(v.professionals) || v.professionals.length > 100) throw new Error("Invalid professional list.");
  const professionals = v.professionals.map(raw => {
    if (!raw || typeof raw !== "object" || typeof raw.name !== "string" || raw.name.trim().length < 2 || raw.name.length > 120) throw new Error("Enter each professional's name.");
    return { name: raw.name.trim(), units: integer(raw.units, 1e6) };
  });
  if (new Set(professionals.map(p => p.name.toLocaleLowerCase())).size !== professionals.length) throw new Error("Professional names must be unique within the salon.");
  if (campaignId !== "salon-sales" && professionals.length) throw new Error("Professional sales belong to the salon competition.");
  if (campaignId === "salon-sales" && packages !== 0) throw new Error("The competition tracks individual units, not packages.");
  const orderReference = text("orderReference", 200); if (packages > 0 && !orderReference) throw new Error("Add the order reference for recorded packages.");
  return { campaignId, salonId, status, startDate, packages, version, orderReference, note: text("note", 4000), professionals };
}
export function campaignRanking(professionals: CampaignEntry["professionals"]) {
  const sorted = [...professionals].sort((a, b) => b.units - a.units || a.name.localeCompare(b.name));
  return sorted.map((p, index) => ({ ...p, rank: sorted.findIndex(other => other.units === p.units) + 1, tied: sorted.filter(other => other.units === p.units).length > 1, position: index + 1 }));
}
