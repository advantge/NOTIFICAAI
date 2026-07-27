# Notifica AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar uma aplicação web responsiva e testada para criar cobranças Pix individualizadas, verificar pagamentos com segurança, notificar o vendedor correto e operar integralmente em modo demonstração.

**Architecture:** Monólito modular em Next.js App Router com serviços de domínio independentes, PostgreSQL via Drizzle, adapters de pagamento Mock e PagBank, fila persistente, padrão Outbox e autorização aplicada no servidor. Route Handlers e componentes são entradas finas; apenas serviços e repositórios alteram estado financeiro.

**Tech Stack:** Next.js, React, TypeScript strict, Tailwind CSS, shadcn/ui, Poppins, Drizzle ORM, PostgreSQL, Zod, React Hook Form, Vitest, Testing Library, Playwright, Docker e GitHub Actions.

## Global Constraints

- Todo texto de interface será em português do Brasil, valores em BRL e datas no timezone configurado da loja.
- Segredos ficam exclusivamente no backend; nenhuma variável secreta usa prefixo público.
- O webhook é somente um gatilho e nunca confirma um pagamento sem consulta autoritativa ao provider.
- Valores monetários são inteiros em centavos e datas são persistidas em UTC.
- O vendedor vê somente as próprias vendas; administrador vê a loja; gerente nunca vê credenciais.
- Mock, sandbox e produção não compartilham dados.
- A interface usa Poppins, WCAG AA, foco visível, redução de movimento e alvos de toque mínimos de 44 por 44 pixels.
- Toda mudança financeira é idempotente, transacional e auditada.
- Operações PagBank não documentadas retornam `UNSUPPORTED` ou `NOT_CONFIGURED`.
- Nenhum botão é apresentado como funcional sem possuir serviço real correspondente.

---

## Mapa de arquivos

```text
app/
  (auth)/login/page.tsx
  (auth)/recuperar-senha/page.tsx
  (app)/layout.tsx
  (app)/dashboard/page.tsx
  (app)/vendas/{nova,[id],minhas,todas}/page.tsx
  (app)/pagamentos/page.tsx
  (app)/conciliacao/page.tsx
  (app)/notificacoes/page.tsx
  (app)/vendedores/page.tsx
  (app)/relatorios/page.tsx
  (app)/integracoes/page.tsx
  (app)/configuracoes/page.tsx
  (app)/perfil/page.tsx
  (app)/auditoria/page.tsx
  (app)/saude/page.tsx
  api/{auth,sales,payments,reconciliation,reports,notifications,health}/...
  api/webhooks/pagbank/route.ts
  api/events/route.ts
  globals.css
  layout.tsx
  not-found.tsx
src/
  auth/{password,session,authorization}.ts
  db/{client,schema,seed}.ts
  domain/{money,state-machines,types,errors}.ts
  modules/
    sales/{schemas,repository,service}.ts
    payments/{provider,repository,service,verification,reconciliation}.ts
    notifications/{repository,service,realtime}.ts
    audit/{repository,service}.ts
    reports/service.ts
    integrations/health.ts
  providers/{mock,pagbank}/{provider,schemas}.ts
  queue/{jobs,worker,outbox}.ts
  security/{csrf,rate-limit,redact,headers}.ts
  mcp/{server,authorization,tools}.ts
  ui/{app-shell,status-badge,money,empty-state}.tsx
tests/{unit,integration,e2e}/...
drizzle/
public/{manifest.webmanifest,icons,payment-confirmed.mp3}
docs/{architecture,pagbank,mcp,security,runbooks}/...
```

## Task 1: Fundação do projeto e sistema visual

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `playwright.config.ts`
- Create: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`
- Create: `src/ui/status-badge.tsx`, `src/ui/money.tsx`
- Test: `tests/unit/ui/money.test.ts`

**Interfaces:**
- Produces: `formatMoney(cents: number): string`; tokens CSS; scripts `dev`, `lint`, `typecheck`, `test`, `test:e2e`, `build`.

- [ ] **Step 1: Inicializar o projeto e instalar dependências estáveis**

Execute o inicializador oficial do ambiente, preserve o lockfile e adicione
Drizzle, Zod, React Hook Form, componentes Radix, ícones Lucide, QR Code,
Vitest, Testing Library e Playwright.

- [ ] **Step 2: Escrever o teste de moeda**

```ts
import { expect, test } from "vitest";
import { formatMoney } from "@/src/ui/money";

