# Arquitetura

O Notifica AI é um monólito modular Next.js/Vinext. A interface não altera
estados financeiros diretamente. Entradas HTTP e MCP chamam serviços; serviços
usam repositórios e providers.

## Fronteiras

- `src/domain`: tipos, dinheiro e máquinas de estado puras.
- `src/auth`: autorização por papel e escopo.
- `src/modules/payments`: contrato, webhook e verificação.
- `src/providers/mock`: simulador isolado.
- `src/providers/pagbank`: tradução exclusiva da API Order.
- `src/queue`: jobs, retentativas e Outbox.
- `db`: schema, índices e restrições.
- `src/mcp`: servidor, ferramentas e autorização.
- `src/ui`: experiência responsiva.

## Fluxo de confirmação

1. A venda cria referência e cobrança individual.
2. O provider devolve pedido, QR Code, código Pix e vencimento.
3. O webhook é validado, sanitizado, deduplicado e enfileirado.
4. O worker consulta o pedido diretamente no provider.
5. IDs, valor, moeda, conta, status e horário são comparados.
6. Divergências abrem conciliação.
7. Somente uma correspondência integral atualiza pagamento/venda e cria Outbox.
8. A notificação vai ao vendedor responsável e aos perfis autorizados.

## Persistência

A migration define 15 tabelas, incluindo sessões, idempotência, webhooks, fila,
tentativas de verificação, conciliação, Outbox e auditoria. Valores usam
inteiros em centavos e timestamps usam UTC.
