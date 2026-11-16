  "use client";

import { useState } from "react";
import { useI18n } from "../i18n/language-provider";
import {
  CAMPAIGNS,
  ICONS_PRODUCTS,
  campaignProjection,
  campaignRanking,
  type CampaignId,
  type CampaignEntry,
  type CampaignStatus,
  CAMPAIGN_STATUSES,
} from "../../../lib/campaigns";
import { getCampaignText, type CampaignLocaleKey } from "../../../lib/campaigns-i18n";
import type { WorkspaceData } from "../../../lib/domain";
import {
  Trophy,
  Sparkles,
  Calendar,
  Building2,
  TrendingUp,
  Plus,
  Clock,
  Layers,
  ChevronRight,
  Calculator,
  Gift,
  Coins,
  ArrowRight,
  X,
  Edit3,
  Award,
  Trash2,
  Check,
  AlertCircle,
} from "lucide-react";
import { Field, Modal } from "./ui";

export default function CampaignPanel({
  data,
  onSaveEntry,
  onOpenSalon,
}: {
  data: WorkspaceData;
  onSaveEntry: (entry: Omit<CampaignEntry, "updatedAt" | "updatedBy">) => Promise<void>;
  onOpenSalon: (salonId: string) => void;
}) {
  const { t, language, money, dateLabel } = useI18n();
  const ct = (key: CampaignLocaleKey) => getCampaignText(key, language);

  const [activeTab, setActiveTab] = useState<CampaignId>("salon-sales");

  // Simulator state
  const [simSalons, setSimSalons] = useState<number>(30);
  const [simPrizeScenario, setSimPrizeScenario] = useState<200 | 300 | 450>(300);

  // Form modal state
  const [editingEntry, setEditingEntry] = useState<{
    salonId: string;
    campaignId: CampaignId;
    status: CampaignStatus;
    startDate: string;
    packages: number;
    orderReference: string;
    note: string;
    professionals: { name: string; units: number }[];
    version: number;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const campaign = CAMPAIGNS.find((c) => c.id === activeTab)!;
  const localizedCampaign = language.toLowerCase().startsWith("pt")
    ? {
        ...campaign,
        name: activeTab === "salon-sales" ? "Competição de Sell-out em Salões" : activeTab === "brae-12-12" ? "Oferta Profissional Braé 12+12" : "The Icons Edit",
        subtitle: activeTab === "salon-sales"
          ? "Uma competição de sell-out de Home Care durante 30 dias em cada salão."
          : activeTab === "brae-12-12"
            ? "Compre 12 pós descolorantes Wanna Be Blonde e receba 12 oxidantes OX grátis."
            : "13 favoritos profissionais em um bundle multimarcas de €414, com bônus de produto.",
        mechanic: activeTab === "salon-sales"
          ? "150 unidades de Home Care por salão. Três profissionais premiados por salão elegível: €150 em dinheiro, €100 em dinheiro e €50 em produtos."
          : campaign.mechanic,
        timeline: activeTab === "salon-sales"
          ? ["Semana 1 · Confirme salões, regras, treinamento e estoque inicial.", "Semana 2 · Acompanhe as vendas e apoie as equipes.", "Semana 3 · Apoie salões com baixo desempenho e incentive a reposição.", "Semana 4 · Valide vendas, elegibilidade, prêmios e pedidos de reposição."]
          : campaign.timeline,
      }
    : campaign;
  const entries = (data.campaignEntries ?? []).filter((e) => e.campaignId === activeTab);

  // Status labels mapping
  const statusLabels: Record<CampaignStatus, string> = {
    planned: ct("status_planned"),
    contacted: ct("status_contacted"),
    confirmed: ct("status_confirmed"),
    completed: ct("status_completed"),
    cancelled: ct("status_cancelled"),
  };

  const statusColors: Record<CampaignStatus, { bg: string; text: string; border: string }> = {
    planned: { bg: "#f4f5f3", text: "#4c5549", border: "#dcdfd6" },
    contacted: { bg: "#eef3f7", text: "#244d70", border: "#cfdbe4" },
    confirmed: { bg: "#fbf6e8", text: "#87621c", border: "#eadcbe" },
    completed: { bg: "#edf4ed", text: "#2c5b37", border: "#cbe0cf" },
    cancelled: { bg: "#fbf0f0", text: "#8c2e2e", border: "#eecfcf" },
  };

  // Projection calculation
  let projection = {
    paidUnits: 0,
    bonusUnits: 0,
    revenue: 0,
    bonusValue: 0,
    prizeValue: 0,
    ceiling: 0,
    combinedValue: 0,
  };
  try {
    projection = campaignProjection(activeTab, simSalons, simPrizeScenario);
  } catch {}

  function handleAddEntry(salonId?: string) {
    setFormError("");
    const existing = salonId ? entries.find((e) => e.salonId === salonId) : null;

    if (existing) {
      setEditingEntry({
        salonId: existing.salonId,
        campaignId: existing.campaignId,
        status: existing.status,
        startDate: existing.startDate || "",
        packages: existing.packages || 0,
        orderReference: existing.orderReference || "",
        note: existing.note || "",
        professionals: existing.professionals ? [...existing.professionals] : [],
        version: existing.version || 0,
      });
    } else {
      setEditingEntry({
        salonId: salonId || (data.salons[0]?.id ?? ""),
        campaignId: activeTab,
        status: "planned",
        startDate: new Date().toISOString().slice(0, 10),
        packages: activeTab === "salon-sales" ? 0 : 1,
        orderReference: "",
        note: "",
        professionals:
          activeTab === "salon-sales"
            ? [
                { name: "Stylist 1", units: 0 },
                { name: "Stylist 2", units: 0 },
                { name: "Stylist 3", units: 0 },
              ]
            : [],
        version: 0,
      });
    }
  }

  async function handleSaveSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEntry) return;
    setSaving(true);
    setFormError("");
    try {
      await onSaveEntry({
        campaignId: editingEntry.campaignId,
        salonId: editingEntry.salonId,
        status: editingEntry.status,
        startDate: editingEntry.startDate,
        packages: editingEntry.campaignId === "salon-sales" ? 0 : Number(editingEntry.packages),
        orderReference: editingEntry.orderReference.trim(),
        note: editingEntry.note.trim(),
        professionals:
          editingEntry.campaignId === "salon-sales"
            ? editingEntry.professionals
                .filter((p) => p.name.trim().length > 0)
                .map((p) => ({ name: p.name.trim(), units: Math.max(0, Math.floor(Number(p.units) || 0)) }))
            : [],
        version: editingEntry.version,
      });
      setEditingEntry(null);
    } catch (err: any) {
      setFormError(err.message || "Failed to save campaign registration.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="crm-campaigns">
      {/* Top Banner / Event Selector */}
      <section className="crm-campaign-hero">
        <div className="crm-campaign-hero-content">
          <div className="crm-campaign-badge">
            <Sparkles size={13} />
            <span>{ct("badge_trade_marketing")}</span>
          </div>
          <h2>{ct("hero_title")}</h2>
          <p>{ct("hero_description")}</p>

          <div className="crm-campaign-tabs">
            {CAMPAIGNS.map((c) => {
              const count = (data.campaignEntries ?? []).filter((e) => e.campaignId === c.id).length;
              const isActive = activeTab === c.id;
              return (
                <button
                  key={c.id}
                  className={`crm-campaign-tab-btn ${isActive ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab(c.id);
                    setSimSalons(30);
                  }}
                >
                  <div className="crm-tab-top">
                    <span className="crm-tab-brand">{c.brand}</span>
                    {c.duration ? (
                      <span className="crm-tab-duration">{c.duration} {ct("days")}</span>
                    ) : (
                      <span className="crm-tab-duration">{ct("promotional_period")}</span>
                    )}
                  </div>
                  <strong>{language.toLowerCase().startsWith("pt") ? c.id === "salon-sales" ? "Competição de Sell-out em Salões" : c.id === "brae-12-12" ? "Oferta Profissional Braé 12+12" : "The Icons Edit" : c.name}</strong>
                  <div className="crm-tab-foot">
                    <span>
                      {count} {count === 1 ? ct("salon_count_single") : ct("salons_count")}
                    </span>
                    <ChevronRight size={15} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Campaign Focus Area */}
      <div className="crm-campaign-body">
        {/* Active Campaign Header Card */}
        <section className="crm-card crm-campaign-detail-header">
          <div className="crm-campaign-header-row">
            <div>
              <div className="crm-campaign-tags">
                <span className="crm-tag brand">{campaign.brand}</span>
                {campaign.duration ? (
                  <span className="crm-tag duration">
                    <Clock size={12} /> {campaign.duration} {ct("day_activation")}
                  </span>
                ) : (
                  <span className="crm-tag duration">{ct("promotional_period")}</span>
                )}
                <span className="crm-tag pages">{ct("slides")} {campaign.pages}</span>
              </div>
              <h1 className="crm-campaign-title">{localizedCampaign.name}</h1>
              <p className="crm-campaign-subtitle">{localizedCampaign.subtitle}</p>
            </div>

            <button
              className="crm-btn primary"
              onClick={() => handleAddEntry()}
              disabled={data.salons.length === 0}
            >
              <Plus size={16} /> {ct("enroll_salon")}
            </button>
          </div>

          <div className="crm-campaign-mechanic-box">
            <strong>{ct("mechanic_title")}:</strong>
            <p>{localizedCampaign.mechanic}</p>
            {localizedCampaign.conditions && (
              <small className="crm-campaign-conditions">
                {ct("regulatory_note")}: {localizedCampaign.conditions}
              </small>
            )}
          </div>
        </section>

        {/* Dynamic Presentation Details for each campaign */}
        {activeTab === "salon-sales" && (
          <div className="crm-campaign-grid-2">
            {/* The 5 Steps */}
            <section className="crm-card">
              <div className="crm-card-head">
                <div>
                  <span className="crm-overline">{ct("activation_flow")}</span>
                  <h3>{ct("how_it_works")}</h3>
                </div>
              </div>
              <div className="crm-steps-flow">
                {[
                  { step: "01", title: ct("step_select"), desc: ct("step_select_desc") },
                  { step: "02", title: ct("step_activate"), desc: ct("step_activate_desc") },
                  { step: "03", title: ct("step_compete"), desc: ct("step_compete_desc") },
                  { step: "04", title: ct("step_reward"), desc: ct("step_reward_desc") },
                  { step: "05", title: ct("step_replenish"), desc: ct("step_replenish_desc") },
                ].map((s) => (
                  <div key={s.step} className="crm-step-item">
                    <div className="crm-step-number">{s.step}</div>
                    <strong>{s.title}</strong>
                    <p>{s.desc}</p>
                  </div>
                ))}
              </div>

              {/* 3 Winners Podium */}
              <div className="crm-podium-section">
                <span className="crm-overline">{ct("individual_recognition")}</span>
                <h4>{ct("prizes_per_salon")}</h4>
                <div className="crm-podium-cards">
                  <div className="crm-podium-card gold">
                    <div className="crm-podium-rank">{ct("first_place")}</div>
                    <div className="crm-podium-val">€150</div>
                    <span>{ct("cash_prize")}</span>
                    <small>50% {ct("total_share")}</small>
                  </div>
                  <div className="crm-podium-card silver">
                    <div className="crm-podium-rank">{ct("second_place")}</div>
                    <div className="crm-podium-val">€100</div>
                    <span>{ct("cash_prize")}</span>
                    <small>33.3% {ct("total_share")}</small>
                  </div>
                  <div className="crm-podium-card bronze">
                    <div className="crm-podium-rank">{ct("third_place")}</div>
                    <div className="crm-podium-val">€50</div>
                    <span>{ct("product_prize")}</span>
                    <small>{ct("retail_price_list")} (16.7%)</small>
                  </div>
                </div>
              </div>
            </section>

            {/* Timeline & KPIs */}
            <section className="crm-card">
              <div className="crm-card-head">
                <div>
                  <span className="crm-overline">{ct("timeline_title")}</span>
                  <h3>{ct("timeline_subtitle")}</h3>
                </div>
              </div>
              <div className="crm-weeks-timeline">
                {localizedCampaign.timeline.map((text, i) => (
                  <div key={i} className="crm-week-row">
                    <div className="crm-week-badge">{ct("week")} 0{i + 1}</div>
                    <div className="crm-week-info">
                      <p>{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="crm-kpis-box">
                <span className="crm-overline">{ct("kpis_title")}</span>
                <div className="crm-kpis-grid">
                  <div>
                    <span>{ct("target_per_salon")}</span>
                    <strong>150 {ct("units")}</strong>
                  </div>
                  <div>
                    <span>{ct("potential_sell_in")}</span>
                    <strong>€135,000</strong>
                  </div>
                  <div>
                    <span>{ct("expected_sell_out")}</span>
                    <strong>90%</strong>
                  </div>
                  <div>
                    <span>{ct("prize_allocation")}</span>
                    <strong>6.67%</strong>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "brae-12-12" && (
          <div className="crm-campaign-grid-2">
            {/* The 12+12 Package Value */}
            <section className="crm-card">
              <div className="crm-card-head">
                <div>
                  <span className="crm-overline">{ct("composition_title")}</span>
                  <h3>{ct("package_composition")}</h3>
                </div>
              </div>

              <div className="crm-offer-hero">
                <div className="crm-offer-item">
                  <span className="crm-badge-number">12</span>
                  <div>
                    <strong>BRAÉ Wanna Be Blonde (500 g)</strong>
                    <p>{ct("bleaching_powder")}</p>
                    <small>12 × €33 = €396 ({ct("paid_value")})</small>
                  </div>
                </div>
                <div className="crm-offer-plus">+</div>
                <div className="crm-offer-item bonus">
                  <span className="crm-badge-number">12</span>
                  <div>
                    <strong>BRAÉ OX Developer (900 ml)</strong>
                    <p>{ct("ox_developer")}</p>
                    <small>12 × €13 = €156 ({ct("free_bonus")})</small>
                  </div>
                </div>
              </div>

              <div className="crm-package-summary-table">
                <div className="crm-summary-line">
                  <span>{ct("actual_purchase_value")}</span>
                  <strong>€396.00</strong>
                </div>
                <div className="crm-summary-line bonus">
                  <span>{ct("free_product_value")}</span>
                  <strong>€156.00</strong>
                </div>
                <div className="crm-summary-line total">
                  <span>{ct("total_delivered_value")}</span>
                  <strong>€552.00</strong>
                </div>
                <div className="crm-summary-line highlight">
                  <span>{ct("effective_saving")}</span>
                  <strong>28.26%</strong>
                </div>
              </div>
            </section>

            {/* Execution Plan & Scenarios */}
            <section className="crm-card">
              <div className="crm-card-head">
                <div>
                  <span className="crm-overline">{ct("execution_plan")}</span>
                  <h3>{ct("rapid_execution")}</h3>
                </div>
              </div>

              <div className="crm-weeks-timeline">
                {localizedCampaign.timeline.map((text, i) => (
                  <div key={i} className="crm-week-row">
                    <div className="crm-week-badge">{ct("step")} 0{i + 1}</div>
                    <div className="crm-week-info">
                      <p>{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="crm-kpis-box">
                <span className="crm-overline">{ct("commercial_scenarios")}</span>
                <div className="crm-scenarios-pills">
                  <button
                    className={`crm-pill ${simSalons === 30 ? "active" : ""}`}
                    onClick={() => setSimSalons(30)}
                  >
                    30 {ct("salons_count")}: <strong>€11,880</strong>
                  </button>
                  <button
                    className={`crm-pill ${simSalons === 40 ? "active" : ""}`}
                    onClick={() => setSimSalons(40)}
                  >
                    40 {ct("salons_count")}: <strong>€15,840</strong>
                  </button>
                  <button
                    className={`crm-pill ${simSalons === 50 ? "active" : ""}`}
                    onClick={() => setSimSalons(50)}
                  >
                    50 {ct("salons_count")}: <strong>€19,800</strong>
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "icons-edit" && (
          <div className="crm-campaign-grid-2">
            {/* The 13 Products */}
            <section className="crm-card">
              <div className="crm-card-head">
                <div>
                  <span className="crm-overline">{ct("multi_brand_portfolio")}</span>
                  <h3>{ct("icons_edit_heading")}</h3>
                </div>
              </div>

              <div className="crm-icons-table-wrap">
                <table className="crm-icons-table">
                  <thead>
                    <tr>
                      <th>{ct("product")}</th>
                      <th style={{ textAlign: "center" }}>{ct("quantity")}</th>
                      <th style={{ textAlign: "right" }}>{ct("unit_price")}</th>
                      <th style={{ textAlign: "right" }}>{ct("total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ICONS_PRODUCTS.map((p) => (
                      <tr key={p.name}>
                        <td>{p.name}</td>
                        <td style={{ textAlign: "center" }}>{p.quantity}</td>
                        <td style={{ textAlign: "right" }}>€{(p.cents / 100).toFixed(2)}</td>
                        <td style={{ textAlign: "right" }}>
                          <strong>€{((p.cents * p.quantity) / 100).toFixed(2)}</strong>
                        </td>
                      </tr>
                    ))}
                    <tr className="crm-table-total-row">
                      <td colSpan={3}>
                        <strong>{ct("total_units")}</strong>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <strong style={{ fontSize: "15px", color: "var(--crm-gold)" }}>€414.00</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="crm-note" style={{ marginTop: "14px" }}>
                <Sparkles size={16} />
                <span>
                  <strong>{ct("more_value_no_discount")}:</strong> {ct("more_value_no_discount_desc")}
                </span>
              </div>
            </section>

            {/* Growth Pillars & Scenarios */}
            <section className="crm-card">
              <div className="crm-card-head">
                <div>
                  <span className="crm-overline">{ct("revenue_opportunity")}</span>
                  <h3>{ct("multi_brand_opportunity")}</h3>
                </div>
              </div>

              <div className="crm-pillars-list">
                {[
                  { title: ct("growth_pillar_1_title"), desc: ct("growth_pillar_1_desc") },
                  { title: ct("growth_pillar_2_title"), desc: ct("growth_pillar_2_desc") },
                  { title: ct("growth_pillar_3_title"), desc: ct("growth_pillar_3_desc") },
                  { title: ct("growth_pillar_4_title"), desc: ct("growth_pillar_4_desc") },
                ].map((p, i) => (
                  <div key={i} className="crm-pillar-item">
                    <div className="crm-pillar-badge">0{i + 1}</div>
                    <div>
                      <strong>{p.title}</strong>
                      <p>{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="crm-kpis-box" style={{ marginTop: "20px" }}>
                <span className="crm-overline">{ct("commercial_scenarios")}</span>
                <div className="crm-scenarios-pills">
                  <button
                    className={`crm-pill ${simSalons === 30 ? "active" : ""}`}
                    onClick={() => setSimSalons(30)}
                  >
                    30 {ct("salons_count")}: <strong>€12,420</strong>
                  </button>
                  <button
                    className={`crm-pill ${simSalons === 50 ? "active" : ""}`}
                    onClick={() => setSimSalons(50)}
                  >
                    50 {ct("salons_count")}: <strong>€20,700</strong>
                  </button>
                  <button
                    className={`crm-pill ${simSalons === 70 ? "active" : ""}`}
                    onClick={() => setSimSalons(70)}
                  >
                    70 {ct("salons_count")}: <strong>€28,980</strong>
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Interactive Scenario Simulator */}
        <section className="crm-card crm-simulator-card">
          <div className="crm-card-head">
            <div>
              <span className="crm-overline">{ct("simulator_overline")}</span>
              <h3>{ct("simulator_title")}</h3>
            </div>
            <Calculator size={20} />
          </div>

          <div className="crm-simulator-controls">
            <div className="crm-sim-input-group">
              <label>
                {ct("sim_salons_label")} <strong>{simSalons}</strong>
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={simSalons}
                onChange={(e) => setSimSalons(Number(e.target.value))}
              />
              <div className="crm-sim-presets">
                {[10, 20, 30, 40, 50, 70].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={simSalons === n ? "active" : ""}
                    onClick={() => setSimSalons(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "salon-sales" && (
              <div className="crm-sim-input-group">
                <label>{ct("sim_prize_scenario_label")}</label>
                <div className="crm-prize-options">
                  {[
                    { val: 200, label: ct("conservative") },
                    { val: 300, label: ct("recommended") },
                    { val: 450, label: ct("maximum_budget") },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      className={`crm-prize-btn ${simPrizeScenario === opt.val ? "active" : ""}`}
                      onClick={() => setSimPrizeScenario(opt.val as any)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Simulator Results Output */}
          <div className="crm-sim-results-grid">
            <div className="crm-sim-result-box highlight">
              <span>{ct("projected_sell_in")}</span>
              <strong>{money(projection.revenue)}</strong>
              <small>{simSalons} {ct("participating_salons")}</small>
            </div>
            <div className="crm-sim-result-box">
              <span>{ct("target_units_sold")}</span>
              <strong>{projection.paidUnits.toLocaleString()}</strong>
              <small>{ct("home_care_paid_units")}</small>
            </div>
            {activeTab === "salon-sales" ? (
              <>
                <div className="crm-sim-result-box">
                  <span>{ct("prize_investment")}</span>
                  <strong>{money(projection.prizeValue)}</strong>
                  <small>
                    {projection.revenue > 0
                      ? ((projection.prizeValue / projection.revenue) * 100).toFixed(2)
                      : 0}
                    {ct("of_potential_sell_in")}
                  </small>
                </div>
                <div className="crm-sim-result-box">
                  <span>{ct("budget_ceiling")}</span>
                  <strong>{money(projection.ceiling)}</strong>
                  <small>{ct("remaining_capacity")} {money(projection.ceiling - projection.prizeValue)}</small>
                </div>
              </>
            ) : (
              <>
                <div className="crm-sim-result-box">
                  <span>{ct("bonus_product_value")}</span>
                  <strong>{money(projection.bonusValue)}</strong>
                  <small>{ct("delivered_without_cost")}</small>
                </div>
                <div className="crm-sim-result-box">
                  <span>{ct("total_delivered_value")}</span>
                  <strong>{money(projection.combinedValue)}</strong>
                  <small>{ct("combined_price_list_value")}</small>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Participating Salons Table & Registration */}
        <section className="crm-card">
          <div className="crm-card-head">
            <div>
              <span className="crm-overline">{ct("management_overline")}</span>
              <h3>{ct("enrolled_salons_title")} ({entries.length})</h3>
            </div>
            <button
              className="crm-btn primary"
              onClick={() => handleAddEntry()}
              disabled={data.salons.length === 0}
            >
              <Plus size={16} /> {ct("enroll_salon")}
            </button>
          </div>

          {entries.length === 0 ? (
            <div className="crm-empty-campaign">
              <Building2 size={36} />
              <h4>{ct("no_salons_enrolled")}</h4>
              <p>{ct("no_salons_enrolled_desc")}</p>
              <button
                className="crm-btn primary"
                onClick={() => handleAddEntry()}
                disabled={data.salons.length === 0}
              >
                <Plus size={16} /> {ct("enroll_first_salon")}
              </button>
            </div>
          ) : (
            <div className="crm-table-wrap">
              <table className="crm-campaign-table">
                <thead>
                  <tr>
                    <th>{ct("col_salon")}</th>
                    <th>{ct("col_status")}</th>
                    <th>{ct("col_start_date")}</th>
                    {activeTab === "salon-sales" ? (
                      <>
                        <th>{ct("col_professionals")}</th>
                        <th>{ct("col_sell_out")}</th>
                        <th>{ct("col_top_performer")}</th>
                      </>
                    ) : (
                      <>
                        <th>{ct("col_packages")}</th>
                        <th>{ct("col_order_ref")}</th>
                      </>
                    )}
                    <th>{ct("col_actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const salon = data.salons.find((s) => s.id === entry.salonId);
                    const ranked = campaignRanking(entry.professionals ?? []);
                    const totalUnits = (entry.professionals ?? []).reduce(
                      (acc, cur) => acc + (cur.units || 0),
                      0
                    );
                    const topPerformer = ranked[0];
                    const statusStyle = statusColors[entry.status] || statusColors.planned;

                    return (
                      <tr key={entry.salonId}>
                        <td>
                          <button
                            type="button"
                            className="crm-client-name"
                            onClick={() => onOpenSalon(entry.salonId)}
                          >
                            <span className="crm-avatar">
                              {salon?.name
                                ? salon.name
                                    .split(" ")
                                    .map((v) => v[0])
                                    .slice(0, 2)
                                    .join("")
                                : "S"}
                            </span>
                            <span>
                              <strong>{salon?.name || ct("unknown_salon")}</strong>
                              <small>
                                {salon?.city}, {salon?.country}
                              </small>
                            </span>
                          </button>
                        </td>
                        <td>
                          <span
                            className="crm-campaign-status-badge"
                            style={{
                              backgroundColor: statusStyle.bg,
                              color: statusStyle.text,
                              borderColor: statusStyle.border,
                            }}
                          >
                            {statusLabels[entry.status] || entry.status}
                          </span>
                        </td>
                        <td>{entry.startDate ? dateLabel(entry.startDate) : "—"}</td>
                        {activeTab === "salon-sales" ? (
                          <>
                            <td>
                              <strong>{entry.professionals?.length || 0}</strong> {ct("col_professionals").toLowerCase()}
                            </td>
                            <td>
                              <strong>{totalUnits}</strong> / 150 {ct("units")}
                              <span
                                style={{
                                  display: "inline-block",
                                  marginLeft: "6px",
                                  fontSize: "11px",
                                  color: totalUnits >= 150 ? "#2c5b37" : "var(--crm-muted)",
                                }}
                              >
                                ({Math.round((totalUnits / 150) * 100)}%)
                              </span>
                            </td>
                            <td>
                              {topPerformer && topPerformer.units > 0 ? (
                                <span className="crm-top-performer-pill">
                                  <Award size={13} /> {topPerformer.name} ({topPerformer.units} {ct("units")})
                                </span>
                              ) : (
                                <span className="crm-muted">—</span>
                              )}
                            </td>
                          </>
                        ) : (
                          <>
                            <td>
                              <strong>{entry.packages}</strong> {ct("col_packages").toLowerCase()}
                            </td>
                            <td>{entry.orderReference || "—"}</td>
                          </>
                        )}
                        <td>
                          <button
                            type="button"
                            className="crm-btn quiet"
                            onClick={() => handleAddEntry(entry.salonId)}
                            style={{ padding: "6px 12px", fontSize: "11px" }}
                          >
                            <Edit3 size={13} /> {ct("edit_enrollment")}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* High-End Participation Form Modal */}
      {editingEntry && (
        <Modal
          title={ct("modal_enroll_title")}
          subtitle={`${ct("modal_enroll_subtitle")} ${localizedCampaign.name} — ${
            data.salons.find((s) => s.id === editingEntry.salonId)?.name || ""
          }`}
          onClose={() => setEditingEntry(null)}
          wide
        >
          <form onSubmit={handleSaveSubmit} className="crm-campaign-form">
            {formError && (
              <div className="crm-form-error" role="alert">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <div className="crm-form-grid">
              <Field label={ct("field_salon")}>
                <select
                  value={editingEntry.salonId}
                  onChange={(e) =>
                    setEditingEntry({ ...editingEntry, salonId: e.target.value })
                  }
                  required
                >
                  {data.salons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.city}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={ct("field_status")}>
                <select
                  value={editingEntry.status}
                  onChange={(e) =>
                    setEditingEntry({
                      ...editingEntry,
                      status: e.target.value as CampaignStatus,
                    })
                  }
                  required
                >
                  {CAMPAIGN_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {statusLabels[st]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={ct("field_start_date")}>
                <input
                  type="date"
                  value={editingEntry.startDate}
                  onChange={(e) =>
                    setEditingEntry({ ...editingEntry, startDate: e.target.value })
                  }
                />
              </Field>

              {activeTab !== "salon-sales" && (
                <>
                  <Field label={ct("field_packages")}>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={editingEntry.packages}
                      onChange={(e) =>
                        setEditingEntry({
                          ...editingEntry,
                          packages: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </Field>
                  <Field label={ct("field_order_ref")}>
                    <input
                      type="text"
                      placeholder={ct("field_order_ref_placeholder")}
                      value={editingEntry.orderReference}
                      onChange={(e) =>
                        setEditingEntry({
                          ...editingEntry,
                          orderReference: e.target.value,
                        })
                      }
                      required
                    />
                  </Field>
                </>
              )}
            </div>

            {/* Structured Table for Competing Stylists (Salon Sales Competition) */}
            {activeTab === "salon-sales" && (
              <div className="crm-professionals-section">
                <div className="crm-professionals-header">
                  <div>
                    <h4>{ct("prof_section_title")}</h4>
                    <p>{ct("prof_section_desc")}</p>
                  </div>
                  <button
                    type="button"
                    className="crm-btn quiet"
                    onClick={() =>
                      setEditingEntry({
                        ...editingEntry,
                        professionals: [
                          ...editingEntry.professionals,
                          {
                            name: `Stylist ${editingEntry.professionals.length + 1}`,
                            units: 0,
                          },
                        ],
                      })
                    }
                  >
                    <Plus size={14} /> {ct("btn_add_professional")}
                  </button>
                </div>

                <div className="crm-prof-table-wrap">
                  <table className="crm-prof-table">
                    <thead>
                      <tr>
                        <th style={{ width: "80px" }}>{ct("position")}</th>
                        <th>{ct("professional_name")}</th>
                        <th style={{ width: "160px", textAlign: "right" }}>
                          {ct("prof_units_label")}
                        </th>
                        <th style={{ width: "50px", textAlign: "center" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingEntry.professionals.map((prof, idx) => (
                        <tr key={idx}>
                          <td>
                            <span className={`crm-rank-badge ${idx < 3 ? `rank-${idx + 1}` : ""}`}>
                              {idx === 0 ? "1ST" : idx === 1 ? "2ND" : idx === 2 ? "3RD" : `0${idx + 1}`}
                            </span>
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder={ct("prof_name_placeholder")}
                              value={prof.name}
                              onChange={(e) => {
                                const updated = [...editingEntry.professionals];
                                updated[idx].name = e.target.value;
                                setEditingEntry({ ...editingEntry, professionals: updated });
                              }}
                              required
                              className="crm-prof-name-input"
                            />
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <input
                              type="number"
                              min="0"
                              value={prof.units}
                              onChange={(e) => {
                                const updated = [...editingEntry.professionals];
                                updated[idx].units = Number(e.target.value) || 0;
                                setEditingEntry({ ...editingEntry, professionals: updated });
                              }}
                              className="crm-prof-units-input"
                            />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              type="button"
                              className="crm-icon crm-prof-delete-btn"
                              title={ct("remove_professional")}
                              onClick={() => {
                                const updated = editingEntry.professionals.filter((_, i) => i !== idx);
                                setEditingEntry({ ...editingEntry, professionals: updated });
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Podium Preview Cards */}
                {editingEntry.professionals.length > 0 && (
                  <div className="crm-podium-preview-container">
                    <span className="crm-overline">{ct("podium_preview")}</span>
                    <div className="crm-podium-preview-grid">
                      {campaignRanking(editingEntry.professionals).slice(0, 3).map((r, i) => (
                        <div
                          key={r.name}
                          className={`crm-podium-preview-card ${i === 0 ? "first" : i === 1 ? "second" : "third"}`}
                        >
                          <div className="crm-podium-preview-rank">
                            {i === 0 ? "1ST PLACE (€150 CASH)" : i === 1 ? "2ND PLACE (€100 CASH)" : "3RD PLACE (€50 PRODUCT)"}
                          </div>
                          <strong>{r.name || "—"}</strong>
                          <span>{r.units} {ct("units")} {ct("sold")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Field label={ct("field_notes")}>
              <textarea
                rows={3}
                placeholder={ct("field_notes_placeholder")}
                value={editingEntry.note}
                onChange={(e) =>
                  setEditingEntry({ ...editingEntry, note: e.target.value })
                }
              />
            </Field>

            <div className="crm-form-footer">
              <button
                type="button"
                className="crm-btn quiet"
                onClick={() => setEditingEntry(null)}
              >
                {ct("btn_cancel")}
              </button>
              <button type="submit" className="crm-btn primary" disabled={saving}>
                {saving ? ct("btn_saving") : ct("btn_save")}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
