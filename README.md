# Notifica AI

Aplicação enxuta para registrar uma venda pelo valor, gerar a cobrança Pix,
enviar o QR Code ao cliente, validar o pagamento e exibir a notificação.

## Fluxo

1. Informe somente o valor da venda.
2. Clique em **Gerar Pix**.
3. Copie, compartilhe ou envie o QR Code ao cliente.
4. O webhook do PagBank sinaliza a mudança.
5. O sistema consulta o pedido diretamente no PagBank.
6. Somente depois da validação a venda muda para paga e a notificação aparece.

O sistema inicia com vendas, recebimentos, valores pendentes e notificações em
zero. Não existem clientes, aparelhos, vendedores ou transações fictícias.

## Conectar ao Supabase

As cobranças reais são persistidas na tabela `public.payment_charges`, com RLS
ativado e acesso bloqueado para clientes públicos. Configure no ambiente do
servidor (por exemplo, Vercel Production):

```text
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
```

Use somente a chave secreta/service role no backend. A chave publishable não
substitui essa configuração e nunca deve ser usada para gravar cobranças.

## Executar

Requisito: Node.js 22.13 ou superior.

```bash
pnpm install
pnpm dev
```

Sem credenciais, o sistema usa o provider local de validação. Nenhuma
credencial real é incluída no repositório.

## Conectar ao PagBank

Cadastre estas variáveis no ambiente de hospedagem:

```text
PAYMENT_PROVIDER=pagbank
PAGBANK_ENABLED=true
PAGBANK_ENV=sandbox
PAGBANK_API_BASE_URL=https://sandbox.api.pagseguro.com
PAGBANK_ACCESS_TOKEN=
PAGBANK_WEBHOOK_URL=https://SEU_DOMINIO/api/webhooks/pagbank
PAGBANK_ACCOUNT_ID=
```

Depois da homologação, altere o ambiente e a URL da API para produção.
Consulte [a documentação da integração](docs/pagbank/README.md).

## MCP

O endpoint está em `/api/mcp`. Para ativá-lo:

```text
MCP_ENABLED=true
MCP_AUTH_TOKEN=
MCP_ROLE=ADMIN
```

A ferramenta `create_pix_sale` recebe somente `amount`, em centavos. Consulte
[a documentação MCP](docs/mcp/README.md).

## Vercel

O repositório contém `vercel.json` e o script `pnpm vercel-build`. Importe o
repositório com o preset Next.js e configure as variáveis no painel da Vercel.

## Verificações

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
pnpm vercel-build
```

## Documentação

- [Arquitetura](docs/architecture/README.md)
- [PagBank](docs/pagbank/README.md)
- [MCP](docs/mcp/README.md)
- [Segurança](docs/security/README.md)
- [Incidentes de pagamento](docs/runbooks/payment-incident.md)
