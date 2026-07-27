import type { DemoSaleStatus } from "../demo/data";

const labels: Record<DemoSaleStatus, string> = {
  PAID: "Pago",
  AWAITING_PAYMENT: "Aguardando",
  AMBIGUOUS: "Conciliação",
  EXPIRED: "Expirado",
  REFUNDED: "Estornado",
  CANCELED: "Cancelado",
};

export function StatusBadge({ status }: { status: DemoSaleStatus }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <span aria-hidden="true" className="status-dot" />
      {labels[status]}
    </span>
  );
}
