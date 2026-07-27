# Servidor MCP

O endpoint `/api/mcp` usa MCP Streamable HTTP pelo SDK oficial.

```dotenv
MCP_ENABLED=true
MCP_AUTH_TOKEN=um-token-aleatorio-forte
MCP_ROLE=ADMIN
```

Envie `Authorization: Bearer <token>`.

Ferramentas: `create_pix_sale`, `get_sale`, `get_sale_payment_status`,
`list_pending_sales`, `list_paid_sales`, `list_ambiguous_payments`,
`get_payment_details`, `retry_payment_verification`,
`manually_reconcile_payment`, `list_sellers`, `get_seller_performance`,
`get_daily_sales_summary` e `get_integration_health`.

As ferramentas passam pela autorização e chamam serviços internos. Vendedores
não conciliam manualmente. O MCP não acessa credenciais e não confirma
financeiramente um pagamento.

Em produção, use token por identidade, rotação, allowlist e auditoria externa.
