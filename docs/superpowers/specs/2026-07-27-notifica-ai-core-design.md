# Notifica AI — Especificação de arquitetura e produto

**Data:** 27 de julho de 2026  
**Status:** aprovado para planejamento  
**Idioma e localidade:** português do Brasil, BRL, timezone configurável por loja  

## 1. Objetivo

Construir uma aplicação web segura para que vendedores gerem cobranças Pix
individuais vinculadas à mesma conta PagBank da loja e recebam a confirmação do
pagamento correto sem depender de aviso manual do proprietário.

O sistema será entregue incrementalmente. O primeiro ciclo implementa um núcleo
operacional vertical completo e testável. Os ciclos seguintes ampliam
administração, relatórios, PWA, observabilidade e MCP sem alterar as fronteiras
centrais do domínio.

## 2. Escopo do primeiro ciclo

O primeiro ciclo inclui:

- autenticação, sessões revogáveis e recuperação de senha;
- perfis administrador, gerente e vendedor;
- isolamento por loja e por vendedor;
- criação e consulta de vendas;
- cobrança Pix pelo provedor mock;
- adapter PagBank implementado em estado “aguardando configuração”;
- QR Code, Pix Copia e Cola, vencimento, cópia e compartilhamento;
- webhook idempotente e processamento assíncrono;
- consulta autoritativa ao provedor antes da confirmação;
- máquinas de estado de venda e pagamento;
- conciliação de divergências;
- notificações em tempo real, toast, alerta visual e som único;
- dashboard operacional por perfil;
- vendedores, integrações, saúde e auditoria;
- páginas 403, 404, erro e indisponibilidade;
- dados demonstrativos e simuladores mock;
- documentação, migrations, seed, Docker e CI;
- testes unitários, integração e E2E dos fluxos críticos.

O primeiro ciclo não expõe como funcionais recursos que ainda não tenham
serviço real. Não haverá botões decorativos ou confirmações simuladas fora do
ambiente de demonstração.

## 3. Ciclos posteriores

Os ciclos seguintes serão implementados sobre o mesmo núcleo, nesta ordem:

1. relatórios completos, filtros avançados e exportação CSV sanitizada;
2. administração avançada de usuários, permissões e preferências;
3. PWA, Web Push, instalação e horário silencioso;
4. cancelamentos e estornos conforme suporte confirmado da API oficial;
5. observabilidade ampliada, backups e runbooks operacionais;
6. servidor MCP autenticado, autorizado e auditado;
7. acabamento das telas e fluxos administrativos restantes.

Cada ciclo deve terminar com lint, typecheck, testes pertinentes e build
aprovados.

## 4. Arquitetura

A aplicação será um monólito modular em Next.js com App Router e TypeScript
strict. A escolha reduz a complexidade operacional sem concentrar regras de
negócio em componentes, Server Actions ou Route Handlers.

### 4.1 Camadas

- **Interface:** React, Tailwind CSS, shadcn/ui, React Hook Form, Zod e Poppins.
- **Aplicação:** casos de uso e orquestração de serviços.
- **Domínio:** entidades, políticas, permissões e máquinas de estado.
- **Infraestrutura:** PostgreSQL, Drizzle ORM, providers, filas e transporte de
  notificações.
- **Entradas:** páginas, Route Handlers, webhook e, posteriormente, MCP.

As entradas chamam serviços internos. Somente repositórios podem persistir
dados. Componentes React nunca têm autoridade financeira.

### 4.2 Módulos

- Authentication
- Users
- Stores
- Sellers
- Sales
- Payments
- Payment Providers
- PagBank
- Mock Payments
- Webhooks
- Reconciliation
- Realtime Notifications
- Reports
- Audit Logs
- Settings
- Integration Health
- MCP Server

O módulo MCP será adicionado em ciclo posterior e só poderá invocar serviços da
aplicação.

### 4.3 Serviços

