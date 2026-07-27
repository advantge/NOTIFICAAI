# Integração PagBank

## Contratos oficiais usados

- Criar pedido Pix: `POST /orders`.
- Consultar pedido: `GET /orders/{order_id}`.
- Autorização: `Bearer` no backend.
- Idempotência: `x-idempotency-key`.
- Notificações: `notification_urls`.
- QR Code: `qr_codes.amount.value`, `qr_codes.text` e links.

Fontes:

- <https://developer.pagbank.com.br/reference/criar-pedido-pedido-com-qr-code>
- <https://developer.pagbank.com.br/reference/criar-pedido>
- <https://developer.pagbank.com.br/reference/consultar-pedido>
- <https://developer.pagbank.com.br/reference/webhooks>

## Ativar sandbox

1. Tenha conta PagBank com chave Pix ativa.
2. Habilite a API Order para a conta.
3. Obtenha o token de sandbox.
4. Publique a aplicação em HTTPS.
5. Defina:

```dotenv
PAYMENT_PROVIDER=pagbank
PAGBANK_ENABLED=true
PAGBANK_ENV=sandbox
PAGBANK_API_BASE_URL=https://sandbox.api.pagseguro.com
PAGBANK_ACCESS_TOKEN=...
PAGBANK_WEBHOOK_URL=https://seu-dominio/api/webhooks/pagbank
PAGBANK_ACCOUNT_ID=...
```

6. Crie uma cobrança de baixo valor.
7. Confirme o retorno `ORDE_...`, `QRCO_...`, texto Pix e link PNG.
8. Envie um webhook sanitizado e confirme a consulta
   `GET /orders/{order_id}` antes da mudança da venda.

## Produção

Troque ambiente, URL-base e token somente após homologação. Nunca reutilize
credenciais ou dados de sandbox.

## Limitações

- QR Code Pix é de uso único e há um por pedido.
- Sem vencimento explícito, a validade documentada é 24 horas.
- A documentação da API Order consultada não garante assinatura criptográfica.
  `PAGBANK_WEBHOOK_SECRET` permanece inativo até existir mecanismo oficial.
- Cancelamento e estorno retornam `UNSUPPORTED` até confirmação documental para
  o produto contratado.
- Sandbox, habilitação e homologação dependem do PagBank.

## Diagnóstico

- `401/403`: revisar token, produto e ambiente.
- pedido sem QR Code: bloquear e registrar resposta sanitizada.
- webhook sem cobrança: consultar pedido e manter a venda bloqueada.
- valor divergente: abrir conciliação.
- indisponibilidade: backoff e dead-letter após cinco tentativas.
