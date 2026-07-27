"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Bell,
  BellRing,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Command,
  CreditCard,
  FileClock,
  FileText,
  Gauge,
  HeartPulse,
  Home,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { demoSales, sellers, type DemoSale } from "../demo/data";
import { formatMoney } from "../domain/money";
import { NewSaleModal } from "./new-sale-modal";
import { StatusBadge } from "./status-badge";

type View =
  | "dashboard"
  | "my-sales"
  | "all-sales"
  | "payments"
  | "reconciliation"
  | "notifications"
  | "sellers"
  | "performance"
  | "reports"
  | "integrations"
  | "settings"
  | "audit"
  | "health"
  | "profile";

type DemoRole = "ADMIN" | "SELLER";

interface NavItem {
  id: View;
  label: string;
  icon: typeof LayoutDashboard;
  admin?: boolean;
  badge?: string;
}

interface NavSection {
  label: string;
  adminOnly?: boolean;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "Visão geral",
    items: [
      { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
      { id: "notifications" as const, label: "Notificações", icon: Bell },
    ],
  },
  {
    label: "Operação",
    items: [
      { id: "my-sales" as const, label: "Minhas vendas", icon: ReceiptText },
      {
        id: "all-sales" as const,
        label: "Todas as vendas",
        icon: FileText,
        admin: true,
      },
      { id: "payments" as const, label: "Pagamentos", icon: WalletCards },
      {
        id: "reconciliation" as const,
        label: "Conciliação",
        icon: RefreshCw,
        badge: "2",
        admin: true,
      },
    ],
  },
  {
    label: "Gestão",
    adminOnly: true,
    items: [
      { id: "sellers" as const, label: "Vendedores", icon: Users },
      {
        id: "performance" as const,
        label: "Desempenho",
        icon: ChartNoAxesCombined,
      },
      { id: "reports" as const, label: "Relatórios", icon: FileClock },
    ],
  },
  {
    label: "Sistema",
    adminOnly: true,
    items: [
      { id: "integrations" as const, label: "Integrações", icon: CreditCard },
      { id: "audit" as const, label: "Auditoria", icon: ShieldCheck },
      { id: "health" as const, label: "Saúde", icon: HeartPulse },
      { id: "settings" as const, label: "Configurações", icon: Settings },
    ],
  },
];

const titles: Record<
  View,
  { eyebrow: string; title: string; description: string }
> = {
  dashboard: {
    eyebrow: "Segunda-feira, 27 de julho",
    title: "Bom dia, André",
    description: "Aqui está o resumo da operação da sua loja hoje.",
  },
  "my-sales": {
    eyebrow: "Operação",
    title: "Minhas vendas",
    description: "Acompanhe suas cobranças e confirmações em tempo real.",
  },
  "all-sales": {
    eyebrow: "Operação",
    title: "Todas as vendas",
    description: "Visão completa das vendas realizadas pela equipe.",
  },
  payments: {
    eyebrow: "Financeiro",
    title: "Pagamentos",
    description: "Movimentações Pix verificadas e aguardando confirmação.",
  },
  reconciliation: {
    eyebrow: "Financeiro",
    title: "Conciliação",
    description: "Casos que precisam de uma decisão segura da equipe.",
  },
  notifications: {
    eyebrow: "Atualizações",
    title: "Central de notificações",
    description: "Confirmações e alertas importantes da sua operação.",
  },
  sellers: {
    eyebrow: "Equipe",
    title: "Vendedores",
    description: "Gerencie acessos e acompanhe sua equipe comercial.",
  },
  performance: {
    eyebrow: "Equipe",
    title: "Desempenho dos vendedores",
    description: "Resultados e conversão de cada pessoa da equipe.",
  },
  reports: {
    eyebrow: "Inteligência",
    title: "Relatórios",
    description: "Métricas essenciais para acompanhar o negócio.",
  },
  integrations: {
    eyebrow: "Sistema",
    title: "Integrações",
    description: "Conexões financeiras e operacionais da loja.",
  },
  settings: {
    eyebrow: "Sistema",
    title: "Configurações",
    description: "Preferências da loja, alertas e segurança.",
  },
  audit: {
    eyebrow: "Segurança",
    title: "Logs de auditoria",
    description: "Histórico imutável de ações importantes.",
  },
  health: {
    eyebrow: "Sistema",
    title: "Saúde da integração",
    description: "Disponibilidade, webhooks e comunicação com o provedor.",
  },
  profile: {
    eyebrow: "Conta",
    title: "Meu perfil",
    description: "Dados pessoais, sessão e preferências.",
  },
};