test("formata centavos como BRL", () => {
  expect(formatMoney(450017)).toBe("R$ 4.500,17");
});
```

- [ ] **Step 3: Executar o teste e confirmar falha**

Run: `npm test -- tests/unit/ui/money.test.ts`  
Expected: FAIL porque `formatMoney` ainda não existe.

- [ ] **Step 4: Implementar tokens, Poppins e utilitários**

```ts
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
```

Definir tokens de cor, espaço, raio, sombra, z-index, foco e motion em
`app/globals.css`; carregar Poppins pelo mecanismo de fontes do framework.

- [ ] **Step 5: Validar fundação**

Run: `npm run typecheck && npm test -- tests/unit/ui/money.test.ts && npm run build`  
Expected: todos os comandos encerram com código 0.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts app src/ui tests/unit/ui
git commit -m "chore: establish Notifica AI foundation"
```

## Task 2: Domínio, dinheiro e máquinas de estado

**Files:**
- Create: `src/domain/types.ts`, `src/domain/money.ts`
- Create: `src/domain/state-machines.ts`, `src/domain/errors.ts`
- Test: `tests/unit/domain/state-machines.test.ts`, `tests/unit/domain/money.test.ts`

**Interfaces:**
- Produces: `SaleStatus`, `PaymentStatus`, `Money`, `transitionSale(current, next)`, `transitionPayment(current, next)`, `applyUniqueCents(original, unique)`.

- [ ] **Step 1: Escrever testes de transição e centavos**

```ts
test("não permite venda paga voltar a aguardando", () => {
  expect(() => transitionSale("PAID", "AWAITING_PAYMENT")).toThrow(
    InvalidStateTransitionError,
  );
});

test("expõe o total com centavos identificadores", () => {
  expect(applyUniqueCents({ currency: "BRL", value: 450000 }, 17)).toEqual({
    currency: "BRL",
    value: 450017,
  });
});
```

- [ ] **Step 2: Confirmar RED**

Run: `npm test -- tests/unit/domain`  
Expected: FAIL por módulos ausentes.

- [ ] **Step 3: Implementar tipos e transições explícitas**

```ts
export const saleTransitions: Record<SaleStatus, readonly SaleStatus[]> = {
  DRAFT: ["AWAITING_PAYMENT", "CANCELED"],
  AWAITING_PAYMENT: ["PAYMENT_DETECTED", "EXPIRED", "CANCELED"],
  PAYMENT_DETECTED: ["PAYMENT_VERIFICATION", "AMBIGUOUS"],
  PAYMENT_VERIFICATION: ["PAID", "AMBIGUOUS"],
  PAID: ["REFUNDED", "PARTIALLY_REFUNDED"],
  AMBIGUOUS: ["PAYMENT_VERIFICATION", "CANCELED"],
  EXPIRED: ["AMBIGUOUS"],
  CANCELED: ["AMBIGUOUS"],
  REFUNDED: [],
  PARTIALLY_REFUNDED: ["REFUNDED"],
};
```

- [ ] **Step 4: Validar domínio**

