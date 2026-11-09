"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Bell, BriefcaseBusiness,
  Check, CheckCheck, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleHelp,
  ClipboardList, Clock3, Command, Download, Filter, Layers3, LayoutDashboard, MapPin,
  Menu, MoreHorizontal, Plus, Search, Settings2, ShieldCheck, SlidersHorizontal,
  Sparkles, Target, TrendingUp, Users, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type View = "overview" | "clients" | "visits" | "segments" | "actions";
type Segment = "Potencial de compra" | "Branding" | "Conta estratégica";
type Objective = "compras" | "branding" | "expansao";

type Client = {
  id: string;
  name: string;
  contact: string;
  city: string;
  initials: string;
  palette: string;
  teamSize: number;
  budget: number;
  interest: "alto" | "medio" | "baixo";
  segments: Segment[];
  lastVisit: string;
};
type Visit = { id: string; clientId: string; clientName: string; date: string; note: string };
type FormState = {
  name: string;
  contact: string;
  city: string;
  teamSize: string;
  budget: string;
  interest: "alto" | "medio" | "baixo";
  objectives: Objective[];
  note: string;
};
type ActionRow = { id: string; client: Client; segment: Segment; text: string };

const segmentInfo: Record<Segment, { short: string; color: string; description: string; action: string; rule: string }> = {
  "Potencial de compra": {
    short: "Compra",
    color: "green",
    description: "Interesse ou intenção comercial em aquisição de produtos.",
    action: "Apresentar portfólio e condições comerciais",
    rule: "Interesse em compra alto ou objetivo de aquisição selecionado.",
  },
  Branding: {
    short: "Branding",
    color: "violet",
    description: "Oportunidade de posicionamento, visibilidade e parceria.",
    action: "Propor ação de marca e materiais de parceria",
    rule: "Objetivo de fortalecimento da marca selecionado.",
  },
  "Conta estratégica": {
    short: "Estratégico",
    color: "amber",
    description: "Salão com porte ou potencial para acompanhamento consultivo.",
    action: "Agendar reunião consultiva com a gestão",
    rule: "Equipe com 10 ou mais pessoas ou potencial mensal a partir de R$ 15 mil.",
  },
};

const demoClients: Client[] = [
  { id: "c01", name: "Studio Miro", contact: "Marina Oliveira", city: "São Paulo, SP", initials: "SM", palette: "sand", teamSize: 12, budget: 24000, interest: "alto", segments: ["Potencial de compra", "Branding", "Conta estratégica"], lastVisit: "Hoje, 10:42" },
  { id: "c02", name: "Maison Corte", contact: "Thiago Moreira", city: "São Paulo, SP", initials: "MC", palette: "sage", teamSize: 6, budget: 9600, interest: "alto", segments: ["Potencial de compra"], lastVisit: "Hoje, 09:15" },
  { id: "c03", name: "Alma Beauty", contact: "Camila Ferreira", city: "Campinas, SP", initials: "AB", palette: "lavender", teamSize: 8, budget: 12000, interest: "medio", segments: ["Branding"], lastVisit: "Ontem, 16:20" },
  { id: "c04", name: "Casa Lumina", contact: "Rafael Santos", city: "São Paulo, SP", initials: "CL", palette: "rose", teamSize: 15, budget: 29000, interest: "alto", segments: ["Potencial de compra", "Conta estratégica"], lastVisit: "06 nov, 14:30" },
  { id: "c05", name: "Helena Concept", contact: "Helena Azevedo", city: "Santo André, SP", initials: "HC", palette: "clay", teamSize: 5, budget: 7200, interest: "medio", segments: ["Branding"], lastVisit: "05 nov, 11:10" },
  { id: "c06", name: "Ateliê 1987", contact: "Bruno Almeida", city: "São Paulo, SP", initials: "A8", palette: "blue", teamSize: 11, budget: 16800, interest: "alto", segments: ["Potencial de compra", "Conta estratégica"], lastVisit: "04 nov, 15:50" },
];

const demoVisits: Visit[] = [
  { id: "v01", clientId: "c01", clientName: "Studio Miro", date: "Hoje, 10:42", note: "Mapeamento comercial completo" },
  { id: "v02", clientId: "c02", clientName: "Maison Corte", date: "Hoje, 09:15", note: "Atualização de oportunidades" },
  { id: "v03", clientId: "c03", clientName: "Alma Beauty", date: "Ontem, 16:20", note: "Primeira visita e diagnóstico" },
  { id: "v04", clientId: "c04", clientName: "Casa Lumina", date: "06 nov, 14:30", note: "Revisão do perfil comercial" },
];

