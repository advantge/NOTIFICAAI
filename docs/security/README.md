# Política de segurança

- Segredos apenas no backend.
- Tokens não aparecem em logs ou payloads sanitizados.
- Autorização combina papel, loja e proprietário.
- Estados financeiros mudam somente nos serviços.
- Webhooks têm limite de 64 KiB, JSON, SHA-256 e deduplicação.
- A confirmação compara status, IDs, valor, moeda, conta e horário.
- Divergências abrem conciliação.
- Cookies de produção: `HttpOnly`, `Secure` e `SameSite`.
- CSP, `nosniff`, bloqueio de frames e política de permissões.
- Documentos e IPs são mascarados; retenção segue LGPD.

Gere `SESSION_SECRET`, `ENCRYPTION_KEY` e `MCP_AUTH_TOKEN` com fonte
criptograficamente segura e rotacione após suspeita de exposição.

## Retenção e backup

- Payloads sanitizados: 90 dias por padrão.
- Sessões revogadas e tokens expirados: limpeza diária.
- Pix Copia e Cola: criptografado e removido após retenção operacional.
- Backup diário, retenção de 30 dias e restauração trimestral testada.