Run: `npm test -- tests/unit/domain && npm run typecheck`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain tests/unit/domain
git commit -m "feat: define payment domain state machines"
```

## Task 3: Banco, migrations e dados demonstrativos

**Files:**
- Create: `src/db/client.ts`, `src/db/schema.ts`, `src/db/seed.ts`
- Create: `drizzle.config.ts`, `drizzle/0000_initial.sql`
- Create: `docker-compose.yml`, `.env.example`
- Test: `tests/integration/db/schema.test.ts`

**Interfaces:**
- Produces: `db`; tabelas `stores`, `users`, `sellerProfiles`, `sessions`, `sales`, `payments`, `paymentWebhookEvents`, `webhookJobs`, `notifications`, `reconciliationCases`, `auditLogs`, `integrationSettings`, `idempotencyKeys`, `outboxEvents`, `paymentVerificationAttempts`.

- [ ] **Step 1: Escrever o teste de restrições**

```ts
test("impede dois pagamentos com o mesmo providerChargeId no ambiente", async () => {
  await insertPayment({ providerChargeId: "MOCK_1", environment: "DEMO" });
  await expect(
    insertPayment({ providerChargeId: "MOCK_1", environment: "DEMO" }),
  ).rejects.toThrow();
});
```

- [ ] **Step 2: Confirmar RED**

Run: `npm test -- tests/integration/db/schema.test.ts`  
Expected: FAIL porque schema e banco ainda não existem.

- [ ] **Step 3: Criar schema e migration**

Usar UUID, inteiros para dinheiro, timestamps UTC, enums de estado, índices por
`storeId`, `sellerId`, `status` e `createdAt`, e unicidade composta por ambiente
para IDs externos e eventos.

- [ ] **Step 4: Criar seed determinístico**

O seed cria senha de demonstração conhecida apenas no modo `DEMO`, um
administrador, um gerente, cinco vendedores e os cenários: pendente, pago,
expirado, ambíguo, valor divergente, webhook duplicado e estorno.

- [ ] **Step 5: Validar migration e seed**

Run: `npm run db:migrate && npm run db:seed && npm test -- tests/integration/db/schema.test.ts`  
Expected: migration, seed e teste passam.

- [ ] **Step 6: Commit**

```bash
git add src/db drizzle drizzle.config.ts docker-compose.yml .env.example tests/integration/db
git commit -m "feat: add persistent operational data model"
```

## Task 4: Autenticação, sessões e RBAC

**Files:**
- Create: `src/auth/password.ts`, `src/auth/session.ts`, `src/auth/authorization.ts`
- Create: `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`
- Create: `app/api/auth/recover/route.ts`
- Test: `tests/unit/auth/authorization.test.ts`, `tests/integration/auth/session.test.ts`

**Interfaces:**
- Produces: `createSession(userId, context)`, `requireSession(request)`, `revokeSession(id)`, `authorize(actor, action, resource)`.

- [ ] **Step 1: Escrever testes de isolamento**

```ts
test("vendedor não lê venda de outro vendedor", () => {
  expect(
    authorize(sellerA, "sale:read", { storeId: sellerA.storeId, sellerId: sellerB.id }),
  ).toBe(false);
});

test("gerente não lê credencial bancária", () => {
  expect(authorize(manager, "integration:read-secret", store)).toBe(false);
});
```

- [ ] **Step 2: Confirmar RED**

Run: `npm test -- tests/unit/auth tests/integration/auth`  
Expected: FAIL.

- [ ] **Step 3: Implementar sessão opaca e políticas**

Gerar token aleatório, armazenar apenas SHA-256 no banco, usar cookie
`HttpOnly`, `SameSite=Lax`, `Secure` em produção e expiração absoluta. Hash de
senha usa algoritmo resistente, salt individual e comparação de tempo
constante.

- [ ] **Step 4: Implementar login, logout e recuperação**

Validar Zod, aplicar rate limit por conta e origem, emitir mensagens não
enumeráveis e invalidar todas as sessões ao bloquear o usuário.

- [ ] **Step 5: Validar autenticação**

Run: `npm test -- tests/unit/auth tests/integration/auth && npm run typecheck`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/auth app/api/auth tests/unit/auth tests/integration/auth
git commit -m "feat: secure sessions and server-side RBAC"
```

## Task 5: Providers Mock e PagBank

**Files:**
- Create: `src/modules/payments/provider.ts`
- Create: `src/providers/mock/provider.ts`, `src/providers/mock/schemas.ts`
- Create: `src/providers/pagbank/provider.ts`, `src/providers/pagbank/schemas.ts`
- Test: `tests/unit/providers/mock.test.ts`, `tests/unit/providers/pagbank.test.ts`

**Interfaces:**
- Produces: `PaymentProvider`; `MockPaymentProvider`; `PagBankPaymentProvider`; `getPaymentProvider(env)`.

- [ ] **Step 1: Escrever testes de contrato**

