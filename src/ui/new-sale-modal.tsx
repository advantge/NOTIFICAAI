"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  Check,
  ChevronLeft,
  Clipboard,
  Clock3,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import type { DemoSale } from "../demo/data";
import { formatMoney } from "../domain/money";

interface Props {
  onClose: () => void;
  onCreated: (sale: DemoSale) => void;
  onPaid: (sale: DemoSale) => void;
}

function parseCurrency(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return Math.round(Number(normalized || 0) * 100);
}

export function NewSaleModal({ onClose, onCreated, onPaid }: Props) {
  const [step, setStep] = useState<"form" | "pix">("form");
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [uniqueCents, setUniqueCents] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sale, setSale] = useState<DemoSale | null>(null);
  const [qrCode, setQrCode] = useState("");

  const originalAmount = parseCurrency(amount);
  const finalAmount = useMemo(
    () =>
      uniqueCents && originalAmount > 0
        ? Math.floor(originalAmount / 100) * 100 + 17
        : originalAmount,
    [originalAmount, uniqueCents],
  );

  useEffect(() => {
    if (!sale) return;
    void QRCode.toDataURL(sale.pixCode, {
      width: 280,
      margin: 1,
      color: { dark: "#121417", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then(setQrCode);
  }, [sale]);

  function createSale(event: React.FormEvent) {
    event.preventDefault();
    if (!customer.trim() || !description.trim() || finalAmount < 100) return;
    const reference = `VEN-0727-${String(Date.now()).slice(-4)}`;
    const newSale: DemoSale = {
      id: crypto.randomUUID(),
      reference,
      customer: customer.trim(),
      phone: phone.trim() || undefined,
      description: description.trim(),
      amount: finalAmount,
      seller: "Ana Costa",
      sellerId: "seller-ana",
      status: "AWAITING_PAYMENT",
      createdAt: "Agora",
      expiresAt: "Amanhã, neste horário",
      pixCode: `00020101021226830014BR.GOV.BCB.PIX2561api.pagseguro.com/pix/v2/${reference}52040000530398654${(
        finalAmount / 100
      ).toFixed(2)}5802BR5911NOTIFICA AI6009FORTALEZA62070503***6304DEMO`,
    };
    setSale(newSale);
    onCreated(newSale);
    setStep("pix");
  }

  async function copyPix() {
    if (!sale) return;
    await navigator.clipboard?.writeText(sale.pixCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function sharePix() {
    if (!sale) return;
    const text = `Pix da venda ${sale.reference}\nValor: ${formatMoney(sale.amount)}\n${sale.pixCode}`;
    if (navigator.share) {
      await navigator.share({ title: "Cobrança Pix", text });
    } else {
      await navigator.clipboard?.writeText(text);
      setCopied(true);
    }
  }

  function simulatePayment() {
    if (!sale) return;
    onPaid({ ...sale, status: "PAID", paidAt: "Agora" });
    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`sale-modal ${step === "pix" ? "sale-modal-pix" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-sale-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <span className="eyebrow">
              {step === "form" ? "Nova cobrança" : "Cobrança criada"}
            </span>
            <h2 id="new-sale-title">
              {step === "form" ? "Nova venda" : "Pix pronto para enviar"}
            </h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar">
            <X size={19} />
          </button>
        </header>

        {step === "form" ? (
          <form className="sale-form" onSubmit={createSale}>
            <div className="form-grid">
              <label className="field field-wide">
                <span>Nome do cliente</span>
                <input
                  autoFocus
                  value={customer}
                  onChange={(event) => setCustomer(event.target.value)}
                  placeholder="Ex.: João Silva"
                  required
                />
              </label>
              <label className="field">
                <span>
                  Telefone <small>opcional</small>
                </span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="(85) 99999-9999"
                  inputMode="tel"
                />
              </label>
              <label className="field">
                <span>Valor</span>
                <div className="money-input">
                  <span>R$</span>
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0,00"
                    inputMode="decimal"
                    required
                  />
                </div>
              </label>
              <label className="field field-wide">
                <span>Descrição ou produto</span>
                <input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Ex.: Notebook, pedido #824"
                  required
                />
              </label>
              <label className="field field-wide">
                <span>
                  Observação <small>opcional</small>
                </span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Informação interna sobre a venda"
                  rows={2}
                />
              </label>
            </div>

            <label className="unique-cents">
              <input
                type="checkbox"
                checked={uniqueCents}
                onChange={(event) => setUniqueCents(event.target.checked)}
              />
              <span className="toggle" aria-hidden="true" />
              <span>
                <strong>Usar centavos identificadores</strong>
                <small>Adiciona .17 ao total para auxiliar a conciliação</small>
              </span>
              <Sparkles size={18} />
            </label>

            {originalAmount > 0 && (
              <div className="charge-summary" aria-live="polite">
                <div>
                  <span>Valor informado</span>
                  <strong>{formatMoney(originalAmount)}</strong>
                </div>
                {uniqueCents && (
                  <div>
                    <span>Identificador</span>
                    <strong>+ R$ 0,17</strong>
                  </div>
                )}
                <div className="charge-total">
                  <span>Total a cobrar</span>
                  <strong>{formatMoney(finalAmount)}</strong>
                </div>
              </div>
            )}

            <footer className="modal-footer">
              <button
                type="button"
                className="button secondary"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                className="button primary"
                disabled={!customer || !description || finalAmount < 100}
              >
                Gerar Pix
              </button>
            </footer>
          </form>
        ) : (
          sale && (
            <div className="pix-layout">
              <div className="qr-panel">
                <div className="qr-frame">
                  {qrCode ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrCode} alt="QR Code Pix desta venda" />
                  ) : (
                    <div className="qr-loading" aria-label="Gerando QR Code" />
                  )}
                </div>
                <div className="live-status">
                  <span className="pulse-dot" />
                  Aguardando pagamento
                </div>
              </div>

              <div className="pix-details">
                <div className="pix-value">
                  <span>Total a pagar</span>
                  <strong>{formatMoney(sale.amount)}</strong>
                  <small>
                    {sale.customer} · {sale.reference}
                  </small>
                </div>

                <div className="pix-code">
                  <span>Pix Copia e Cola</span>
                  <p>{sale.pixCode}</p>
                </div>

                <div className="button-row">
                  <button className="button primary" onClick={copyPix}>
                    {copied ? <Check size={18} /> : <Clipboard size={18} />}
                    {copied ? "Pix copiado" : "Copiar Pix"}
                  </button>
                  <button className="button secondary" onClick={sharePix}>
                    <Share2 size={18} />
                    Compartilhar
                  </button>
                </div>

                <div className="expiry-note">
                  <Clock3 size={17} />
                  Válido até {sale.expiresAt}
                </div>

                <div className="demo-simulator">
                  <div>
                    <strong>Simulador de pagamento</strong>
                    <span>Disponível apenas no ambiente de demonstração</span>
                  </div>
                  <button className="button demo" onClick={simulatePayment}>
                    Simular pagamento
                  </button>
                </div>

                <button className="back-link" onClick={() => setStep("form")}>
                  <ChevronLeft size={17} />
                  Ajustar venda
                </button>
              </div>
            </div>
          )
        )}
      </section>
    </div>
  );
}
