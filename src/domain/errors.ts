export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidStateTransitionError extends DomainError {
  constructor(entity: "venda" | "pagamento", from: string, to: string) {
    super(
      `Transição inválida de ${entity}: ${from} → ${to}`,
      "INVALID_STATE_TRANSITION",
    );
  }
}

export class ProviderError extends DomainError {}