```ts
test("mock cria QR Code de uso único e valor exato", async () => {
  const result = await provider.createPixCharge(input);
  expect(result.amount.value).toBe(input.amount.value);
  expect(result.pixCopyPaste).toMatch(/^000201/);
  expect(result.providerOrderId).toMatch(/^MOCK_ORDE_/);
});

test("PagBank desabilitado retorna NOT_CONFIGURED sem chamar fetch", async () => {
  await expect(provider.createPixCharge(input)).rejects.toMatchObject({
    code: "NOT_CONFIGURED",
  });
  expect(fetchSpy).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Confirmar RED**

Run: `npm test -- tests/unit/providers`  
Expected: FAIL.

- [ ] **Step 3: Implementar contrato e mock**

```ts
export interface PaymentProvider {
  createPixCharge(input: CreatePixChargeInput): Promise<CreatePixChargeResult>;
  getChargeStatus(providerChargeId: string): Promise<ChargeStatusResult>;
  cancelCharge(providerChargeId: string): Promise<CancelResult>;
  refundCharge(providerChargeId: string, amount?: Money): Promise<RefundResult>;
  parseWebhook(payload: unknown, headers: Headers): Promise<ParsedPaymentEvent>;
  verifyPayment(event: ParsedPaymentEvent): Promise<VerifiedPaymentResult>;
  healthCheck(): Promise<ProviderHealthResult>;
}
```

- [ ] **Step 4: Implementar PagBank somente com contratos oficiais**

Mapear `POST /orders`, `GET /orders/{order_id}`, `reference_id`, `qr_codes`,
`notification_urls`, `x-idempotency-key`, links de QR Code e status `PAID`.
Cancelamento e estorno retornam `UNSUPPORTED` até confirmação documental.

- [ ] **Step 5: Validar providers**

Run: `npm test -- tests/unit/providers && npm run typecheck`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/payments/provider.ts src/providers tests/unit/providers
git commit -m "feat: add mock and PagBank payment adapters"
```

## Task 6: Serviços de venda, pagamento e auditoria

**Files:**
- Create: `src/modules/sales/schemas.ts`, `src/modules/sales/repository.ts`, `src/modules/sales/service.ts`
- Create: `src/modules/payments/repository.ts`, `src/modules/payments/service.ts`
- Create: `src/modules/audit/repository.ts`, `src/modules/audit/service.ts`
- Test: `tests/integration/sales/create-sale.test.ts`

**Interfaces:**
- Produces: `SaleService.createPixSale(actor, input, idempotencyKey)`; `PaymentService.cancelPending(actor, saleId)`; `AuditService.record(entry)`.

- [ ] **Step 1: Escrever o teste do fluxo inicial**

```ts
test("vendedor cria venda vinculada a si e recebe cobrança", async () => {
  const result = await saleService.createPixSale(seller, input, "idem-1");
  expect(result.sale.sellerId).toBe(seller.id);
  expect(result.sale.status).toBe("AWAITING_PAYMENT");
  expect(result.payment.status).toBe("WAITING");
  expect(result.payment.pixCopyPaste).toMatch(/^000201/);
});
```

- [ ] **Step 2: Confirmar RED**

Run: `npm test -- tests/integration/sales/create-sale.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implementar criação transacional e idempotente**

Validar dados, determinar vendedor pela sessão, gerar referência interna,
aplicar centavos somente com consentimento explícito, criar cobrança e
persistir venda, pagamento e auditoria.

- [ ] **Step 4: Implementar consultas com escopo**

`listSales(actor, filters)` sempre deriva `storeId` da sessão; para vendedor,
força `sellerId=actor.id` e ignora tentativas de ampliá-lo.

- [ ] **Step 5: Validar serviços**

Run: `npm test -- tests/integration/sales && npm run typecheck`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/sales src/modules/payments src/modules/audit tests/integration/sales
git commit -m "feat: create scoped Pix sales"
```

## Task 7: Webhook, verificação, fila e conciliação

**Files:**
- Create: `app/api/webhooks/pagbank/route.ts`
- Create: `src/queue/jobs.ts`, `src/queue/worker.ts`, `src/queue/outbox.ts`
- Create: `src/modules/payments/verification.ts`, `src/modules/payments/reconciliation.ts`
- Create: `src/security/redact.ts`, `src/security/rate-limit.ts`
- Test: `tests/integration/payments/webhook.test.ts`, `tests/unit/queue/backoff.test.ts`

**Interfaces:**
- Produces: `receiveWebhook(request)`; `processWebhookJob(jobId)`; `verifyPayment(event)`; `openReconciliationCase(reason, context)`.

- [ ] **Step 1: Escrever testes de confirmação e duplicidade**

```ts
test("webhook PAID só confirma após consulta autoritativa", async () => {
  provider.verifyPayment.mockResolvedValue(verifiedPaid);
  await receiveAndDrain(webhookPaid);
  expect(provider.verifyPayment).toHaveBeenCalledOnce();
  expect(await getSale(sale.id)).toMatchObject({ status: "PAID" });
});

test("webhook duplicado não duplica notificação", async () => {
  await receiveAndDrain(webhookPaid);
  await receiveAndDrain(webhookPaid);
  expect(await countNotifications(payment.id)).toBe(1);
});
```