- `SaleService`
- `PaymentService`
- `PaymentVerificationService`
- `PaymentReconciliationService`
- `NotificationService`
- `AuditService`
- `ReportService`
- `PagBankService`
- `MCPAuthorizationService`

Cada serviço terá uma responsabilidade explícita, dependências injetadas e
testes próprios.

## 5. Contrato de provedor de pagamento

O domínio usa uma interface genérica:

```ts
interface PaymentProvider {
  createPixCharge(
    input: CreatePixChargeInput,
  ): Promise<CreatePixChargeResult>;
  getChargeStatus(providerChargeId: string): Promise<ChargeStatusResult>;
  cancelCharge(providerChargeId: string): Promise<CancelResult>;
  refundCharge(
    providerChargeId: string,
    amount?: Money,
  ): Promise<RefundResult>;
  parseWebhook(
    payload: unknown,
    headers: Headers,
  ): Promise<ParsedPaymentEvent>;
  verifyPayment(
    event: ParsedPaymentEvent,
  ): Promise<VerifiedPaymentResult>;
  healthCheck(): Promise<ProviderHealthResult>;
}
```

Serão fornecidas duas implementações:

- `MockPaymentProvider`, totalmente funcional e isolado de produção;
- `PagBankPaymentProvider`, que usa somente contratos confirmados na
  documentação oficial.

Operações ainda não confirmadas ou habilitadas no PagBank retornam um resultado
tipado `UNSUPPORTED` ou `NOT_CONFIGURED`; elas nunca são simuladas em produção.

## 6. Integração PagBank

A integração usará a API Order do PagBank:

- criação de pedido com QR Code Pix em `POST /orders`;
- consulta do pedido em `GET /orders/{order_id}`;
- autenticação `Bearer` exclusivamente no backend;
- `x-idempotency-key` na criação;
- `notification_urls` para receber mudanças do pedido;
- `reference_id` interno único e persistido.

O QR Code é de uso único e o pedido suporta um QR Code. O valor é enviado em
centavos. A validade padrão documentada é 24 horas quando não informada, mas a
aplicação sempre persistirá o vencimento efetivo retornado ou configurado.

O webhook da API Order possui, por padrão, o mesmo formato do retorno síncrono.
A documentação consultada não garante assinatura criptográfica do webhook da
API Order. Portanto, o webhook é apenas um sinal: o backend localiza o pedido e
consulta diretamente a API PagBank antes de confirmar qualquer valor.

As URLs-base, payloads e campos serão mantidos no adapter e validados por
schemas. Nenhum contrato bancário será inferido.

Referências oficiais:

- <https://developer.pagbank.com.br/reference/criar-pedido-pedido-com-qr-code>
- <https://developer.pagbank.com.br/reference/criar-pedido>
- <https://developer.pagbank.com.br/reference/consultar-pedido>
- <https://developer.pagbank.com.br/reference/webhooks>

## 7. Fluxo financeiro

1. O vendedor autenticado envia cliente, descrição, valor e observação.
2. `SaleService` valida permissão, loja e dados.
3. O sistema gera `internalReference` e chave de idempotência.
4. A venda e a tentativa de cobrança são criadas.
5. `PaymentProvider.createPixCharge` cria a cobrança.
6. IDs, código Pix, imagem, valor e vencimento são persistidos.
7. A venda transiciona para `AWAITING_PAYMENT`.
8. O webhook é recebido, limitado, validado, sanitizado e deduplicado.
9. A resposta HTTP é rápida; o processamento segue em fila persistente.
10. O worker consulta diretamente o provedor.
11. IDs, referência, status, valor, moeda, recebedor e horário são comparados.
12. Se tudo conferir, uma transação atualiza pagamento e venda, cria auditoria,
    notificação e evento Outbox.
13. O evento Outbox publica apenas para o vendedor responsável e perfis
    autorizados.
14. Divergências abrem um caso de conciliação e não liberam a venda.

