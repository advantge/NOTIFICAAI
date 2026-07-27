export type DemoSaleStatus =
  | "PAID"
  | "AWAITING_PAYMENT"
  | "AMBIGUOUS"
  | "EXPIRED"
  | "REFUNDED"
  | "CANCELED";

export interface DemoSale {
  id: string;
  reference: string;
  customer: string;
  phone?: string;
  description: string;
  amount: number;
  seller: string;
  sellerId: string;
  status: DemoSaleStatus;
  createdAt: string;
  paidAt?: string;
  pixCode: string;
  expiresAt: string;
}

export const demoSales: DemoSale[] = [
  {
    id: "sale-001",
    reference: "VEN-0727-1048",
    customer: "Mariana Lopes",
    phone: "(85) 99984-2201",
    description: "iPhone 16 Pro 256 GB",
    amount: 789900,
    seller: "Ana Costa",
    sellerId: "seller-ana",
    status: "PAID",
    createdAt: "Hoje, 10:48",
    paidAt: "Hoje, 10:51",
    pixCode:
      "00020101021226830014BR.GOV.BCB.PIX2561api.pagseguro.com/pix/v2/DEMO00152040000530398654077899.005802BR5911NOTIFICA AI6009FORTALEZA62070503***6304DEMO",
    expiresAt: "Amanhã, 10:48",
  },
  {
    id: "sale-002",
    reference: "VEN-0727-1035",
    customer: "Carlos Menezes",
    description: "MacBook Air M4",
    amount: 649017,
    seller: "Rafael Lima",
    sellerId: "seller-rafael",
    status: "AWAITING_PAYMENT",
    createdAt: "Hoje, 10:35",
    pixCode:
      "00020101021226830014BR.GOV.BCB.PIX2561api.pagseguro.com/pix/v2/DEMO00252040000530398654066490.175802BR5911NOTIFICA AI6009FORTALEZA62070503***6304DEMO",
    expiresAt: "Amanhã, 10:35",
  },
  {
    id: "sale-003",
    reference: "VEN-0727-1012",
    customer: "Beatriz Albuquerque",
    description: "Apple Watch Series 10",
    amount: 329900,
    seller: "Ana Costa",
    sellerId: "seller-ana",
    status: "PAID",
    createdAt: "Hoje, 10:12",
    paidAt: "Hoje, 10:18",
    pixCode: "00020101021226830014BR.GOV.BCB.PIX5204000053039866304DEMO",
    expiresAt: "Amanhã, 10:12",
  },
  {
    id: "sale-004",
    reference: "VEN-0727-0944",
    customer: "Lucas Rocha",
    description: "AirPods Pro 2ª geração",
    amount: 189917,
    seller: "Paula Nunes",
    sellerId: "seller-paula",
    status: "AMBIGUOUS",
    createdAt: "Hoje, 09:44",
    pixCode: "00020101021226830014BR.GOV.BCB.PIX5204000053039866304DEMO",
    expiresAt: "Amanhã, 09:44",
  },
  {
    id: "sale-005",
    reference: "VEN-0727-0916",
    customer: "João Martins",
    description: "Galaxy S25 Ultra",
    amount: 719900,
    seller: "Diego Alves",
    sellerId: "seller-diego",
    status: "PAID",
    createdAt: "Hoje, 09:16",
    paidAt: "Hoje, 09:20",
    pixCode: "00020101021226830014BR.GOV.BCB.PIX5204000053039866304DEMO",
    expiresAt: "Amanhã, 09:16",
  },
  {
    id: "sale-006",
    reference: "VEN-0726-1740",
    customer: "Fernanda Moura",
    description: "iPad Air 11”",
    amount: 499900,
    seller: "Rafael Lima",
    sellerId: "seller-rafael",
    status: "EXPIRED",
    createdAt: "Ontem, 17:40",
    pixCode: "00020101021226830014BR.GOV.BCB.PIX5204000053039866304DEMO",
    expiresAt: "Hoje, 17:40",
  },
];

export const sellers = [
  { id: "seller-ana", name: "Ana Costa", sales: 23, value: 7845000, rate: 92 },
  {
    id: "seller-rafael",
    name: "Rafael Lima",
    sales: 19,
    value: 6920000,
    rate: 88,
  },
  {
    id: "seller-paula",
    name: "Paula Nunes",
    sales: 16,
    value: 5410000,
    rate: 84,
  },
  {
    id: "seller-diego",
    name: "Diego Alves",
    sales: 14,
    value: 4980000,
    rate: 81,
  },
  {
    id: "seller-julia",
    name: "Júlia Freitas",
    sales: 11,
    value: 3750000,
    rate: 76,
  },
];