- [ ] **Step 2: Confirmar RED**

Run: `npm test -- tests/integration/payments/webhook.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implementar recepção rápida e sanitizada**

Rejeitar corpo acima do limite e Content-Type incorreto, calcular hash,
deduplicar, persistir payload sanitizado e job, responder `202`.

- [ ] **Step 4: Implementar verificação transacional**

Comparar IDs, referência, status, valor, moeda, conta e horário. Em sucesso,
atualizar pagamento e venda, registrar tentativa, auditoria, notificação e
Outbox na mesma transação. Em divergência, abrir conciliação.

- [ ] **Step 5: Implementar backoff e dead-letter**

```ts
export function retryDelayMs(attempt: number, jitter = 0): number {
  return Math.min(60_000, 1_000 * 2 ** (attempt - 1)) + jitter;
}
```

Após cinco falhas, mover para `DEAD_LETTER` e criar alerta de integração.

- [ ] **Step 6: Validar todos os cenários**

Run: `npm test -- tests/integration/payments tests/unit/queue`  
Expected: correto, duplicado, divergente, parcial, expirado e API indisponível passam.

- [ ] **Step 7: Commit**

```bash
git add app/api/webhooks src/queue src/modules/payments src/security tests/integration/payments tests/unit/queue
git commit -m "feat: verify and reconcile idempotent webhooks"
```

## Task 8: Tempo real e central de notificações

**Files:**
- Create: `src/modules/notifications/repository.ts`, `src/modules/notifications/service.ts`, `src/modules/notifications/realtime.ts`
- Create: `app/api/events/route.ts`, `app/api/notifications/route.ts`
- Create: `src/ui/payment-alert.tsx`, `public/payment-confirmed.mp3`
- Test: `tests/integration/notifications/delivery.test.ts`

**Interfaces:**
- Produces: `NotificationService.publishOutbox()`; stream SSE autenticado; `markNotificationRead`.

- [ ] **Step 1: Escrever teste de destinatário**

```ts
test("confirmação chega somente ao vendedor responsável e admins autorizados", async () => {
  await notificationService.publishOutbox();
  expect(eventsFor(sellerOwner)).toHaveLength(1);
  expect(eventsFor(otherSeller)).toHaveLength(0);
  expect(eventsFor(admin)).toHaveLength(1);
});
```

- [ ] **Step 2: Confirmar RED**

Run: `npm test -- tests/integration/notifications/delivery.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implementar Outbox e SSE**

Autenticar cada conexão, filtrar por `userId`, enviar heartbeat e cursor de
reconexão. Marcar Outbox entregue somente após publicação.

- [ ] **Step 4: Implementar alerta acessível**

Exibir toast, modal discreto, badge e som uma vez por `notification.id`; respeitar
`prefers-reduced-motion` e preferência de som.

- [ ] **Step 5: Validar notificações**

Run: `npm test -- tests/integration/notifications && npm run typecheck`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/notifications app/api/events app/api/notifications src/ui/payment-alert.tsx public/payment-confirmed.mp3 tests/integration/notifications
git commit -m "feat: deliver scoped realtime payment alerts"
```

## Task 9: Autenticação visual, shell responsivo e navegação

**Files:**
- Create: `app/(auth)/login/page.tsx`, `app/(auth)/recuperar-senha/page.tsx`
- Create: `app/(app)/layout.tsx`, `src/ui/app-shell.tsx`, `src/ui/command-menu.tsx`
- Create: `app/not-found.tsx`, `app/forbidden.tsx`, `app/error.tsx`
- Test: `tests/unit/ui/app-shell.test.tsx`

**Interfaces:**
- Consumes: sessão e autorização da Task 4.
- Produces: shell desktop/mobile, menu filtrado por papel, selo de demonstração.

- [ ] **Step 1: Escrever teste do menu por papel**

```tsx
test("vendedor não recebe links administrativos", () => {
  render(<AppShell actor={seller}>{children}</AppShell>);
  expect(screen.queryByText("Auditoria")).not.toBeInTheDocument();
  expect(screen.getByText("Minhas vendas")).toBeInTheDocument();
});
```

- [ ] **Step 2: Confirmar RED**

Run: `npm test -- tests/unit/ui/app-shell.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implementar login e recuperação**