## 8. Dados

O modelo inclui as entidades definidas no briefing:

- `Store`
- `User`
- `SellerProfile`
- `Sale`
- `Payment`
- `PaymentWebhookEvent`
- `Notification`
- `ReconciliationCase`
- `AuditLog`
- `IntegrationSettings`

Também inclui:

- `Session` para sessões revogáveis e expiração;
- `PasswordResetToken` armazenado como hash e com uso único;
- `WebhookJob` para fila, retentativas e dead-letter;
- `IdempotencyKey` para operações repetíveis;
- `OutboxEvent` para entrega confiável de notificações;
- `PaymentVerificationAttempt` para histórico de verificação;
- `StoreEnvironment` para separar `DEMO`, `SANDBOX` e `PRODUCTION`.

Valores monetários são inteiros em centavos. Datas são armazenadas em UTC e
exibidas no timezone da loja. Documentos e IPs são mascarados antes da
persistência quando o valor completo não for indispensável.

Tokens e segredos não são armazenados em texto puro. No primeiro ciclo, vêm de
variáveis de ambiente. Uma futura configuração persistida deverá usar
criptografia autenticada com chave mestra externa ao banco.

## 9. Estados e transições

### 9.1 Venda

`DRAFT`, `AWAITING_PAYMENT`, `PAYMENT_DETECTED`,
`PAYMENT_VERIFICATION`, `PAID`, `AMBIGUOUS`, `EXPIRED`, `CANCELED`,
`REFUNDED`, `PARTIALLY_REFUNDED`.

### 9.2 Pagamento

`CREATED`, `WAITING`, `PAID`, `DECLINED`, `CANCELED`, `EXPIRED`, `REFUNDED`,
`PARTIALLY_REFUNDED`, `VERIFICATION_FAILED`.

As transições ficam em funções de domínio puras. Regras principais:

- `PAID` não retorna a um estado anterior;
- `CANCELED` só pode ser associado a pagamento posterior por conciliação
  administrativa explícita;
- pagamento parcial ou divergente não libera a venda;
- eventos duplicados não criam segunda atualização ou notificação;
- reembolso atualiza pagamento, venda, relatório e auditoria na mesma
  operação lógica;
- transições inválidas geram erro tipado e não alteram o banco.

## 10. Autorização

O RBAC é aplicado no backend e combinado com escopo de recurso.

### Administrador

Enxerga toda a loja, administra usuários, integrações, conciliação, saúde e
auditoria. Operações financeiras sensíveis exigem reautenticação ou confirmação
explícita.

### Gerente

Enxerga operações da loja, vendedores, relatórios operacionais e conciliações
permitidas. Nunca acessa segredos bancários.

### Vendedor

Cria e enxerga apenas as próprias vendas e notificações. Não pode confirmar
pagamentos manualmente, acessar credenciais nem consultar vendas alheias.

Toda consulta carrega `storeId`; recursos de vendedor carregam também
`sellerId`. Identificadores enviados pelo cliente nunca substituem o contexto
da sessão.

## 11. Webhook e processamento assíncrono

`POST /api/webhooks/pagbank`:

- aceita somente HTTPS em produção;
- limita o corpo antes de parsear;
- exige `application/json`;
- aplica rate limiting;
- calcula hash do corpo;
- persiste payload sanitizado;
- deduplica por ID oficial quando disponível e por composição segura quando
  necessário;
- responde rapidamente após enfileirar;
- não registra headers de autorização ou segredos.

`WebhookJob` registra tentativas, próxima execução, erro sanitizado e estado.
Retentativas usam backoff exponencial com jitter e limite explícito. Após o
limite, o job vai para a dead-letter queue e cria alerta operacional.

## 12. Conciliação

Um caso é aberto para:

- valor ou moeda divergente;
- pedido ou cobrança não localizado;
- status do webhook divergente da consulta;
- pagamento parcial, duplicado ou após vencimento;
- múltiplas vendas candidatas;
- pagador não identificável quando necessário;
- indisponibilidade persistente do provedor;
- falhas repetidas de verificação.

Somente administrador e gerente autorizado podem resolver casos. Toda resolução
exige motivo, gera auditoria e nunca apaga o evento original.

## 13. Notificações

A primeira entrega usa Server-Sent Events para atualizar a sessão ativa. Cada
conexão é autenticada e recebe apenas eventos autorizados.

Uma confirmação válida:

- atualiza a tela automaticamente;
- exibe toast verde;
- mostra alerta visual discreto;
- toca um som curto uma única vez;
- incrementa a central de notificações;
- informa valor, cliente e horário;
- oferece acesso ao detalhe da venda.

O padrão Outbox impede perda de alertas após a transação financeira. A interface
refaz a sincronização ao reconectar.

## 14. Experiência e design

A interface usa Poppins, alto contraste, espaço em branco, bordas discretas e
sombras suaves. A cor principal é grafite com ação em azul profundo; verde,
âmbar, laranja, vermelho e cinza representam estados financeiros.

Desktop usa sidebar recolhível e topbar. Mobile usa navegação inferior e ação
“Nova venda” destacada. O fluxo de cobrança será operável com uma mão e terá
alvos de toque mínimos de 44 por 44 pixels.

Telas do primeiro ciclo:

1. Login
2. Recuperação de senha
3. Dashboard por perfil
4. Nova venda
5. Detalhe da venda
6. Minhas vendas
7. Todas as vendas
8. Pagamentos
9. Conciliação
10. Central de notificações
11. Vendedores
12. Integrações
13. Perfil
14. Logs de auditoria
15. Saúde do sistema
16. Página 403
17. Página 404
18. Estados de erro e indisponibilidade

Estados vazios, skeletons, mensagens de erro acionáveis e confirmações de ações
sensíveis são parte das telas, não itens posteriores de acabamento.

## 15. Modo demonstração

`PAYMENT_PROVIDER=mock` ativa um ambiente completamente isolado e identificado
por selo “Ambiente de demonstração”.

O seed cria um administrador, um gerente, cinco vendedores e exemplos de
pagamento pendente, pago, expirado, ambíguo, divergente, duplicado e estornado.

O mock permite criar cobrança, gerar QR Code e código Pix fictícios, simular
pagamento correto, divergência, duplicidade, expiração, falha da API e estorno.
Essas ações passam pelos mesmos serviços, filas, regras e auditoria usados pelo
adapter real.

## 16. Segurança

- segredos apenas no backend;
- cookies `HttpOnly`, `Secure` em produção e `SameSite=Lax` ou mais restritivo;
- sessões revogáveis e com expiração;
- hash forte e salt individual para senhas;
- proteção contra força bruta;
- validação Zod em todas as entradas;
- proteção CSRF nas mutações baseadas em cookie;
- rate limits por rota, usuário e origem quando aplicável;
- headers de segurança e CSP;
- consultas sempre filtradas por escopo;
- transações para operações financeiras;
- logs estruturados com redaction;
- retenção limitada de payloads e dados pessoais;
- separação de demonstração, sandbox e produção;
- auditoria de ações sensíveis;
- princípio do menor privilégio.

## 17. Observabilidade

Logs estruturados e métricas cobrem:

- cobranças criadas;
- webhooks recebidos e duplicados;
- latência e resultado do processamento;
- verificações e retentativas;
- erros do provedor;
- notificações entregues;
- casos de conciliação;
- última comunicação bem-sucedida.

A tela de saúde mostra ambiente, estado do provider, últimas chamadas e
webhooks, latência, erros recentes e ações seguras de teste.

## 18. Testes e critérios de qualidade

### Unitários

- máquinas de estado;
- cálculo e apresentação de centavos identificadores;
- políticas RBAC;
- sanitização e mascaramento;
- parsing e comparação de verificação;
- idempotência e backoff.