function SalesTable({
  sales,
  compact = false,
}: {
  sales: DemoSale[];
  compact?: boolean;
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Vendedor</th>
            <th>Valor</th>
            <th>Status</th>
            {!compact && <th>Referência</th>}
            <th aria-label="Ações" />
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id}>
              <td>
                <div className="customer-cell">
                  <span className="customer-avatar">
                    {sale.customer
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </span>
                  <span>
                    <strong>{sale.customer}</strong>
                    <small>{sale.description}</small>
                  </span>
                </div>
              </td>
              <td>{sale.seller}</td>
              <td>
                <strong>{formatMoney(sale.amount)}</strong>
              </td>
              <td>
                <StatusBadge status={sale.status} />
              </td>
              {!compact && <td className="reference">{sale.reference}</td>}
              <td>
                <button
                  className="table-action"
                  aria-label={`Abrir ${sale.reference}`}
                >
                  <ChevronRight size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function NotificaApp() {
  const [view, setView] = useState<View>("dashboard");
  const [role, setRole] = useState<DemoRole>("ADMIN");
  const [sales, setSales] = useState(demoSales);
  const [newSaleOpen, setNewSaleOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [paymentAlert, setPaymentAlert] = useState<DemoSale | null>(null);
  const [search, setSearch] = useState("");

  const visibleSales = useMemo(() => {
    const scoped =
      role === "SELLER"
        ? sales.filter((sale) => sale.sellerId === "seller-ana")
        : sales;
    if (!search.trim()) return scoped;
    const query = search.toLowerCase();
    return scoped.filter((sale) =>
      [sale.customer, sale.description, sale.reference, sale.seller]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [role, sales, search]);

  function navigate(next: View) {
    setView(next);
    setMobileMenu(false);
  }

  function addSale(sale: DemoSale) {
    setSales((current) => [sale, ...current]);
    setToast("Cobrança Pix criada com sucesso");
    window.setTimeout(() => setToast(null), 2500);
  }

  function confirmPayment(sale: DemoSale) {
    setSales((current) =>
      current.map((item) => (item.id === sale.id ? sale : item)),
    );
    setPaymentAlert(sale);
    setToast("Pix confirmado com segurança");
    window.setTimeout(() => setToast(null), 3500);
  }

  const title = titles[view];
  const paidToday = sales.filter((sale) => sale.status === "PAID");
  const paidTotal = paidToday.reduce((total, sale) => total + sale.amount, 0);
  const pending = sales.filter((sale) => sale.status === "AWAITING_PAYMENT");
  const ambiguous = sales.filter((sale) => sale.status === "AMBIGUOUS");

  return (
    <div className="app-root">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <BellRing size={21} />
          </span>
          <span>
            <strong>Notifica</strong>
            <small>AI</small>
          </span>
          <button
            className="mobile-close"
            aria-label="Fechar menu"
            onClick={() => setMobileMenu(false)}
          >
            <X size={19} />
          </button>
        </div>

        <button
          className="button primary new-sale-side"
          onClick={() => setNewSaleOpen(true)}
        >
          <Plus size={19} />
          Nova venda
          <kbd>N</kbd>
        </button>

        <nav className="sidebar-nav" aria-label="Navegação principal">
          {navSections.map((section) => {
            if (section.adminOnly && role !== "ADMIN") return null;
            return (
              <div className="nav-section" key={section.label}>
                <span className="nav-label">{section.label}</span>
                {section.items.map((item) => {
                  if (item.admin && role !== "ADMIN") return null;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      className={
                        view === item.id ? "nav-item active" : "nav-item"
                      }
                      onClick={() => navigate(item.id)}
                    >
                      <Icon size={18} strokeWidth={1.8} />
                      <span>{item.label}</span>
                      {"badge" in item && item.badge && <em>{item.badge}</em>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="realtime-status">
            <span className="live-dot" />
            Tempo real conectado
          </div>
          <button className="profile-chip" onClick={() => navigate("profile")}>
            <span className="profile-avatar">AZ</span>
            <span>
              <strong>{role === "ADMIN" ? "André Zanon" : "Ana Costa"}</strong>
              <small>{role === "ADMIN" ? "Administrador" : "Vendedora"}</small>
            </span>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </aside>

      {mobileMenu && (
        <button
          className="mobile-overlay"
          aria-label="Fechar menu"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <main className="main-content">
        <header className="topbar">
          <button
            className="menu-button"
            aria-label="Abrir menu"
            onClick={() => setMobileMenu(true)}
          >
            <Menu size={21} />
          </button>
          <div className="global-search">
            <Search size={18} />
            <input
              aria-label="Buscar vendas"
              placeholder="Buscar cliente, venda ou valor..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <kbd>
              <Command size={13} /> K
            </kbd>
          </div>
          <div className="topbar-actions">
            <span className="demo-badge">
              <span />
              Ambiente de demonstração
            </span>
            <label className="role-switch">
              <span className="sr-only">Perfil demonstrativo</span>
              <select
                value={role}
                onChange={(event) => {
                  const next = event.target.value as DemoRole;
                  setRole(next);
                  if (
                    next === "SELLER" &&
                    ![
                      "dashboard",
                      "my-sales",
                      "payments",
                      "notifications",
                      "profile",
                    ].includes(view)
                  ) {
                    setView("dashboard");
                  }
                }}
              >
                <option value="ADMIN">Visão admin</option>
                <option value="SELLER">Visão vendedor</option>
              </select>
              <ChevronDown size={15} />
            </label>
            <button
              className="icon-button notification-button"
              aria-label="Notificações"
              onClick={() => navigate("notifications")}
            >
              <Bell size={19} />
              <span>3</span>
            </button>
          </div>
        </header>

        <div className="content-inner">
          <div className="page-heading">
            <div>
              <span className="eyebrow">{title.eyebrow}</span>
              <h1>{title.title}</h1>
              <p>{title.description}</p>
            </div>
            {view !== "dashboard" && (
              <button
                className="button primary"
                onClick={() => setNewSaleOpen(true)}
              >
                <Plus size={18} />
                Nova venda
              </button>
            )}
          </div>

          {view === "dashboard" && (
            <>
              <section className="hero-strip">
                <div>
                  <span className="hero-icon">
                    <CircleDollarSign size={22} />
                  </span>
                  <div>
                    <span>Recebido hoje</span>
                    <strong>{formatMoney(paidTotal)}</strong>
                    <small>
                      <b>↑ 12,4%</b> em relação a ontem
                    </small>
                  </div>
                </div>
                <button
                  className="button hero-button"
                  onClick={() => setNewSaleOpen(true)}
                >
                  <Plus size={19} />
                  Criar nova venda
                </button>
              </section>

              <section className="metric-grid" aria-label="Métricas de hoje">
                <article className="metric-card">
                  <span className="metric-icon green">
                    <Check size={19} />
                  </span>
                  <div>
                    <span>Pix confirmados</span>
                    <strong>{paidToday.length}</strong>
                    <small>pagamentos hoje</small>
                  </div>
                  <span className="metric-trend positive">+8%</span>
                </article>
                <article className="metric-card">
                  <span className="metric-icon amber">
                    <Clock3 size={19} />
                  </span>
                  <div>
                    <span>Aguardando</span>
                    <strong>{pending.length}</strong>
                    <small>
                      {formatMoney(pending.reduce((a, b) => a + b.amount, 0))}
                    </small>
                  </div>
                  <button
                    className="metric-link"
                    onClick={() => navigate("my-sales")}
                  >
                    Ver
                  </button>
                </article>
                <article className="metric-card">
                  <span className="metric-icon violet">
                    <Gauge size={19} />
                  </span>
                  <div>
                    <span>Ticket médio</span>
                    <strong>
                      {formatMoney(
                        Math.round(paidTotal / Math.max(paidToday.length, 1)),
                      )}
                    </strong>
                    <small>por venda paga</small>
                  </div>
                </article>
                <article className="metric-card">
                  <span className="metric-icon orange">
                    <RefreshCw size={19} />
                  </span>
                  <div>
                    <span>Conciliação</span>
                    <strong>{ambiguous.length}</strong>
                    <small>requer atenção</small>
                  </div>
                  <button
                    className="metric-link"
                    onClick={() => navigate("reconciliation")}
                  >
                    Resolver
                  </button>
                </article>
              </section>

              <section className="dashboard-grid">
                <article className="panel sales-panel">
                  <header className="panel-header">
                    <div>
                      <h2>Últimas vendas</h2>
                      <p>Atualização automática em tempo real</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() =>
                        navigate(role === "ADMIN" ? "all-sales" : "my-sales")
                      }
                    >
                      Ver todas <ChevronRight size={16} />
                    </button>
                  </header>
                  <SalesTable sales={visibleSales.slice(0, 5)} compact />
                </article>

                <article className="panel performance-panel">
                  <header className="panel-header">
                    <div>
                      <h2>Desempenho hoje</h2>
                      <p>Recebimentos por horário</p>
                    </div>
                    <button className="icon-button" aria-label="Mais opções">
                      <MoreHorizontal size={18} />
                    </button>
                  </header>
                  <div
                    className="bar-chart"
                    aria-label="Gráfico de vendas por horário"
                  >
                    {[34, 48, 42, 70, 54, 86, 66, 92, 72, 58].map(
                      (height, index) => (
                        <div key={index}>
                          <span
                            style={{ height: `${height}%` }}
                            className={index === 7 ? "peak" : ""}
                          />
                        </div>
                      ),
                    )}
                  </div>
                  <div className="chart-labels">
                    <span>8h</span>
                    <span>10h</span>
                    <span>12h</span>
                    <span>14h</span>
                    <span>16h</span>
                    <span>18h</span>
                  </div>
                  <div className="chart-summary">
                    <div>
                      <strong>92%</strong>
                      <span>Conversão Pix</span>
                    </div>
                    <div>
                      <strong>3m 42s</strong>
                      <span>Tempo médio</span>
                    </div>
                  </div>
                </article>
              </section>
            </>
          )}

          {["my-sales", "all-sales", "payments"].includes(view) && (
            <section className="panel page-panel">
              <div className="filter-bar">
                <div className="filter-tabs">
                  <button className="active">Todas</button>
                  <button>Aguardando</button>
                  <button>Pagas</button>
                  <button>Expiradas</button>
                </div>
                <button className="button secondary">
                  <FileClock size={17} /> Hoje
                </button>
              </div>
              <SalesTable sales={visibleSales} />
            </section>
          )}

          {view === "reconciliation" && (
            <section className="reconciliation-layout">
              <div className="panel case-list">
                <header className="panel-header">
                  <div>
                    <h2>Casos abertos</h2>
                    <p>2 itens aguardando análise</p>
                  </div>
                  <span className="attention-count">2</span>
                </header>
                <button className="case-item active">
                  <span className="case-icon">
                    <RefreshCw size={18} />
                  </span>
                  <span>
                    <strong>Valor recebido divergente</strong>
                    <small>Lucas Rocha · VEN-0727-0944</small>
                  </span>
                  <em>Agora</em>
                </button>
                <button className="case-item">
                  <span className="case-icon">
                    <Search size={18} />
                  </span>
                  <span>
                    <strong>Cobrança não localizada</strong>
                    <small>Pagador não identificado</small>
                  </span>
                  <em>12 min</em>
                </button>
              </div>
              <article className="panel case-detail">
                <div className="case-detail-head">
                  <span className="status-badge status-ambiguous">
                    <span className="status-dot" />
                    Conciliação
                  </span>
                  <span>
                    Confiança de correspondência: <strong>78%</strong>
                  </span>
                </div>
                <h2>Valor recebido diferente do esperado</h2>
                <p>
                  O PagBank confirmou o pagamento, mas o valor é R$ 0,17
                  inferior ao total da cobrança.
                </p>
                <div className="comparison-grid">
                  <div>
                    <span>Valor esperado</span>
                    <strong>R$ 1.899,17</strong>
                  </div>
                  <div className="warning-value">
                    <span>Valor recebido</span>
                    <strong>R$ 1.899,00</strong>
                  </div>
                  <div>
                    <span>Cliente</span>
                    <strong>Lucas Rocha</strong>
                  </div>
                  <div>
                    <span>Vendedor</span>
                    <strong>Paula Nunes</strong>
                  </div>
                </div>
                <div className="audit-timeline">
                  <div>
                    <span />
                    <p>
                      <strong>Webhook recebido</strong>
                      <small>Hoje, 09:47:12 · Evento sanitizado</small>
                    </p>
                  </div>
                  <div>
                    <span />
                    <p>
                      <strong>Consulta direta ao PagBank</strong>
                      <small>Hoje, 09:47:13 · Status PAID</small>
                    </p>
                  </div>
                  <div className="warning">
                    <span />
                    <p>
                      <strong>Divergência detectada</strong>
                      <small>Venda bloqueada automaticamente</small>
                    </p>
                  </div>
                </div>
                <div className="case-actions">
                  <button className="button secondary">
                    <FileText size={17} /> Marcar para análise
                  </button>
                  <button
                    className="button primary"
                    onClick={() => {
                      setToast("Nova verificação agendada");
                      window.setTimeout(() => setToast(null), 2200);
                    }}
                  >
                    <RefreshCw size={17} /> Solicitar nova verificação
                  </button>
                </div>
              </article>
            </section>
          )}

          {["sellers", "performance"].includes(view) && (
            <section className="panel page-panel">
              <div className="seller-ranking">
                {sellers.map((seller, index) => (
                  <article key={seller.id} className="seller-row">
                    <span className="rank">{index + 1}</span>
                    <span className="customer-avatar">
                      {seller.name
                        .split(" ")
                        .map((p) => p[0])
                        .join("")}
                    </span>
                    <div className="seller-name">
                      <strong>{seller.name}</strong>
                      <small>{seller.sales} vendas confirmadas</small>
                    </div>
                    <div className="seller-progress">
                      <span>
                        <i style={{ width: `${seller.rate}%` }} />
                      </span>
                      <small>{seller.rate}% de conversão</small>
                    </div>
                    <strong className="seller-value">
                      {formatMoney(seller.value)}
                    </strong>
                    <button className="table-action">
                      <ChevronRight size={18} />
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}

          {view === "notifications" && (
            <section className="panel page-panel notifications-list">
              {paidToday.slice(0, 4).map((sale, index) => (
                <article
                  className={
                    index === 0
                      ? "notification-item unread"
                      : "notification-item"
                  }
                  key={sale.id}
                >
                  <span className="notification-icon">
                    <Check size={19} />
                  </span>
                  <div>
                    <strong>Pix confirmado</strong>
                    <p>
                      Recebemos {formatMoney(sale.amount)} da venda de{" "}
                      {sale.customer}.
                    </p>
                    <small>
                      {sale.paidAt || "Hoje"} · {sale.seller}
                    </small>
                  </div>
                  {index === 0 && <span className="unread-dot" />}
                </article>
              ))}
              <article className="notification-item warning-notification">
                <span className="notification-icon">
                  <RefreshCw size={19} />
                </span>
                <div>
                  <strong>Pagamento em conciliação</strong>
                  <p>
                    Uma divergência de valor precisa de análise administrativa.
                  </p>
                  <small>Hoje, 09:47 · VEN-0727-0944</small>
                </div>
              </article>
            </section>
          )}

          {["integrations", "health"].includes(view) && (
            <section className="integration-grid">
              <article className="panel provider-card">
                <header>
                  <span className="provider-logo">P</span>
                  <div>
                    <h2>PagBank</h2>
                    <p>API Order · Pix</p>
                  </div>
                  <span className="status-badge status-awaiting_payment">
                    <span className="status-dot" />
                    Aguardando configuração
                  </span>
                </header>
                <div className="provider-stats">
                  <div>
                    <span>Ambiente</span>
                    <strong>Sandbox</strong>
                  </div>
                  <div>
                    <span>Última chamada</span>
                    <strong>Não realizada</strong>
                  </div>
                  <div>
                    <span>Webhook</span>
                    <strong>Não configurado</strong>
                  </div>
                </div>
                <div className="provider-actions">
                  <button
                    className="button secondary"
                    onClick={() => {
                      setToast("Modo mock conectado e saudável");
                      window.setTimeout(() => setToast(null), 2200);
                    }}
                  >
                    <Activity size={17} /> Testar conexão
                  </button>
                  <button className="button primary">
                    <Settings size={17} /> Configurar
                  </button>
                </div>
              </article>
              <article className="panel provider-card mock-provider">
                <header>
                  <span className="provider-logo mock">
                    <SparkMark />
                  </span>
                  <div>
                    <h2>Mock Payments</h2>
                    <p>Simulador operacional</p>
                  </div>
                  <span className="status-badge status-paid">
                    <span className="status-dot" />
                    Conectado
                  </span>
                </header>
                <div className="provider-stats">
                  <div>
                    <span>Ambiente</span>
                    <strong>Demonstração</strong>
                  </div>
                  <div>
                    <span>Latência</span>
                    <strong>8 ms</strong>
                  </div>
                  <div>
                    <span>Último evento</span>
                    <strong>Há 2 min</strong>
                  </div>
                </div>
                <div className="health-bars">
                  {[92, 76, 88, 95, 72, 90, 96, 89, 98, 94, 91, 97].map(
                    (height, index) => (
                      <span key={index} style={{ height: `${height}%` }} />
                    ),
                  )}
                </div>
              </article>
              <article className="panel system-health">
                <header className="panel-header">
                  <div>
                    <h2>Serviços</h2>
                    <p>Status em tempo real</p>
                  </div>
                </header>
                {[
                  ["Aplicação", "Operacional", "32 ms"],
                  ["Banco de dados", "Operacional", "18 ms"],
                  ["Fila de webhooks", "Operacional", "0 pendentes"],
                  ["Notificações", "Operacional", "Conectado"],
                ].map(([name, status, detail]) => (
                  <div className="service-row" key={name}>
                    <span className="service-ok">
                      <Check size={15} />
                    </span>
                    <strong>{name}</strong>
                    <span>{status}</span>
                    <small>{detail}</small>
                  </div>
                ))}
              </article>
            </section>
          )}

          {["reports", "audit", "settings", "profile"].includes(view) && (
            <section className="dashboard-grid generic-grid">
              <article className="panel page-panel">
                <header className="panel-header">
                  <div>
                    <h2>
                      {view === "reports"
                        ? "Resumo dos últimos 7 dias"
                        : view === "audit"
                          ? "Atividade recente"
                          : "Preferências"}
                    </h2>
                    <p>Dados seguros e atualizados</p>
                  </div>
                </header>
                {view === "reports" ? (
                  <>
                    <div className="report-metrics">
                      <div>
                        <span>Valor total</span>
                        <strong>R$ 84.320,00</strong>
                        <small>+14,2% no período</small>
                      </div>
                      <div>
                        <span>Conversão</span>
                        <strong>89,4%</strong>
                        <small>312 de 349 cobranças</small>
                      </div>
                      <div>
                        <span>Tempo médio</span>
                        <strong>4m 08s</strong>
                        <small>-22s no período</small>
                      </div>
                    </div>
                    <div className="report-chart">
                      {[58, 72, 66, 84, 76, 94, 88].map((height, index) => (
                        <span key={index} style={{ height: `${height}%` }} />
                      ))}
                    </div>
                  </>
                ) : view === "audit" ? (
                  <div className="audit-list">
                    {[
                      [
                        "Pagamento verificado",
                        "Sistema",
                        "VEN-0727-1048",
                        "Agora",
                      ],
                      ["Venda criada", "Ana Costa", "VEN-0727-1035", "13 min"],
                      [
                        "Webhook duplicado ignorado",
                        "Sistema",
                        "EVT-9281",
                        "26 min",
                      ],
                      [
                        "Caso de conciliação aberto",
                        "Sistema",
                        "VEN-0727-0944",
                        "1h",
                      ],
                    ].map((item) => (
                      <div key={item[2]}>
                        <span className="audit-icon">
                          <FileText size={16} />
                        </span>
                        <p>
                          <strong>{item[0]}</strong>
                          <small>
                            {item[1]} · {item[2]}
                          </small>
                        </p>
                        <time>{item[3]}</time>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="settings-list">
                    {[
                      [
                        "Som de confirmação",
                        "Tocar um alerta curto quando um Pix for confirmado",
                        true,
                      ],
                      [
                        "Notificações no navegador",
                        "Receber alertas mesmo com outra aba aberta",
                        true,
                      ],
                      [
                        "Avisar gerente",
                        "Gerentes recebem confirmações da equipe",
                        false,
                      ],
                      [
                        "Horário silencioso",
                        "Silenciar alertas entre 22h e 7h",
                        false,
                      ],
                    ].map(([name, detail, active]) => (
                      <label key={String(name)}>
                        <span>
                          <strong>{String(name)}</strong>
                          <small>{String(detail)}</small>
                        </span>
                        <input
                          type="checkbox"
                          defaultChecked={Boolean(active)}
                        />
                        <i />
                      </label>
                    ))}
                  </div>
                )}
              </article>
              <aside className="panel security-card">
                <span className="security-illustration">
                  <ShieldCheck size={30} />
                </span>
                <h3>Operação protegida</h3>
                <p>
                  Confirmações financeiras acontecem somente após consulta
                  direta ao provedor.
                </p>
                <div>
                  <Check size={15} /> RBAC aplicado no backend
                </div>
                <div>
                  <Check size={15} /> Webhook idempotente
                </div>
                <div>
                  <Check size={15} /> Auditoria sanitizada
                </div>
              </aside>
            </section>
          )}
        </div>
      </main>

      <nav className="mobile-bottom-nav" aria-label="Navegação móvel">
        <button
          className={view === "dashboard" ? "active" : ""}
          onClick={() => navigate("dashboard")}
        >
          <Home size={20} />
          <span>Início</span>
        </button>
        <button
          className={view === "my-sales" ? "active" : ""}
          onClick={() => navigate("my-sales")}
        >
          <ReceiptText size={20} />
          <span>Vendas</span>
        </button>
        <button
          className="mobile-new-sale"
          onClick={() => setNewSaleOpen(true)}
          aria-label="Nova venda"
        >
          <Plus size={24} />
        </button>
        <button
          className={view === "notifications" ? "active" : ""}
          onClick={() => navigate("notifications")}
        >
          <Bell size={20} />
          <span>Alertas</span>
        </button>
        <button onClick={() => setMobileMenu(true)}>
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>

      {newSaleOpen && (
        <NewSaleModal
          onClose={() => setNewSaleOpen(false)}
          onCreated={addSale}
          onPaid={confirmPayment}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={16} />
          </span>
          {toast}
        </div>
      )}

      {paymentAlert && (
        <div
          className="payment-confirmation"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-title"
        >
          <button
            className="icon-button"
            aria-label="Fechar alerta"
            onClick={() => setPaymentAlert(null)}
          >
            <X size={18} />
          </button>
          <span className="confirmation-icon">
            <Check size={28} />
          </span>
          <span className="eyebrow">Pagamento verificado</span>
          <h2 id="payment-title">Pix confirmado</h2>
          <p>
            Recebemos <strong>{formatMoney(paymentAlert.amount)}</strong> da
            venda de {paymentAlert.customer}.
          </p>
          <small>Pagamento confirmado agora · {paymentAlert.reference}</small>
          <button
            className="button primary"
            onClick={() => {
              setPaymentAlert(null);
              setView("my-sales");
            }}
          >
            Abrir detalhes
          </button>
        </div>
      )}
    </div>
  );
}

function SparkMark() {
  return <CircleDollarSign size={22} />;
}