Formulários com React Hook Form + Zod, mensagens úteis, loading, foco de erro e
credenciais demonstrativas exibidas somente em `DEMO`.

- [ ] **Step 4: Implementar shell**

Sidebar recolhível no desktop, navegação inferior mobile, botão “Nova venda”,
sino, busca global, indicador SSE e selo “Ambiente de demonstração”.

- [ ] **Step 5: Validar acessibilidade**

Run: `npm test -- tests/unit/ui/app-shell.test.tsx && npm run typecheck`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app src/ui tests/unit/ui/app-shell.test.tsx
git commit -m "feat: add responsive role-aware application shell"
```

## Task 10: Fluxo visual de vendas e pagamentos

**Files:**
- Create: `app/(app)/vendas/nova/page.tsx`, `app/(app)/vendas/[id]/page.tsx`
- Create: `app/(app)/vendas/minhas/page.tsx`, `app/(app)/vendas/todas/page.tsx`
- Create: `app/(app)/pagamentos/page.tsx`
- Create: `app/api/sales/route.ts`, `app/api/sales/[id]/route.ts`
- Create: `src/ui/sale-form.tsx`, `src/ui/pix-charge-card.tsx`, `src/ui/sales-table.tsx`
- Test: `tests/e2e/seller-payment-flow.spec.ts`

**Interfaces:**
- Consumes: `SaleService`, provider e SSE.
- Produces: criação em até cinco campos, QR Code, cópia, compartilhamento, status em tempo real.

- [ ] **Step 1: Escrever E2E do fluxo crítico**

```ts
test("vendedor cria venda e recebe confirmação mock", async ({ page }) => {
  await loginAs(page, "vendedor1@demo.local");
  await page.getByRole("link", { name: "Nova venda" }).click();
  await page.getByLabel("Nome do cliente").fill("João Silva");
  await page.getByLabel("Descrição").fill("Notebook");
  await page.getByLabel("Valor").fill("4500,00");
  await page.getByRole("button", { name: "Gerar Pix" }).click();
  await expect(page.getByText("Aguardando pagamento")).toBeVisible();
  await page.getByRole("button", { name: "Simular pagamento" }).click();
  await expect(page.getByText("Pix confirmado")).toBeVisible();
});
```

- [ ] **Step 2: Confirmar RED**

Run: `npm run test:e2e -- tests/e2e/seller-payment-flow.spec.ts`  
Expected: FAIL porque as páginas ainda não existem.

- [ ] **Step 3: Implementar formulário e cobrança**

Campos cliente, telefone, descrição, valor e observação; vendedor derivado da
sessão; opção explícita de centavos; resumo do total antes de enviar.

- [ ] **Step 4: Implementar detalhe e listas**

QR Code legível, Pix Copia e Cola, copiar, compartilhar, vencimento, valor,
vendedor, timeline, cancelamento permitido e simuladores visíveis apenas em DEMO.

- [ ] **Step 5: Validar fluxo e isolamento**

Run: `npm run test:e2e -- tests/e2e/seller-payment-flow.spec.ts tests/e2e/seller-isolation.spec.ts`  
Expected: ambos passam.

- [ ] **Step 6: Commit**

```bash
git add app/(app)/vendas app/(app)/pagamentos app/api/sales src/ui tests/e2e
git commit -m "feat: complete seller Pix workflow"
```

## Task 11: Dashboards, conciliação e operação

**Files:**
- Create: `app/(app)/dashboard/page.tsx`, `app/(app)/conciliacao/page.tsx`
- Create: `app/(app)/notificacoes/page.tsx`, `app/(app)/vendedores/page.tsx`
- Create: `app/(app)/auditoria/page.tsx`, `app/(app)/saude/page.tsx`
- Create: `app/api/reconciliation/route.ts`, `app/api/health/route.ts`
- Test: `tests/e2e/admin-operations.spec.ts`

**Interfaces:**
- Produces: dashboards por papel, fila de conciliação e saúde operacional.

- [ ] **Step 1: Escrever E2E administrativo**

```ts
test("admin resolve divergência com auditoria", async ({ page }) => {
  await loginAs(page, "admin@demo.local");
  await page.getByRole("link", { name: "Conciliação" }).click();
  await page.getByRole("button", { name: "Solicitar nova verificação" }).click();
  await expect(page.getByText("Verificação agendada")).toBeVisible();
});
```

- [ ] **Step 2: Confirmar RED**

Run: `npm run test:e2e -- tests/e2e/admin-operations.spec.ts`  
Expected: FAIL.

- [ ] **Step 3: Implementar dashboards**

Vendedor: nova venda, aguardando, pagos hoje, total, últimas vendas e conexão.
Admin: recebido, pendentes, pagas, conciliação, ticket, ranking, pagamentos e
saúde.

- [ ] **Step 4: Implementar operação**

Conciliação com motivo, valores, pagador, horário, candidatos, confiança,
tentativas e ações autorizadas; central de notificações; vendedores; auditoria;
saúde com teste de conexão e webhook simulado.

- [ ] **Step 5: Validar operação**

Run: `npm run test:e2e -- tests/e2e/admin-operations.spec.ts && npm run typecheck`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/(app) app/api/reconciliation app/api/health tests/e2e/admin-operations.spec.ts
git commit -m "feat: add operational dashboards and reconciliation"
```

