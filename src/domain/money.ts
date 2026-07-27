import type { Money } from "./types";

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function applyUniqueCents(original: Money, unique: number): Money {
  if (!Number.isInteger(unique) || unique < 0 || unique > 99) {
    throw new RangeError(
      "Os centavos identificadores devem estar entre 0 e 99.",
    );
  }

  return {
    currency: original.currency,
    value: Math.floor(original.value / 100) * 100 + unique,
  };
}