const navItems: { id: View; name: string; icon: LucideIcon }[] = [
  { id: "overview", name: "Visão geral", icon: LayoutDashboard },
  { id: "clients", name: "Clientes", icon: Users },
  { id: "visits", name: "Visitas", icon: ClipboardList },
  { id: "segments", name: "Segmentos", icon: Layers3 },
  { id: "actions", name: "Ações comerciais", icon: Target },
];

const initialForm: FormState = {
  name: "", contact: "", city: "São Paulo, SP", teamSize: "", budget: "",
  interest: "medio", objectives: [], note: "",
};

function classify(form: FormState): Segment[] {
  const result: Segment[] = [];
  if (form.interest === "alto" || form.objectives.includes("compras")) result.push("Potencial de compra");
  if (form.objectives.includes("branding")) result.push("Branding");
  if (Number(form.teamSize) >= 10 || Number(form.budget) >= 15000) result.push("Conta estratégica");
  return result;
}

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

function Badge({ segment }: { segment: Segment }) {
  const info = segmentInfo[segment];
  return <span className={"seg-badge " + info.color}><span className="badge-dot" />{info.short}</span>;
}

function Initials({ client, size = "normal" }: { client: Client; size?: "normal" | "large" }) {
  return <span className={"client-initials " + client.palette + " " + size}>{client.initials}</span>;
}