## Task 12: Relatórios, configurações e PWA

**Files:**
- Create: `src/modules/reports/service.ts`, `app/api/reports/route.ts`
- Create: `app/(app)/relatorios/page.tsx`, `app/(app)/configuracoes/page.tsx`
- Create: `app/(app)/integracoes/page.tsx`, `app/(app)/perfil/page.tsx`
- Create: `public/manifest.webmanifest`, `app/sw.ts`
- Test: `tests/integration/reports/report.test.ts`, `tests/e2e/settings.spec.ts`

**Interfaces:**
- Produces: `ReportService.summary(actor, filters)`, `ReportService.exportCsv(actor, filters)`, preferências de notificação.

- [ ] **Step 1: Escrever teste de relatório sanitizado**

```ts
test("CSV não exporta CPF, token ou Pix Copia e Cola", async () => {
  const csv = await reportService.exportCsv(admin, filters);
  expect(csv).not.toContain("payerDocument");
  expect(csv).not.toContain("pixCopyPaste");
  expect(csv).not.toContain("accessToken");
});
```

- [ ] **Step 2: Confirmar RED**

Run: `npm test -- tests/integration/reports/report.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implementar métricas e filtros**

Hoje, ontem, 7/30 dias, intervalo, vendedor, status e valor; criadas, pagas,
expiradas, tempo médio, total, ticket, conversão, conciliação, cancelamentos e
estornos.

- [ ] **Step 4: Implementar configurações e PWA**

Som, navegador, apenas software, gerente, volume e horário silencioso; manifest,
ícones e service worker para cache seguro e Web Push quando autorizado.

- [ ] **Step 5: Validar**

Run: `npm test -- tests/integration/reports && npm run test:e2e -- tests/e2e/settings.spec.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/reports app/api/reports app/(app)/relatorios app/(app)/configuracoes app/(app)/integracoes app/(app)/perfil public/manifest.webmanifest app/sw.ts tests
git commit -m "feat: add reports settings and installable PWA"
```

## Task 13: Servidor MCP protegido

**Files:**
- Create: `src/mcp/server.ts`, `src/mcp/authorization.ts`, `src/mcp/tools.ts`
- Create: `scripts/mcp.ts`
- Test: `tests/integration/mcp/tools.test.ts`

**Interfaces:**
- Produces: ferramentas MCP solicitadas, todas chamando serviços internos.

- [ ] **Step 1: Escrever testes de autenticação e autorização**

```ts
test("rejeita MCP sem token", async () => {
  await expect(callTool("list_pending_sales", {}, undefined)).rejects.toMatchObject({
    code: "UNAUTHORIZED",
  });
});

test("vendedor não concilia manualmente", async () => {
  await expect(
    callTool("manually_reconcile_payment", args, sellerToken),
  ).rejects.toMatchObject({ code: "FORBIDDEN" });
});
```

- [ ] **Step 2: Confirmar RED**

Run: `npm test -- tests/integration/mcp/tools.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implementar servidor e autorização**

Validar `MCP_ENABLED`, autenticar token por comparação de tempo constante,
resolver ator e loja, autorizar cada ferramenta e auditar chamadas sensíveis.

- [ ] **Step 4: Implementar ferramentas**