### Integração

- login e sessão;
- criação de venda e cobrança;
- webhook correto e duplicado;
- valor/moeda divergente;
- pagamento parcial e expirado;
- cancelamento e estorno mock;
- retentativa e dead-letter;
- conciliação;
- Outbox e notificação;
- isolamento entre vendedores;
- proteção dos endpoints.

### E2E

1. vendedor cria venda, copia Pix, mock envia webhook, backend verifica, venda
   vira paga e apenas o vendedor correto recebe o alerta;
2. dois vendedores criam vendas com mesmo valor, cada uma recebe referência
   distinta, um pagamento ocorre e somente o responsável é notificado;
3. vendedor tenta abrir venda de outro vendedor e recebe 403 sem vazamento de
   dados;
4. pagamento divergente permanece bloqueado e aparece na conciliação.

Antes de declarar cada ciclo concluído serão executados lint, formatação,
typecheck, testes unitários, testes de integração, E2E e build de produção.

## 19. Variáveis de ambiente

```dotenv
PAGBANK_ENABLED=false
PAGBANK_ENV=sandbox
PAGBANK_API_BASE_URL=
PAGBANK_ACCESS_TOKEN=
PAGBANK_WEBHOOK_URL=
PAGBANK_WEBHOOK_SECRET=
PAGBANK_ACCOUNT_ID=
PAGBANK_PIX_KEY=
PAYMENT_PROVIDER=mock
MCP_ENABLED=false
MCP_AUTH_TOKEN=
```

Também serão documentadas as variáveis de banco, sessão, criptografia, email,
rate limiting, observabilidade e origem pública. Nenhuma variável secreta terá
prefixo de exposição ao frontend.

`PAGBANK_WEBHOOK_SECRET` permanece opcional e inativo até existir um mecanismo
oficial aplicável ao produto contratado. Sua existência no ambiente não
autoriza inventar validação.

## 20. MCP

O ciclo MCP expõe as ferramentas solicitadas no briefing. Cada ferramenta:

- autentica o cliente;
- aplica `MCPAuthorizationService`;
- chama um serviço interno;
- respeita loja, papel e escopo;
- gera auditoria;
- nunca consulta o banco diretamente.

Conciliação manual, cancelamento, alteração de valor ou confirmação
administrativa exigem papel de administrador e confirmação explícita.

## 21. Documentação e operação

Serão entregues README, arquitetura, instalação, desenvolvimento, banco, mock,
PagBank, webhook, MCP, variáveis, testes, publicação, sandbox/produção,
troubleshooting, política de segurança e runbook de incidentes.

Também serão fornecidos `.env.example`, Dockerfile, ambiente local do
PostgreSQL, migrations, seed, scripts, exemplos sanitizados e coleção de
requisições para webhook.

## 22. Restrições externas

A ativação real depende de:

- conta PagBank com chave Pix ativa;
- credenciais de sandbox ou produção;
- produto/API habilitado para a conta;
- URL HTTPS pública para webhook;
- homologação e regras comerciais vigentes do PagBank;
- confirmação oficial das operações de cancelamento e estorno disponíveis.

Essas dependências não impedem o funcionamento integral do modo demonstração.

## 23. Critérios de aceite do primeiro ciclo

O primeiro ciclo está aceito quando:

- vendedor cria venda e obtém QR Code e Pix Copia e Cola;
- pagamento mock confirmado atualiza a venda;
- somente o vendedor correto e perfis autorizados recebem o alerta;
- administrador enxerga toda a loja;
- vendedor não acessa vendas alheias;
- webhook duplicado não duplica estado nem notificação;
- divergência abre conciliação e não libera a venda;
- frontend não consegue forjar confirmação;
- adapter PagBank está isolado e documentado;
- ambiente mock é completo e separado;
- testes e build passam;
- documentação explica a ativação real.
