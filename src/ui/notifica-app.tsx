"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  Bell,
  Check,
  CheckCircle2,
  Clipboard,
  LoaderCircle,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  WalletCards,
  Wifi,
} from "lucide-react";
import { formatMoney } from "../domain/money";
import {
  confirmQuickSale,
  emptyQuickSaleSummary,
  parseSaleAmount,
  type QuickSaleSummary,
} from "../sales/quick-sale";

type Charge = {
  id: string;
  amountCents: number;
  pixCode: string;
  providerOrderId: string;
  providerChargeId: string;
  mode: "mock" | "pagbank";
  status: "AWAITING_PAYMENT" | "PAID";
};

type Notice = {
  title: string;
  description: string;
  amountCents: number;
};

export function NotificaApp() {
  const [amount, setAmount] = useState("");
  const [charge, setCharge] = useState<Charge | null>(null);
  const [summary, setSummary] = useState<QuickSaleSummary>(
    emptyQuickSaleSummary,
  );
  const [notice, setNotice] = useState<Notice | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"create" | "validate" | null>(null);

  const amountCents = useMemo(() => parseSaleAmount(amount), [amount]);

  useEffect(() => {
    if (!charge) return;

    void QRCode.toDataURL(charge.pixCode, {
      width: 340,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#111827", light: "#ffffff" },
    }).then(setQrCode);
  }, [charge]);

  async function generatePix(event: React.FormEvent) {
    event.preventDefault();
    if (!amountCents) {
      setError("Informe o valor da venda.");
      return;
    }

    setError("");
    setLoading("create");
    try {
      const response = await fetch("/api/payments/quick-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents }),
      });
      const payload = (await response.json()) as Record<string, unknown>;
      if (!response.ok) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Não foi possível gerar o Pix.",
        );
      }

      setCharge({
        id: String(payload.id),
        amountCents: Number(payload.amountCents),
        pixCode: String(payload.pixCode),
        providerOrderId: String(payload.providerOrderId),
        providerChargeId: String(payload.providerChargeId),
        mode: payload.mode === "pagbank" ? "pagbank" : "mock",
        status: "AWAITING_PAYMENT",
      });
      setSummary((current) => ({
        ...current,
        awaitingCents: Number(payload.amountCents),
      }));
      setNotice(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível gerar o Pix.",
      );
    } finally {
      setLoading(null);
    }
  }

  async function validatePayment() {
    if (!charge || charge.status === "PAID") return;

    setError("");
    setLoading("validate");
    try {
      const response = await fetch("/api/payments/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerOrderId: charge.providerOrderId,
          providerChargeId: charge.providerChargeId,
          amountCents: charge.amountCents,
        }),
      });
      const payload = (await response.json()) as Record<string, unknown>;
      if (!response.ok) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Não foi possível validar o pagamento.",
        );
      }
      if (!payload.paid) {
        setError("O pagamento ainda não foi identificado.");
        return;
      }

      const result = confirmQuickSale(charge, summary);
      setCharge({ ...charge, status: result.sale.status });
      setSummary(result.summary);
      setNotice({
        title: "Pagamento confirmado",
        description: "O Pix foi validado e a venda está concluída.",
        amountCents: charge.amountCents,
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível validar o pagamento.",
      );
    } finally {
      setLoading(null);
    }
  }

  async function copyPix() {
    if (!charge) return;
    await navigator.clipboard?.writeText(charge.pixCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function sharePix() {
    if (!charge) return;
    const text = `Pix no valor de ${formatMoney(charge.amountCents)}\n${charge.pixCode}`;
    if (navigator.share) {
      await navigator.share({ title: "Cobrança Pix", text });
      return;
    }
    await navigator.clipboard?.writeText(text);
    setCopied(true);
  }

  function startNewSale() {
    setAmount("");
    setCharge(null);
    setQrCode("");
    setNotice(null);
    setError("");
  }

  return (
    <main className="simple-app">
      <header className="simple-header">
        <a className="simple-brand" href="#" aria-label="Notifica AI">
          <span className="simple-brand-mark">
            <Bell size={20} />
          </span>
          <span>
            <strong>Notifica AI</strong>
            <small>Venda Pix sem complicação</small>
          </span>
        </a>
        <div className="connection-state">
          <span className="connection-dot" />
          Provedor não conectado
        </div>
      </header>

      <section className="simple-shell">
        <div className="simple-intro">
          <span className="simple-kicker">Venda rápida</span>
          <h1>Digite o valor. O Pix fica pronto.</h1>
          <p>
            Sem cadastro, aparelho ou dados desnecessários. Gere o QR Code,
            envie ao cliente e receba a confirmação do pagamento.
          </p>
        </div>

        <div className="zero-summary" aria-label="Resumo das vendas">
          <article>
            <span>Vendas confirmadas</span>
            <strong>{summary.salesCount}</strong>
          </article>
          <article>
            <span>Recebido</span>
            <strong>{formatMoney(summary.receivedCents)}</strong>
          </article>
          <article>
            <span>Aguardando</span>
            <strong>{formatMoney(summary.awaitingCents)}</strong>
          </article>
        </div>

        <div className="operation-grid">
          <section className="sale-card" aria-labelledby="sale-card-title">
            {!charge ? (
              <form onSubmit={generatePix} className="quick-sale-form">
                <div className="card-heading">
                  <span className="card-icon">
                    <WalletCards size={22} />
                  </span>
                  <div>
                    <span>Nova venda</span>
                    <h2 id="sale-card-title">Qual é o valor?</h2>
                  </div>
                </div>

                <label className="big-money-field">
                  <span>Valor da venda</span>
                  <div>
                    <small>R$</small>
                    <input
                      autoFocus
                      inputMode="decimal"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="0,00"
                      aria-describedby="amount-help"
                    />
                  </div>
                </label>
                <p id="amount-help" className="field-help">
                  O valor será enviado exatamente como informado.
                </p>

                {error && (
                  <p className="inline-error" role="alert">
                    {error}
                  </p>
                )}

                <button
                  className="primary-action"
                  disabled={!amountCents || loading === "create"}
                >
                  {loading === "create" ? (
                    <LoaderCircle className="spin" size={20} />
                  ) : (
                    <Plus size={20} />
                  )}
                  Gerar Pix
                </button>
              </form>
            ) : (
              <div className="pix-result">
                <div className="pix-result-head">
                  <div>
                    <span>Pix gerado</span>
                    <h2 id="sale-card-title">
                      {formatMoney(charge.amountCents)}
                    </h2>
                  </div>
                  <span
                    className={`payment-state ${charge.status === "PAID" ? "paid" : ""}`}
                  >
                    {charge.status === "PAID" ? (
                      <>
                        <Check size={16} /> Pago
                      </>
                    ) : (
                      <>
                        <span className="pulse" /> Aguardando
                      </>
                    )}
                  </span>
                </div>

                <div className="qr-area">
                  <div className="qr-box">
                    {qrCode ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrCode} alt="QR Code da cobrança Pix" />
                    ) : (
                      <LoaderCircle className="spin" size={30} />
                    )}
                  </div>
                  <p>Aponte a câmera ou envie o código ao cliente.</p>
                </div>

                <div className="pix-actions">
                  <button className="secondary-action" onClick={copyPix}>
                    {copied ? <Check size={18} /> : <Clipboard size={18} />}
                    {copied ? "Copiado" : "Copiar código"}
                  </button>
                  <button className="secondary-action" onClick={sharePix}>
                    <Send size={18} />
                    Enviar
                  </button>
                </div>

                {error && (
                  <p className="inline-error" role="alert">
                    {error}
                  </p>
                )}

                {charge.status === "AWAITING_PAYMENT" ? (
                  <button
                    className="primary-action"
                    onClick={validatePayment}
                    disabled={loading === "validate"}
                  >
                    {loading === "validate" ? (
                      <LoaderCircle className="spin" size={20} />
                    ) : (
                      <RefreshCw size={19} />
                    )}
                    Validar pagamento
                  </button>
                ) : (
                  <button className="primary-action" onClick={startNewSale}>
                    <Plus size={20} />
                    Registrar nova venda
                  </button>
                )}
              </div>
            )}
          </section>

          <aside className="notification-card" aria-live="polite">
            <div className="card-heading compact">
              <span className="card-icon green">
                <Bell size={21} />
              </span>
              <div>
                <span>Notificação</span>
                <h2>Pagamento</h2>
              </div>
              <strong className="notice-count">
                {summary.notificationCount}
              </strong>
            </div>

            {notice ? (
              <div className="success-notice">
                <CheckCircle2 size={34} />
                <strong>{notice.title}</strong>
                <span>{formatMoney(notice.amountCents)}</span>
                <p>{notice.description}</p>
              </div>
            ) : (
              <div className="empty-notice">
                <Bell size={30} />
                <strong>Nenhuma notificação</strong>
                <p>A confirmação do próximo Pix aparecerá aqui.</p>
              </div>
            )}

            <div className="notification-rule">
              <ShieldCheck size={18} />
              <span>
                O aviso só é liberado depois da validação segura do pagamento.
              </span>
            </div>
          </aside>
        </div>

        <section className="integration-strip">
          <div>
            <Wifi size={20} />
            <span>
              <strong>PagBank</strong>
              <small>Configure as credenciais no Vercel para ativar</small>
            </span>
          </div>
          <div>
            <ShieldCheck size={20} />
            <span>
              <strong>MCP protegido</strong>
              <small>Endpoint disponível em /api/mcp</small>
            </span>
          </div>
        </section>
      </section>
    </main>
  );
}
