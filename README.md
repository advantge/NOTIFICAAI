# Notifica AI

Aplicação web para registrar vendas, gerar cobranças Pix individuais na mesma
conta PagBank e avisar automaticamente o vendedor correto após verificação
financeira.

## O que funciona

- dashboard administrativo e dashboard de vendedor;
- nova venda, QR Code, Pix Copia e Cola, cópia e compartilhamento;
- simulação de pagamento e confirmação visual;
- vendas, pagamentos, notificações, conciliação, relatórios e saúde;
- provider mock completo e adapter PagBank pela API Order oficial;
- webhook com limite, validação, sanitização, hash e deduplicação;
- máquinas de estado, RBAC e verificação de valor/moeda/IDs;
- schema Drizzle com 15 tabelas e migration;
- MCP Streamable HTTP autenticado e autorizado;
- layout responsivo de 320 px a telas amplas.

## Início rápido

Requisitos: Node.js 22.13 ou superior.

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Acesse `http://localhost:3000`. O modo padrão é `PAYMENT_PROVIDER=mock` e mostra
claramente o selo “Ambiente de demonstração”.

## Verificações

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
pnpm build
```

## Banco

O deploy Sites usa Cloudflare D1 com Drizzle. A migration fica em `drizzle/`.
O domínio não depende do driver; um adapter PostgreSQL pode ser usado em
implantação própria sem alterar serviços ou providers.

## Vercel

O repositório inclui `vercel.json` e o script `pnpm vercel-build`, que executa
o build Next.js nativo usado pela Vercel. Importe o repositório no painel da
Vercel com o preset Next.js e mantenha o diretório raiz do projeto.

O painel e o provider mock funcionam sem variáveis obrigatórias. Para ativar o
PagBank real e o MCP, cadastre na Vercel as variáveis descritas em
`.env.example`. Nunca envie credenciais para o Git.

Cloudflare D1 não está disponível na Vercel. Antes de habilitar persistência em
produção na Vercel, conecte um banco PostgreSQL e implemente o adapter descrito
na documentação de arquitetura.

## PagBank

O adapter real permanece desabilitado até o preenchimento das credenciais e
homologação. Consulte [docs/pagbank/README.md](docs/pagbank/README.md).

O webhook nunca confirma o pagamento. Ele dispara uma consulta autenticada ao
PagBank; somente a resposta consultada pode avançar a venda para paga.

## MCP

Defina `MCP_ENABLED=true`, gere `MCP_AUTH_TOKEN` forte e acesse `/api/mcp`.
Consulte [docs/mcp/README.md](docs/mcp/README.md).

## Documentação

- [Arquitetura](docs/architecture/README.md)
- [Integração PagBank](docs/pagbank/README.md)
- [MCP](docs/mcp/README.md)
- [Segurança](docs/security/README.md)
- [Runbook de incidentes](docs/runbooks/payment-incident.md)
- [Especificação](docs/superpowers/specs/2026-07-27-notifica-ai-core-design.md)
- [Plano](docs/superpowers/plans/2026-07-27-notifica-ai-implementation.md)
