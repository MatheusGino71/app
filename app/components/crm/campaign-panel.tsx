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
import type { WorkspaceData, Salon } from "../../../lib/domain";
import {
  Trophy,
  Package,
  Sparkles,
  Medal,
  Calendar,
  Building2,
  TrendingUp,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Layers,
  ChevronRight,
  Calculator,
  Gift,
  Coins,
  ArrowRight,
  X,
  Edit3,
  ExternalLink,
} from "lucide-react";
import { Field, Modal } from "./ui";

const STATUS_LABELS: Record<CampaignStatus, string> = {
  planned: "Planejado",
  contacted: "Contatado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<CampaignStatus, { bg: string; text: string; border: string }> = {
  planned: { bg: "#f3f4f6", text: "#4b5563", border: "#e5e7eb" },
  contacted: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  confirmed: { bg: "#fef3c7", text: "#b45309", border: "#fde68a" },
  completed: { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
  cancelled: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
};

export default function CampaignPanel({
  data,
  onSaveEntry,
  onOpenSalon,
}: {
  data: WorkspaceData;
  onSaveEntry: (entry: Omit<CampaignEntry, "updatedAt" | "updatedBy">) => Promise<void>;
  onOpenSalon: (salonId: string) => void;
}) {
  const { t, money, dateLabel } = useI18n();
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
  const entries = (data.campaignEntries ?? []).filter((e) => e.campaignId === activeTab);

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

  // Open entry editor
  function handleAddEntry(salonId?: string) {
    setFormError("");
    const existing = salonId
      ? entries.find((e) => e.salonId === salonId)
      : null;

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
                { name: "Profissional 1", units: 0 },
                { name: "Profissional 2", units: 0 },
                { name: "Profissional 3", units: 0 },
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
      setFormError(err.message || "Não foi possível salvar o registro da campanha.");
    } finally {
      setSaving(false);
    }
  }

  // Aggregate stats from actual entries
  const confirmedSalons = entries.filter((e) => e.status === "confirmed" || e.status === "completed").length;
  const totalRegistered = entries.length;

  return (
    <div className="crm-campaigns">
      {/* Top Banner / Event Selector */}
      <section className="crm-campaign-hero">
        <div className="crm-campaign-hero-content">
          <div className="crm-campaign-badge">
            <Sparkles size={14} />
            <span>GRACE PRO · INICIATIVAS COMERCIAIS & TRADE MARKETING</span>
          </div>
          <h2>Painel de Eventos e Campanhas</h2>
          <p>
            Três mecânicas desenhadas para acelerar o sell-in de coloração, giro de home care
            e adoção multi-marcas nos salões da sua carteira.
          </p>

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
                    if (c.id === "salon-sales") setSimSalons(30);
                    else if (c.id === "brae-12-12") setSimSalons(30);
                    else if (c.id === "icons-edit") setSimSalons(30);
                  }}
                >
                  <div className="crm-tab-top">
                    <span className="crm-tab-brand">{c.brand}</span>
                    {c.duration && <span className="crm-tab-duration">{c.duration} dias</span>}
                  </div>
                  <strong>{c.name}</strong>
                  <div className="crm-tab-foot">
                    <span>{count} {count === 1 ? "salão" : "salões"}</span>
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
                    <Clock size={12} /> {campaign.duration} Dias de Ativação
                  </span>
                ) : (
                  <span className="crm-tag duration">Oferta por Período</span>
                )}
                <span className="crm-tag pages">Slides {campaign.pages}</span>
              </div>
              <h1 className="crm-campaign-title">{campaign.name}</h1>
              <p className="crm-campaign-subtitle">{campaign.subtitle}</p>
            </div>

            <button
              className="crm-btn primary"
              onClick={() => handleAddEntry()}
              disabled={data.salons.length === 0}
            >
              <Plus size={16} /> Inscrever Salão
            </button>
          </div>

          <div className="crm-campaign-mechanic-box">
            <strong>Mecânica da Campanha:</strong>
            <p>{campaign.mechanic}</p>
            {campaign.conditions && (
              <small className="crm-campaign-conditions">
                Nota regulatória: {campaign.conditions}
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
                  <span className="crm-overline">FLUXO DE ATIVAÇÃO</span>
                  <h3>Como a Campanha Funciona</h3>
                </div>
              </div>
              <div className="crm-steps-flow">
                {[
                  { step: "1", title: "SELECT", desc: "30 salões profissionais selecionados na carteira" },
                  { step: "2", title: "ACTIVATE", desc: "Meta de 150 unidades Home Care por salão em 30 dias" },
                  { step: "3", title: "COMPETE", desc: "Profissionais competem individualmente por sell-out verificado" },
                  { step: "4", title: "REWARD", desc: "3 maiores performances premiadas por salão" },
                  { step: "5", title: "REPLENISH", desc: "Venda ao consumidor gera recompra e pedidos distribuidores" },
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
                <span className="crm-overline">RECONHECIMENTO INDIVIDUAL</span>
                <h4>Premiação por Salão Participante (€300 total)</h4>
                <div className="crm-podium-cards">
                  <div className="crm-podium-card gold">
                    <div className="crm-podium-rank">1º LUGAR</div>
                    <div className="crm-podium-val">€150</div>
                    <span>CASH PRIZE</span>
                    <small>50% do total</small>
                  </div>
                  <div className="crm-podium-card silver">
                    <div className="crm-podium-rank">2º LUGAR</div>
                    <div className="crm-podium-val">€100</div>
                    <span>CASH PRIZE</span>
                    <small>33,3% do total</small>
                  </div>
                  <div className="crm-podium-card bronze">
                    <div className="crm-podium-rank">3º LUGAR</div>
                    <div className="crm-podium-val">€50</div>
                    <span>EM PRODUTO</span>
                    <small>Preço de tabela (16,7%)</small>
                  </div>
                </div>
              </div>
            </section>

            {/* Timeline & KPIs */}
            <section className="crm-card">
              <div className="crm-card-head">
                <div>
                  <span className="crm-overline">CRONOGRAMA (4 SEMANAS)</span>
                  <h3>Da Ativação aos Resultados Mensuráveis</h3>
                </div>
              </div>
              <div className="crm-weeks-timeline">
                {campaign.timeline.map((text, i) => (
                  <div key={i} className="crm-week-row">
                    <div className="crm-week-badge">Semana 0{i + 1}</div>
                    <div className="crm-week-info">
                      <p>{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="crm-kpis-box">
                <span className="crm-overline">METAS E INDICADORES</span>
                <div className="crm-kpis-grid">
                  <div>
                    <span>Meta por salão</span>
                    <strong>150 un.</strong>
                  </div>
                  <div>
                    <span>Sell-in potencial</span>
                    <strong>€135.000</strong>
                  </div>
                  <div>
                    <span>Sell-out esperado</span>
                    <strong>90%</strong>
                  </div>
                  <div>
                    <span>Alocação prêmios</span>
                    <strong>6,67%</strong>
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
                  <span className="crm-overline">PRODUTOS E PREÇOS</span>
                  <h3>Composição do Pacote Promocional 12+12</h3>
                </div>
              </div>

              <div className="crm-offer-hero">
                <div className="crm-offer-item">
                  <span className="crm-badge-number">12</span>
                  <div>
                    <strong>BRAÉ Wanna Be Blonde (500 g)</strong>
                    <p>Pó descolorante profissional</p>
                    <small>12 × €33 = €396 (valor pago)</small>
                  </div>
                </div>
                <div className="crm-offer-plus">+</div>
                <div className="crm-offer-item bonus">
                  <span className="crm-badge-number">12</span>
                  <div>
                    <strong>BRAÉ OX Developer (900 ml)</strong>
                    <p>Emulsão oxidante profissional</p>
                    <small>12 × €13 = €156 (bônus grátis)</small>
                  </div>
                </div>
              </div>

              <div className="crm-package-summary-table">
                <div className="crm-summary-line">
                  <span>Valor pago pelo salão</span>
                  <strong>€396,00</strong>
                </div>
                <div className="crm-summary-line bonus">
                  <span>Valor de produto grátis (tabela)</span>
                  <strong>€156,00</strong>
                </div>
                <div className="crm-summary-line total">
                  <span>Valor total entregue (24 un.)</span>
                  <strong>€552,00</strong>
                </div>
                <div className="crm-summary-line highlight">
                  <span>Economia efetiva para o salão</span>
                  <strong>28,26%</strong>
                </div>
              </div>
            </section>

            {/* Execution Plan & Scenarios */}
            <section className="crm-card">
              <div className="crm-card-head">
                <div>
                  <span className="crm-overline">PLANO DE 10 DIAS</span>
                  <h3>Execução Rápida e Alto Giro</h3>
                </div>
              </div>

              <div className="crm-weeks-timeline">
                {campaign.timeline.map((text, i) => (
                  <div key={i} className="crm-week-row">
                    <div className="crm-week-badge">Etapa 0{i + 1}</div>
                    <div className="crm-week-info">
                      <p>{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="crm-kpis-box">
                <span className="crm-overline">CENÁRIOS COMERCIAIS</span>
                <div className="crm-scenarios-pills">
                  <button
                    className={`crm-pill ${simSalons === 30 ? "active" : ""}`}
                    onClick={() => setSimSalons(30)}
                  >
                    30 salões: <strong>€11.880</strong>
                  </button>
                  <button
                    className={`crm-pill ${simSalons === 40 ? "active" : ""}`}
                    onClick={() => setSimSalons(40)}
                  >
                    40 salões: <strong>€15.840</strong>
                  </button>
                  <button
                    className={`crm-pill ${simSalons === 50 ? "active" : ""}`}
                    onClick={() => setSimSalons(50)}
                  >
                    50 salões: <strong>€19.800</strong>
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
                  <span className="crm-overline">PORTFÓLIO MULTI-MARCA</span>
                  <h3>The Icons Edit — 13 Itens Best-Sellers (€414)</h3>
                </div>
              </div>

              <div className="crm-icons-table-wrap">
                <table className="crm-icons-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th style={{ textAlign: "center" }}>Qtd</th>
                      <th style={{ textAlign: "right" }}>Preço Un.</th>
                      <th style={{ textAlign: "right" }}>Total</th>
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
                        <strong>TOTAL (13 unidades)</strong>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <strong style={{ fontSize: "16px", color: "var(--crm-gold)" }}>€414,00</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="crm-note" style={{ marginTop: "14px" }}>
                <Sparkles size={16} />
                <span>
                  <strong>Mais Valor. Sem Desconto em Dinheiro:</strong> O pacote é vendido pelo valor
                  integral de tabela, preservando o posicionamento de preço das marcas e agregando um bônus exclusivo de produto.
                </span>
              </div>
            </section>

            {/* Growth Pillars & Scenarios */}
            <section className="crm-card">
              <div className="crm-card-head">
                <div>
                  <span className="crm-overline">POTENCIAL DE RECEITA</span>
                  <h3>Oportunidade Multi-Marcas</h3>
                </div>
              </div>

              <div className="crm-pillars-list">
                {[
                  { title: "Ticket Médio Mais Alto", desc: "Estimula os salões a adquirirem uma seleção profissional completa numa única transação." },
                  { title: "Adoção Cruzada de Marcas", desc: "Apresenta Dr. Sorbie, BRAÉ e Tempting conjuntamente, facilitando a entrada em novas categorias." },
                  { title: "Experimentação Orientada", desc: "O bônus de produto (~€19) gera experimentação sem concessão direta de margem na fatura." },
                  { title: "Demanda Contínua de Recompra", desc: "Experiência de uso imediata cria ciclo de reposição e fidelização." },
                ].map((p, i) => (
                  <div key={i} className="crm-pillar-item">
                    <div className="crm-pillar-badge">{i + 1}</div>
                    <div>
                      <strong>{p.title}</strong>
                      <p>{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="crm-kpis-box" style={{ marginTop: "20px" }}>
                <span className="crm-overline">CENÁRIOS DE PARTICIPAÇÃO</span>
                <div className="crm-scenarios-pills">
                  <button
                    className={`crm-pill ${simSalons === 30 ? "active" : ""}`}
                    onClick={() => setSimSalons(30)}
                  >
                    30 salões: <strong>€12.420</strong>
                  </button>
                  <button
                    className={`crm-pill ${simSalons === 50 ? "active" : ""}`}
                    onClick={() => setSimSalons(50)}
                  >
                    50 salões: <strong>€20.700</strong>
                  </button>
                  <button
                    className={`crm-pill ${simSalons === 70 ? "active" : ""}`}
                    onClick={() => setSimSalons(70)}
                  >
                    70 salões: <strong>€28.980</strong>
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
              <span className="crm-overline">SIMULADOR INTERATIVO DE RECEITA</span>
              <h3>Projeção Financeira e Metas</h3>
            </div>
            <Calculator size={20} />
          </div>

          <div className="crm-simulator-controls">
            <div className="crm-sim-input-group">
              <label>Número de Salões Participantes: <strong>{simSalons}</strong></label>
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
                <label>Cenário de Premiação por Salão:</label>
                <div className="crm-prize-options">
                  {[
                    { val: 200, label: "Conservador (€200 / 4,44%)" },
                    { val: 300, label: "Recomendado (€300 / 6,67%)" },
                    { val: 450, label: "Teto Máximo (€450 / 10%)" },
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
              <span>Sell-In Projetado</span>
              <strong>{money(projection.revenue)}</strong>
              <small>{simSalons} salões participantes</small>
            </div>
            <div className="crm-sim-result-box">
              <span>Unidades Vendidas</span>
              <strong>{projection.paidUnits.toLocaleString()} un.</strong>
              <small>Home Care / Produtos pagos</small>
            </div>
            {activeTab === "salon-sales" ? (
              <>
                <div className="crm-sim-result-box">
                  <span>Investimento em Prêmios</span>
                  <strong>{money(projection.prizeValue)}</strong>
                  <small>
                    {projection.revenue > 0
                      ? ((projection.prizeValue / projection.revenue) * 100).toFixed(2)
                      : 0}
                    % da receita potencial
                  </small>
                </div>
                <div className="crm-sim-result-box">
                  <span>Teto Orçamentário (10%)</span>
                  <strong>{money(projection.ceiling)}</strong>
                  <small>Capacidade restante: {money(projection.ceiling - projection.prizeValue)}</small>
                </div>
              </>
            ) : (
              <>
                <div className="crm-sim-result-box">
                  <span>Valor Produto Bônus</span>
                  <strong>{money(projection.bonusValue)}</strong>
                  <small>Entregue sem custo adicional</small>
                </div>
                <div className="crm-sim-result-box">
                  <span>Valor Total Entregue</span>
                  <strong>{money(projection.combinedValue)}</strong>
                  <small>Preço de tabela combinado</small>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Participating Salons Table & Registration */}
        <section className="crm-card">
          <div className="crm-card-head">
            <div>
              <span className="crm-overline">GESTÃO DE PARTICIPAÇÃO</span>
              <h3>Salões Inscritos nesta Campanha ({entries.length})</h3>
            </div>
            <button
              className="crm-btn primary"
              onClick={() => handleAddEntry()}
              disabled={data.salons.length === 0}
            >
              <Plus size={16} /> Inscrever Salão
            </button>
          </div>

          {entries.length === 0 ? (
            <div className="crm-empty-campaign">
              <Building2 size={36} />
              <h4>Nenhum salão inscrito ainda</h4>
              <p>Inscreva salões da sua carteira para acompanhar a execução, metas e premiações.</p>
              <button
                className="crm-btn primary"
                onClick={() => handleAddEntry()}
                disabled={data.salons.length === 0}
              >
                <Plus size={16} /> Inscrever Primeiro Salão
              </button>
            </div>
          ) : (
            <div className="crm-table-wrap">
              <table className="crm-campaign-table">
                <thead>
                  <tr>
                    <th>Salão</th>
                    <th>Status</th>
                    <th>Início</th>
                    {activeTab === "salon-sales" ? (
                      <>
                        <th>Profissionais Cadastrados</th>
                        <th>Giro de Vendas</th>
                        <th>Top Performer</th>
                      </>
                    ) : (
                      <>
                        <th>Pacotes</th>
                        <th>Ref. Pedido</th>
                      </>
                    )}
                    <th>Ações</th>
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
                    const statusStyle = STATUS_COLORS[entry.status] || STATUS_COLORS.planned;

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
                              <strong>{salon?.name || "Salão desconhecido"}</strong>
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
                            {STATUS_LABELS[entry.status] || entry.status}
                          </span>
                        </td>
                        <td>{entry.startDate ? dateLabel(entry.startDate) : "—"}</td>
                        {activeTab === "salon-sales" ? (
                          <>
                            <td>
                              <strong>{entry.professionals?.length || 0}</strong> profissionais
                            </td>
                            <td>
                              <strong>{totalUnits}</strong> / 150 un.
                              <span
                                style={{
                                  display: "inline-block",
                                  marginLeft: "8px",
                                  fontSize: "11px",
                                  color: totalUnits >= 150 ? "#047857" : "var(--crm-muted)",
                                }}
                              >
                                ({Math.round((totalUnits / 150) * 100)}%)
                              </span>
                            </td>
                            <td>
                              {topPerformer && topPerformer.units > 0 ? (
                                <span className="crm-top-performer-pill">
                                  🥇 {topPerformer.name} ({topPerformer.units} un.)
                                </span>
                              ) : (
                                <span className="crm-muted">—</span>
                              )}
                            </td>
                          </>
                        ) : (
                          <>
                            <td>
                              <strong>{entry.packages}</strong> {entry.packages === 1 ? "pacote" : "pacotes"}
                            </td>
                            <td>{entry.orderReference || "—"}</td>
                          </>
                        )}
                        <td>
                          <button
                            type="button"
                            className="crm-btn quiet"
                            onClick={() => handleAddEntry(entry.salonId)}
                            style={{ padding: "6px 10px", fontSize: "11px" }}
                          >
                            <Edit3 size={14} /> Editar
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

      {/* Participation Form Modal */}
      {editingEntry && (
        <Modal
          title={`Inscrição — ${campaign.name}`}
          subtitle={
            data.salons.find((s) => s.id === editingEntry.salonId)?.name ||
            "Selecione o salão participante"
          }
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
              <Field label="Salão Participante *">
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

              <Field label="Status da Participação *">
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
                      {STATUS_LABELS[st]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Data de Início">
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
                  <Field label="Quantidade de Pacotes / Bundles *">
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
                  <Field label="Referência do Pedido (código ou nota) *">
                    <input
                      type="text"
                      placeholder="Ex.: PED-2026-0891"
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

            {/* Individual Professionals Section for Salon Sales Competition */}
            {activeTab === "salon-sales" && (
              <div className="crm-professionals-section">
                <div className="crm-professionals-header">
                  <div>
                    <h4>Profissionais em Competição & Unidades Vendidas</h4>
                    <p>
                      Registre o nome de cada profissional e as unidades vendidas no período.
                      O ranking classifica os 3 primeiros colocados para a premiação.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="crm-btn quiet"
                    onClick={() =>
                      setEditingEntry({
                        ...editingEntry,
                        professionals: [
                          ...editingEntry.professionals,
                          { name: `Profissional ${editingEntry.professionals.length + 1}`, units: 0 },
                        ],
                      })
                    }
                  >
                    <Plus size={14} /> Adicionar Profissional
                  </button>
                </div>

                <div className="crm-professionals-list">
                  {editingEntry.professionals.map((prof, idx) => (
                    <div key={idx} className="crm-prof-row">
                      <div className="crm-prof-rank-badge">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                      </div>
                      <input
                        type="text"
                        placeholder="Nome do profissional"
                        value={prof.name}
                        onChange={(e) => {
                          const updated = [...editingEntry.professionals];
                          updated[idx].name = e.target.value;
                          setEditingEntry({ ...editingEntry, professionals: updated });
                        }}
                        required
                        className="crm-prof-name-input"
                      />
                      <div className="crm-prof-units-wrap">
                        <label>Unidades vendidas:</label>
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
                      </div>
                      <button
                        type="button"
                        className="crm-icon"
                        title="Remover profissional"
                        onClick={() => {
                          const updated = editingEntry.professionals.filter((_, i) => i !== idx);
                          setEditingEntry({ ...editingEntry, professionals: updated });
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {editingEntry.professionals.length > 0 && (
                  <div className="crm-ranking-preview">
                    <strong>Prévia do Pódio:</strong>
                    {campaignRanking(editingEntry.professionals).slice(0, 3).map((r, i) => (
                      <span key={r.name} className="crm-podium-preview-pill">
                        {i === 0 ? "1º (€150 Cash)" : i === 1 ? "2º (€100 Cash)" : "3º (€50 Produto)"}:{" "}
                        {r.name} ({r.units} un.)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Field label="Observações e Acompanhamento">
              <textarea
                rows={3}
                placeholder="Observações sobre o salão, estoques, materiais enviados ou combinados..."
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
                Cancelar
              </button>
              <button type="submit" className="crm-btn primary" disabled={saving}>
                {saving ? "Salvando..." : "Salvar Inscrição"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