function EmptyState({ icon: Icon, heading, text }: { icon: LucideIcon; heading: string; text: string }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={22} /></span><strong>{heading}</strong><p>{text}</p></div>;
}

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [clients, setClients] = useState<Client[]>(demoClients);
  const [visits, setVisits] = useState<Visit[]>(demoVisits);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<Segment | "Todos">("Todos");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [toast, setToast] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    try {
      const savedClients = localStorage.getItem("atelier-demo-clients-v1");
      const savedVisits = localStorage.getItem("atelier-demo-visits-v1");
      const savedDone = localStorage.getItem("atelier-demo-actions-v1");
      if (savedClients) setClients(JSON.parse(savedClients) as Client[]);
      if (savedVisits) setVisits(JSON.parse(savedVisits) as Visit[]);
      if (savedDone) setDoneIds(JSON.parse(savedDone) as string[]);
    } catch { /* Keep bundled demo data if local storage cannot be parsed. */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("atelier-demo-clients-v1", JSON.stringify(clients));
      localStorage.setItem("atelier-demo-visits-v1", JSON.stringify(visits));
      localStorage.setItem("atelier-demo-actions-v1", JSON.stringify(doneIds));
    } catch { /* Demo remains usable without browser storage. */ }
  }, [clients, visits, doneIds, hydrated]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const segmentCounts = useMemo(() => {
    const counts = {} as Record<Segment, number>;
    (Object.keys(segmentInfo) as Segment[]).forEach((segment) => {
      counts[segment] = clients.filter((client) => client.segments.includes(segment)).length;
    });
    return counts;
  }, [clients]);

  const actions = useMemo<ActionRow[]>(() => clients.flatMap((client) =>
    client.segments.map((segment) => ({
      id: client.id + "-" + segment,
      client,
      segment,
      text: segmentInfo[segment].action,
    }))
  ), [clients]);

  const pendingActions = actions.filter((action) => !doneIds.includes(action.id));
  const filteredClients = clients.filter((client) => {
    const query = search.toLocaleLowerCase("pt-BR").trim();
    const matchesText = !query || [client.name, client.city, client.contact].join(" ").toLocaleLowerCase("pt-BR").includes(query);
    const matchesSegment = segmentFilter === "Todos" || client.segments.includes(segmentFilter);
    return matchesText && matchesSegment;
  });
  const assignedClients = clients.filter((client) => client.segments.length > 0).length;
  const highlightedActions = pendingActions.slice(0, 4);

  function navigate(next: View) {
    setView(next);
    setShowMobileMenu(false);
    setSelectedClient(null);
  }
  function openVisit() {
    let draft = initialForm;
    try {
      const saved = localStorage.getItem("atelier-demo-draft-v1");
      if (saved) draft = JSON.parse(saved) as FormState;
    } catch { /* Start empty. */ }
    setForm(draft);
    setStep(0);
    setShowForm(true);
  }
  function saveDraft() {
    try { localStorage.setItem("atelier-demo-draft-v1", JSON.stringify(form)); } catch {}
    setShowForm(false);
    setToast("Rascunho salvo neste navegador.");
  }
  function saveVisit() {
    if (!form.name.trim() || !form.contact.trim() || !form.city.trim()) {
      setToast("Preencha os campos obrigatórios de identificação.");
      setStep(0);
      return;
    }
    const id = "c" + Date.now().toString(36);
    const words = form.name.trim().split(/\s+/);
    const initials = words.map((word) => word.charAt(0)).slice(0, 2).join("").toUpperCase();
    const date = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date());
    const client: Client = {
      id, name: form.name.trim(), contact: form.contact.trim(), city: form.city.trim(),
      initials, palette: "sage", teamSize: Number(form.teamSize) || 0,
      budget: Number(form.budget) || 0, interest: form.interest,
      segments: classify(form), lastVisit: date,
    };
    setClients((previous) => [client, ...previous]);
    setVisits((previous) => [{ id: "v" + Date.now().toString(36), clientId: id, clientName: client.name, date, note: form.note || "Mapeamento comercial" }, ...previous]);
    try { localStorage.removeItem("atelier-demo-draft-v1"); } catch {}
    setShowForm(false);
    setSelectedClient(client);
    setView("clients");
    setSearch("");
    setSegmentFilter("Todos");
    setToast("Visita registrada e perfil classificado.");
  }
  function toggleObjective(objective: Objective) {
    setForm((current) => ({ ...current, objectives: current.objectives.includes(objective) ? current.objectives.filter((item) => item !== objective) : [...current.objectives, objective] }));
  }
  function toggleAction(id: string) {
    setDoneIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setToast(doneIds.includes(id) ? "Ação reaberta." : "Ação marcada como concluída.");
  }

  return (
    <div className="app-shell">
      <aside className={"sidebar " + (showMobileMenu ? "mobile-open" : "")}>
        <div className="sidebar-brand" onClick={() => navigate("overview")} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") navigate("overview"); }}>
          <span className="brand-emblem"><span>A</span><i /></span>
          <div><strong>ATELIER<span className="brand-period">.</span></strong><small>INTELIGÊNCIA COMERCIAL</small></div>
          <button className="sidebar-close" aria-label="Fechar menu" onClick={(event) => { event.stopPropagation(); setShowMobileMenu(false); }}><X size={18} /></button>
        </div>

        <div className="workspace-switch"><span className="workspace-avatar">AC</span><span><strong>Workspace Comercial</strong><small>Ambiente demonstrativo</small></span><ChevronDown size={15} /></div>
        <div className="sidebar-section-label">ESPAÇO DE TRABALHO</div>
        <nav className="sidebar-navigation" aria-label="Navegação principal">
          {navItems.map(({ id, name, icon: Icon }) => (
            <button key={id} className={"nav-item " + (view === id ? "active" : "")} onClick={() => navigate(id)}>
              <Icon size={18} strokeWidth={1.8} /><span>{name}</span>{id === "actions" && pendingActions.length > 0 ? <span className="nav-count">{pendingActions.length}</span> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-section-label second">ORGANIZAÇÃO</div>
        <div className="sidebar-navigation">
          <Link className="nav-item subtle" href="/"><ArrowUpRight size={18} strokeWidth={1.8} /><span>Conheça o Atelier</span></Link>
          <button className="nav-item subtle" onClick={() => { navigate("segments"); setToast("As regras desta demonstração aparecem na seção Segmentos."); }}><SlidersHorizontal size={18} strokeWidth={1.8} /><span>Regras comerciais</span></button>
        </div>
        <div className="sidebar-spacer" />
        <div className="sidebar-insight"><span className="insight-symbol"><Activity size={17} /></span><p>Decisões melhores começam com dados de qualidade.</p><span>ATELIER INSIGHTS · BETA</span></div>
        <div className="sidebar-account"><span className="account-avatar">MG</span><span><strong>Matheus Gino</strong><small>Administrador · Demo</small></span><MoreHorizontal size={18} /></div>
      </aside>
      {showMobileMenu && <button className="mobile-scrim" aria-label="Fechar navegação" onClick={() => setShowMobileMenu(false)} />}

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger" aria-label="Abrir menu" onClick={() => setShowMobileMenu(true)}><Menu size={22} /></button>
            <span className="breadcrumb-muted">Workspace</span><ChevronRight className="breadcrumb-chevron" size={15} /><strong>{navItems.find((item) => item.id === view)?.name}</strong>
          </div>
          <div className="topbar-right">
            <div className="demo-indicator"><span /> MODO DEMONSTRAÇÃO</div>
            <div className="topbar-separator" />
            <button className="top-icon-button" aria-label="Ver ações pendentes" title="Ver ações pendentes" onClick={() => navigate("actions")}><Bell size={19} /><i /></button>
            <span className="top-avatar">MG</span>
          </div>
        </header>

        <main className="main-content">
          {view === "overview" && (
            <>
              <div className="page-head dashboard-head"><div><div className="eyebrow"><span className="eyebrow-line" /> VISÃO GERAL DA OPERAÇÃO</div><h1>Bom dia, Matheus<span className="serif-dot">.</span></h1><p>Uma visão mais clara das oportunidades que movem seu negócio.</p></div><button className="button button-dark main-cta" onClick={openVisit}><Plus size={18} /> Nova visita</button></div>

              <section className="hero-panel">
                <div className="hero-copy"><span className="hero-kicker"><span /> INTELIGÊNCIA EM CADA DECISÃO</span><h2>Conheça melhor.<br /><em>Conquiste mais.</em></h2><p>Transforme cada visita em informações relevantes, perfis precisos e próximas ações comerciais.</p><button className="hero-link" onClick={() => navigate("segments")}>Explorar segmentos <ArrowUpRight size={16} /></button></div>
                <div className="hero-art" aria-hidden="true"><div className="orbit orbit-outer" /><div className="orbit orbit-middle" /><div className="orbit orbit-inner" /><div className="orbit-center"><div className="orbit-mark">A</div></div><div className="orbit-float f-one">01 <span>CAPTAR</span></div><div className="orbit-float f-two">02 <span>ENTENDER</span></div><div className="orbit-float f-three">03 <span>AGIR</span></div></div>
              </section>

              <div className="metrics-grid">
                <Metric label="Clientes mapeados" value={String(clients.length).padStart(2, "0")} icon={Users} note="Base de demonstração" tone="neutral" />
                <Metric label="Perfis identificados" value={String(assignedClients).padStart(2, "0")} icon={Layers3} note="Com classificação" tone="green" />
                <Metric label="Visitas registradas" value={String(visits.length).padStart(2, "0")} icon={ClipboardList} note="Histórico de visitas" tone="neutral" />
                <Metric label="Ações pendentes" value={String(pendingActions.length).padStart(2, "0")} icon={Target} note="Aguardando acompanhamento" tone="amber" />
              </div>

              <div className="dashboard-grid">
                <section className="surface-card segments-overview">
                  <div className="card-heading"><div><span className="section-overline">PERFIS DE CLIENTES</span><h3>Distribuição por segmento</h3><p>Um cliente pode aparecer em mais de uma categoria.</p></div><button className="icon-action" aria-label="Abrir segmentos" onClick={() => navigate("segments")}><ArrowUpRight size={18} /></button></div>
                  <div className="seg-chart">
                    {(Object.keys(segmentInfo) as Segment[]).map((segment) => <div className="seg-chart-row" key={segment}><div className="seg-chart-label"><span>{segment}</span><strong>{segmentCounts[segment]}</strong></div><div className="track"><span className={"track-fill " + segmentInfo[segment].color} style={{ width: (clients.length ? segmentCounts[segment] / clients.length * 100 : 0) + "%" }} /></div></div>)}
                  </div>
                  <div className="chart-foot"><span><span className="foot-symbol"><Layers3 size={15} /></span> Classificação multirrótulo</span><button onClick={() => navigate("segments")}>Ver análise completa <ArrowRight size={15} /></button></div>
                </section>

                <section className="surface-card attention-card">
                  <div className="card-heading"><div><span className="section-overline">PRÓXIMOS PASSOS</span><h3>Prioridades comerciais</h3><p>Oportunidades que merecem atenção.</p></div><span className="small-count">{pendingActions.length}</span></div>
                  <div className="priority-list">{highlightedActions.length ? highlightedActions.map((action) => <button className="priority-item" key={action.id} onClick={() => { navigate("actions"); setSelectedClient(action.client); }}><span className={"priority-glyph " + segmentInfo[action.segment].color}><Target size={17} /></span><span><strong>{action.client.name}</strong><small>{action.text}</small></span><ChevronRight size={16} /></button>) : <EmptyState icon={CheckCheck} heading="Tudo em dia" text="Nenhuma ação comercial pendente." />}</div>
                  <button className="text-link" onClick={() => navigate("actions")}>Ver todas as ações <ArrowRight size={16} /></button>
                </section>
              </div>

              <section className="surface-card recent-card">
                <div className="card-heading"><div><span className="section-overline">MOVIMENTAÇÃO RECENTE</span><h3>Últimas visitas</h3></div><button className="outline-small" onClick={() => navigate("visits")}>Ver histórico <ArrowUpRight size={15} /></button></div>
                <div className="table-wrap"><table className="data-table"><thead><tr><th>CLIENTE</th><th>REGISTRO</th><th>DATA</th><th>STATUS</th><th /></tr></thead><tbody>{visits.slice(0, 4).map((visit) => { const client = clients.find((item) => item.id === visit.clientId); return <tr key={visit.id} onClick={() => client && setSelectedClient(client)}><td><div className="table-client">{client && <Initials client={client} />}<span><strong>{visit.clientName}</strong><small>{client?.city || "—"}</small></span></div></td><td>{visit.note}</td><td>{visit.date}</td><td><span className="status-pill"><CheckCircle2 size={13} /> Concluída</span></td><td><ChevronRight size={17} className="table-chevron" /></td></tr>; })}</tbody></table></div>
              </section>
            </>
          )}

          {view === "clients" && (
            <>
              <PageTitle eyebrow="GESTÃO DE RELACIONAMENTO" title="Clientes" description="Todas as informações da sua carteira, em um só lugar." action={openVisit} actionLabel="Novo cadastro" />
              <div className="page-summary"><span><strong>{clients.length}</strong> clientes na base</span><span className="summary-divider" /><span><strong>{assignedClients}</strong> com perfil identificado</span></div>
              <div className="surface-card list-surface">
                <div className="list-tools"><div className="search-field"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por cliente, cidade ou responsável" aria-label="Buscar clientes" /></div><div className="filter-wrap"><SlidersHorizontal size={17} /><select aria-label="Filtrar por segmento" value={segmentFilter} onChange={(event) => setSegmentFilter(event.target.value as Segment | "Todos")}><option value="Todos">Todos os perfis</option>{Object.keys(segmentInfo).map((segment) => <option key={segment} value={segment}>{segment}</option>)}</select><ChevronDown size={14} /></div></div>
                <div className="table-wrap"><table className="data-table clients-table"><thead><tr><th>CLIENTE</th><th>RESPONSÁVEL</th><th>CLASSIFICAÇÃO</th><th>ÚLTIMA VISITA</th><th /></tr></thead><tbody>{filteredClients.map((client) => <tr key={client.id} onClick={() => setSelectedClient(client)}><td><div className="table-client"><Initials client={client} /><span><strong>{client.name}</strong><small><MapPin size={11} />{client.city}</small></span></div></td><td>{client.contact}</td><td><div className="badge-group">{client.segments.length ? client.segments.map((segment) => <Badge key={segment} segment={segment} />) : <span className="pending-badge">Em avaliação</span>}</div></td><td>{client.lastVisit}</td><td><ChevronRight size={17} className="table-chevron" /></td></tr>)}</tbody></table>{!filteredClients.length && <EmptyState icon={Search} heading="Nenhum cliente encontrado" text="Experimente outro termo ou filtro." />}</div>
                <div className="table-footer">Exibindo {filteredClients.length} de {clients.length} clientes <span>Dados ilustrativos para validação do produto</span></div>
              </div>
            </>
          )}

          {view === "visits" && (
            <>
              <PageTitle eyebrow="OPERAÇÃO EM CAMPO" title="Visitas" description="Cada conversa gera conhecimento sobre sua carteira." action={openVisit} actionLabel="Registrar visita" />
              <div className="visit-intro"><span className="visit-intro-icon"><ClipboardList size={23} /></span><div><strong>O registro certo, no momento certo.</strong><p>Preencha a ficha pelo celular e acompanhe os clientes classificados automaticamente.</p></div><button onClick={openVisit}>Iniciar formulário <ArrowRight size={16} /></button></div>
              <section className="surface-card list-surface"><div className="card-heading compact"><div><span className="section-overline">ATIVIDADE DA EQUIPE</span><h3>Histórico de visitas</h3></div><span className="small-count">{visits.length}</span></div><div className="visit-list">{visits.map((visit) => { const client = clients.find((item) => item.id === visit.clientId); return <button key={visit.id} className="visit-row" onClick={() => client && setSelectedClient(client)}>{client ? <Initials client={client} /> : <span className="client-initials sand">?</span>}<span className="visit-details"><strong>{visit.clientName}</strong><small>{visit.note}</small></span><time>{visit.date}</time><span className="status-pill"><CheckCircle2 size={13} /> Concluída</span><ChevronRight size={17} /></button>; })}</div></section>
            </>
          )}

          {view === "segments" && (
            <>
              <PageTitle eyebrow="INTELIGÊNCIA COMERCIAL" title="Segmentos" description="Entenda quem são seus clientes e onde estão as oportunidades." />
              <div className="notice-panel"><span className="notice-icon"><CircleHelp size={19} /></span><p><strong>Regras ilustrativas.</strong> Os critérios abaixo são demonstrativos. Quando recebermos a ficha oficial, definiremos as categorias e regras reais com a equipe comercial.</p></div>
              <div className="segment-cards">{(Object.keys(segmentInfo) as Segment[]).map((segment, index) => <section className="segment-feature" key={segment}><div className={"feature-icon " + segmentInfo[segment].color}><Layers3 size={20} /></div><div className="feature-number">0{index + 1}</div><span className="section-overline">CATEGORIA COMERCIAL</span><h3>{segment}</h3><p>{segmentInfo[segment].description}</p><div className="feature-stat"><strong>{segmentCounts[segment]}</strong><span>clientes identificados</span></div><div className="feature-rule"><span>REGRA DE DEMONSTRAÇÃO</span><p>{segmentInfo[segment].rule}</p></div><button onClick={() => { setSegmentFilter(segment); navigate("clients"); }}>Explorar clientes <ArrowUpRight size={16} /></button></section>)}</div>
              <div className="overlap-panel"><div className="overlap-visual"><div className="overlap-ring ring-one" /><div className="overlap-ring ring-two" /><div className="overlap-ring ring-three" /></div><div><span className="section-overline">UMA VISÃO MAIS COMPLETA</span><h3>Um cliente. Múltiplas oportunidades.</h3><p>Nossa classificação permite que um salão faça parte de mais de um segmento, e cada segmento pode gerar ações distintas — sempre com transparência sobre a regra aplicada.</p></div></div>
            </>
          )}

          {view === "actions" && (
            <>
              <PageTitle eyebrow="PLANEJAMENTO DE RELACIONAMENTO" title="Ações comerciais" description="Saiba exatamente qual pode ser o próximo movimento com cada cliente." />
              <div className="action-statline"><div><span className="stat-icon active"><Target size={20} /></span><span><strong>{pendingActions.length}</strong><small>Pendentes</small></span></div><div><span className="stat-icon done"><CheckCheck size={20} /></span><span><strong>{actions.length - pendingActions.length}</strong><small>Concluídas</small></span></div></div>
              <section className="surface-card list-surface"><div className="card-heading compact"><div><span className="section-overline">RECOMENDAÇÕES POR PERFIL</span><h3>Fila de oportunidades</h3></div><span className="soft-label">Regras simuladas</span></div><div className="actions-list">{actions.map((action) => { const done = doneIds.includes(action.id); return <div key={action.id} className={"action-row " + (done ? "completed" : "")}><button className={"complete-control " + (done ? "checked" : "")} aria-label={done ? "Reabrir ação" : "Concluir ação"} onClick={() => toggleAction(action.id)}>{done && <Check size={14} />}</button><div className="action-main"><strong>{action.text}</strong><span><button onClick={() => setSelectedClient(action.client)}>{action.client.name}</button><span className="dot-divider">·</span><Badge segment={action.segment} /></span></div><button className="action-open" aria-label={"Abrir " + action.client.name} onClick={() => setSelectedClient(action.client)}><ArrowUpRight size={17} /></button></div>; })}{!actions.length && <EmptyState icon={Target} heading="Nenhuma ação sugerida" text="Cadastre um cliente para visualizar recomendações." />}</div></section>
              <div className="hint-footer"><ShieldCheck size={17} /><span>As recomendações desta versão são exemplos para validar a experiência, não decisões comerciais definitivas.</span></div>
            </>
          )}
        </main>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Navegação no celular">{navItems.filter((item) => item.id !== "segments").map(({ id, name, icon: Icon }) => <button key={id} className={view === id ? "active" : ""} onClick={() => navigate(id)}><Icon size={20} strokeWidth={1.8} /><span>{id === "overview" ? "Início" : id === "actions" ? "Ações" : name}</span></button>)}<button className={view === "segments" ? "active" : ""} onClick={() => navigate("segments")}><Layers3 size={20} strokeWidth={1.8} /><span>Perfis</span></button></nav>

      {selectedClient && (
        <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedClient(null); }}>
          <aside className="detail-drawer" role="dialog" aria-modal="true" aria-label={"Perfil de " + selectedClient.name}>
            <div className="drawer-top"><span>PERFIL DO CLIENTE</span><button aria-label="Fechar perfil" onClick={() => setSelectedClient(null)}><X size={20} /></button></div>
            <div className="drawer-profile"><Initials client={selectedClient} size="large" /><h2>{selectedClient.name}</h2><p><MapPin size={14} /> {selectedClient.city}</p></div>
            <div className="drawer-section"><h4>Informações comerciais</h4><div className="facts-grid"><div><span>Responsável</span><strong>{selectedClient.contact}</strong></div><div><span>Equipe</span><strong>{selectedClient.teamSize} pessoas</strong></div><div><span>Potencial mensal</span><strong>{money(selectedClient.budget)}</strong></div><div><span>Interesse de compra</span><strong>{selectedClient.interest === "alto" ? "Alto" : selectedClient.interest === "medio" ? "Médio" : "Baixo"}</strong></div></div></div>
            <div className="drawer-section"><h4>Classificações <span className="small-count">{selectedClient.segments.length}</span></h4>{selectedClient.segments.length ? selectedClient.segments.map((segment) => <div className="drawer-segment" key={segment}><Badge segment={segment} /><small>{segmentInfo[segment].rule}</small></div>) : <p className="drawer-muted">Nenhum segmento identificado pelas regras demonstrativas.</p>}</div>
            <div className="drawer-section"><h4>Próximas ações</h4>{selectedClient.segments.map((segment) => { const id = selectedClient.id + "-" + segment; const done = doneIds.includes(id); return <button key={id} className="drawer-action" onClick={() => toggleAction(id)}><span className={done ? "drawer-checkbox checked" : "drawer-checkbox"}>{done && <Check size={13} />}</span><span>{segmentInfo[segment].action}</span></button>; })}{!selectedClient.segments.length && <p className="drawer-muted">Aguardando definição de perfil.</p>}</div>
            <div className="drawer-footer"><span><ShieldCheck size={15} /> Dados de demonstração</span><button className="button button-dark" onClick={() => { setSelectedClient(null); navigate("actions"); }}>Ver ações <ArrowRight size={16} /></button></div>
          </aside>
        </div>
      )}

      {showForm && (
        <div className="overlay form-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}>
          <section className="form-modal" role="dialog" aria-modal="true" aria-label="Registrar nova visita">
            <header className="form-modal-header"><div><span className="section-overline">COLETA COMERCIAL</span><h2>Nova visita<span className="serif-dot">.</span></h2><p>Um bom relacionamento começa com boas informações.</p></div><button className="modal-close" aria-label="Fechar formulário" onClick={() => setShowForm(false)}><X size={21} /></button></header>
            <div className="form-progress-head"><span>ETAPA {step + 1} DE 3</span><strong>{["Identificação", "Perfil do salão", "Oportunidades"][step]}</strong></div>
            <div className="form-progress-track"><span style={{ width: ((step + 1) / 3 * 100) + "%" }} /></div>
            <div className="form-body">
              {step === 0 && <div className="form-step"><h3>Vamos conhecer o cliente.</h3><p>Comece pelas informações essenciais do salão.</p><label className="form-label">Nome do salão <em>*</em><input autoFocus value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ex.: Studio Aurora" /></label><label className="form-label">Nome do responsável <em>*</em><input value={form.contact} onChange={(event) => setForm((current) => ({ ...current, contact: event.target.value }))} placeholder="Ex.: Ana Martins" /></label><label className="form-label">Cidade e estado <em>*</em><input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} placeholder="Ex.: São Paulo, SP" /></label></div>}
              {step === 1 && <div className="form-step"><h3>Entenda a estrutura.</h3><p>Essas informações ajudam a contextualizar o potencial comercial.</p><label className="form-label">Tamanho da equipe<input type="number" min="0" value={form.teamSize} onChange={(event) => setForm((current) => ({ ...current, teamSize: event.target.value }))} placeholder="Quantidade de profissionais" /></label><label className="form-label">Potencial de compras mensal (R$)<input type="number" min="0" value={form.budget} onChange={(event) => setForm((current) => ({ ...current, budget: event.target.value }))} placeholder="Ex.: 15000" /></label><div className="helper-note"><CircleHelp size={16} /> Valores e faixas são provisórios e serão revistos com a ficha oficial.</div></div>}
              {step === 2 && <div className="form-step"><h3>Descubra as oportunidades.</h3><p>Selecione quantos objetivos fizerem sentido para este cliente.</p><span className="form-label plain">Quais objetivos estão em foco?</span><div className="choice-list">{([{ id: "compras", title: "Aquisição de produtos", subtitle: "Interesse em conhecer ou ampliar compras" }, { id: "branding", title: "Fortalecimento da marca", subtitle: "Visibilidade, posicionamento e parcerias" }, { id: "expansao", title: "Expansão do negócio", subtitle: "Crescimento e novos projetos" }] as { id: Objective; title: string; subtitle: string }[]).map((choice) => <button key={choice.id} className={"choice " + (form.objectives.includes(choice.id) ? "selected" : "")} onClick={() => toggleObjective(choice.id)}><span className="choice-check">{form.objectives.includes(choice.id) && <Check size={14} />}</span><span><strong>{choice.title}</strong><small>{choice.subtitle}</small></span></button>)}</div><label className="form-label">Interesse atual em compra<select value={form.interest} onChange={(event) => setForm((current) => ({ ...current, interest: event.target.value as FormState["interest"] }))}><option value="alto">Alto</option><option value="medio">Médio</option><option value="baixo">Baixo</option></select></label><label className="form-label">Observações da visita <span className="optional">Opcional</span><textarea rows={3} value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} placeholder="Algo importante para o próximo contato?" /></label><div className="preview-classification"><span>PRÉVIA DA CLASSIFICAÇÃO</span><div>{classify(form).length ? classify(form).map((segment) => <Badge key={segment} segment={segment} />) : <small>Selecione objetivos para visualizar possíveis categorias.</small>}</div></div></div>}
            </div>
            <footer className="form-footer"><button className="draft-button" onClick={saveDraft}><Download size={16} /> Salvar rascunho</button><div>{step > 0 && <button className="button button-quiet" onClick={() => setStep((current) => current - 1)}><ChevronLeft size={17} /> Voltar</button>}<button className="button button-dark" onClick={() => { if (step === 0 && (!form.name.trim() || !form.contact.trim() || !form.city.trim())) { setToast("Informe nome, responsável e cidade."); return; } if (step < 2) setStep((current) => current + 1); else saveVisit(); }}>{step === 2 ? "Concluir visita" : "Continuar"} {step === 2 ? <Check size={17} /> : <ArrowRight size={17} />}</button></div></footer>
          </section>
        </div>
      )}
      {toast && <div className="toast"><CheckCircle2 size={17} /> {toast}<button onClick={() => setToast("")} aria-label="Dispensar mensagem"><X size={15} /></button></div>}
    </div>
  );
}

function Metric({ label, value, icon: Icon, note, tone }: { label: string; value: string; icon: LucideIcon; note: string; tone: string }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><span className={"metric-icon " + tone}><Icon size={19} strokeWidth={1.7} /></span></div><div className="metric-value">{value}<span className="metric-suffix">/</span></div><div className="metric-bottom"><span className={"metric-tiny-dot " + tone} />{note}</div></article>;
}
function PageTitle({ eyebrow, title, description, action, actionLabel }: { eyebrow: string; title: string; description: string; action?: () => void; actionLabel?: string }) {
  return <div className="page-head"><div><div className="eyebrow"><span className="eyebrow-line" /> {eyebrow}</div><h1>{title}<span className="serif-dot">.</span></h1><p>{description}</p></div>{action && <button className="button button-dark main-cta" onClick={action}><Plus size={18} /> {actionLabel}</button>}</div>;
}