Registrar exatamente: `create_pix_sale`, `get_sale`,
`get_sale_payment_status`, `list_pending_sales`, `list_paid_sales`,
`list_ambiguous_payments`, `get_payment_details`,
`retry_payment_verification`, `manually_reconcile_payment`, `list_sellers`,
`get_seller_performance`, `get_daily_sales_summary` e
`get_integration_health`.

- [ ] **Step 5: Validar MCP**

Run: `npm test -- tests/integration/mcp && npm run typecheck`  
Expected: autorizado, não autorizado e proibido passam.

- [ ] **Step 6: Commit**

```bash
git add src/mcp scripts/mcp.ts tests/integration/mcp
git commit -m "feat: expose authorized audited MCP tools"
```

## Task 14: Segurança, documentação e CI

**Files:**
- Create: `src/security/csrf.ts`, `src/security/headers.ts`
- Create: `.github/workflows/ci.yml`, `Dockerfile`
- Create: `README.md`
- Create: `docs/architecture/README.md`, `docs/pagbank/README.md`
- Create: `docs/mcp/README.md`, `docs/security/README.md`
- Create: `docs/runbooks/payment-incident.md`
- Create: `docs/examples/pagbank-webhook.sanitized.json`
- Create: `docs/http/notifica-ai.http`
- Test: `tests/integration/security/endpoints.test.ts`

**Interfaces:**
- Produces: headers, CSRF, documentação operacional e pipeline.

- [ ] **Step 1: Escrever testes de segurança**

```ts
test("mutações com cookie rejeitam origem inválida", async () => {
  const response = await request("/api/sales", {
    method: "POST",
    headers: { origin: "https://evil.example" },
  });
  expect(response.status).toBe(403);
});

test("webhook rejeita corpo acima do limite", async () => {
  const response = await sendOversizedWebhook();
  expect(response.status).toBe(413);
});
```

- [ ] **Step 2: Confirmar RED**

Run: `npm test -- tests/integration/security/endpoints.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implementar proteções**

Aplicar CSP, HSTS em produção, `nosniff`, frame-ancestors, referrer policy,
checagem de origem/CSRF, limites, redaction, cookies seguros e mensagens sem
enumeração.

- [ ] **Step 4: Escrever documentação completa**

Documentar instalação, Docker, banco, migrations, seed, mock, variáveis,
PagBank, webhook, MCP, testes, publicação, troca de ambiente, segurança,
retenção, backup, troubleshooting e resposta a incidentes.

- [ ] **Step 5: Configurar CI**

Pipeline instala pelo lockfile e executa `lint`, `typecheck`, testes, E2E e
build, com PostgreSQL efêmero e sem segredos reais.

- [ ] **Step 6: Validar segurança e documentação**

Run: `npm test -- tests/integration/security && npm run lint && npm run typecheck`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/security .github Dockerfile README.md docs tests/integration/security
git commit -m "docs: secure and document production operations"
```

## Task 15: Verificação final e publicação

**Files:**
- Modify: apenas arquivos necessários para corrigir falhas encontradas.
- Verify: aplicação completa e artefato de produção.

**Interfaces:**
- Produces: build reproduzível e implantação privada validada.

- [ ] **Step 1: Executar qualidade estática**

Run: `npm run lint && npm run typecheck && npm run format:check`  
Expected: código 0 em todos.

- [ ] **Step 2: Executar suíte de testes**

Run: `npm test -- --run`  
Expected: todos os testes unitários e de integração passam.

- [ ] **Step 3: Executar E2E**

Run: `npm run test:e2e`  
Expected: fluxos do vendedor, isolamento, divergência, administrador e MCP passam.

- [ ] **Step 4: Gerar build**

Run: `npm run build`  
Expected: build de produção conclui sem erro.

- [ ] **Step 5: Fazer inspeção funcional**

Validar login, venda, QR Code, cópia, simulação, confirmação, alerta único,
escopo por usuário, conciliação, relatórios, saúde e responsividade a 320 px.

- [ ] **Step 6: Publicar a fonte validada**

Salvar uma versão com o exato estado construído, implantar com acesso privado e
aguardar o estado final de sucesso.

- [ ] **Step 7: Registrar resultados**

Documentar contagens e resultados de lint, typecheck, testes, E2E e build; listar
variáveis PagBank/MCP e dependências externas de homologação.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: verify Notifica AI production release"
```

