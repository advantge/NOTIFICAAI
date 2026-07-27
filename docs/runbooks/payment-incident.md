# Runbook — incidente de pagamento

## PagBank indisponível

1. Não marcar vendas como pagas.
2. Conferir saúde e última comunicação.
3. Preservar jobs e aplicar backoff.
4. Após cinco falhas, dead-letter e alerta.
5. Reprocessar somente após recuperação.

## Webhook duplicado

1. Comparar hash e identificadores.
2. Responder sucesso sem nova notificação.
3. Preservar o evento original.

## Valor divergente

1. Bloquear liberação.
2. Abrir conciliação.
3. Registrar consulta autoritativa.
4. Resolução apenas por perfil autorizado.

## Segredo exposto

1. Desabilitar integração.
2. Revogar token no PagBank.
3. Rotacionar segredos e sessões.
4. Auditar chamadas.
5. Reativar após validação em sandbox.
