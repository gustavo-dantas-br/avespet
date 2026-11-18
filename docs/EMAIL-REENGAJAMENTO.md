# Reengajamento educativo de criadores — 5 dias

## Regras de segurança
- **Consentimento explícito**: no Perfil do Criador, o usuário deve marcar e salvar a escolha. Nenhuma conta preexistente é inscrita por padrão.
- Atividade registrada após login no Avespet (`mark_app_visit`), além do último login do Auth. A elegibilidade também considera o instante do consentimento, impedindo mensagens imediatamente após inscrição.
- Cinco dias ou mais de ausência, e-mail confirmado, e pelo menos 30 dias desde qualquer outra tentativa. No máximo um e-mail por episódio de inatividade; novas visitas iniciam um novo período.
- O conteúdo segue espécies do plantel: Ring Neck, calopsita ou conteúdo geral. Sem extrapolar mutações genéticas ou oferecer aconselhamento veterinário específico.
- E-mails promocionais separados de confirmação de conta/recuperação de senha e de e-mails operacionais.
- Descadastro via link de token opaco: GET apresenta confirmação, POST cancela, sem exigir login. Resposta enviada pelo próprio provedor também pode usar cabeçalho List-Unsubscribe-Post.
- Cada envio tem claim no banco antes do contato com o Resend e chave de idempotência; falhas incertas não provocam novo disparo automático do mesmo episódio.
- Limite inicial diário 10, sem destinatários de teste arbitrários, sem envio retroativo para cadastros sem consentimento.
- A Edge Function `reengage-creators` aceita apenas um token de agendamento em header, validado por SHA256. Token criado no Vault do Supabase; nunca no frontend ou GitHub.
- Estado `enabled=false` até os testes finais, mesmo com agendamento registrado. A ativação liga apenas envios futuros para quem optou por receber.

## Operação
- Cron 11h (horário de São Paulo, equivalente a 14h UTC), com `pg_cron` + `pg_net` e chave no Vault.
- Funções: `reengage-creators` (verify_jwt=false, valida segredo) e `reengagement-unsubscribe` (verify_jwt=false, valida token público).
- Banco: `email_news_preferences`, `email_user_activity`, `email_reengagement_delivery`, `email_reengagement_settings`.
- E-mail enviado por `novidades@avespet.com.br`; confirmar autenticação SPF/DKIM/DMARC e remetente autorizado no Resend antes de ativar.
- Monitorar `email_reengagement_delivery` e reclamações/bounces no Resend.
