# Central de Comunicação — histórico de enviados

## Escopo desta entrega

A Central de Comunicação do Painel Master mantém as caixas de entrada Suporte e Financeiro e acrescenta uma visão global dos e-mails enviados pela conta Resend.

A consulta usa:
- `GET /emails?limit=50` para listar os envios;
- `GET /emails/{email_id}` para abrir os detalhes e o conteúdo;
- paginação pelo identificador do último e-mail retornado.

A Edge Function `master-resend-inboxes` valida sessão e permissão em `master_admins` antes de consultar o Resend. O acesso à listagem e aos detalhes é registrado em `master_audit_log`, sem gravar o corpo do e-mail na auditoria.

## Identificação da origem

A lista relaciona o ID do Resend com os registros internos existentes:
- `aves_perdidas_emails_aprovacao.provider_id` → Aprovação de ave perdida;
- `email_reengagement_delivery.provider_id` → Reengajamento;
- `email_welcome_delivery.provider_id` → Boas-vindas personalizadas;
- `master_audit_log.metadata.provider_id` com ações de envio manual → Envio manual — Suporte/Financeiro, Resposta manual ou Atendimento de ave perdida;
- assuntos padrão do Supabase Auth → Confirmação de e-mail do cadastro, Recuperação de senha ou Convite de acesso;
- sem correspondência → Outro envio pelo Resend.

A origem "Outro envio pelo Resend" não significa falha. Significa apenas que o envio não está associado a uma das duas tabelas internas consultadas.

## Limitações conhecidas

- O histórico global do Resend inclui apenas mensagens disponíveis na conta e no período de retenção do provedor.
- `last_event` é o último evento informado pelo Resend; não equivale a confirmação de leitura humana.
- O cadastro continua usando a confirmação padrão do Supabase Auth. O novo fluxo personalizado de boas-vindas só é acionado para contas marcadas no cadastro e depois que o e-mail estiver confirmado e o usuário entrar no sistema.
- A Edge Function `send-welcome-email` registra a entrega em `email_welcome_delivery`, com `user_id` único e chave de idempotência no Resend, evitando boas-vindas duplicadas.
- O e-mail transacional de aprovação da ave perdida consulta `campaign_packages` em tempo de envio e apresenta somente pacotes publicados, com preço, duração, alcance e link direto para `/campanha-ave-perdida?anuncio=...`.
- A oferta da campanha é opcional. O texto esclarece que primeiro é solicitada uma proposta, que o início depende de aprovação e pagamento, e que não existe garantia de recuperação da ave.
- Se a consulta do catálogo falhar, o e-mail de aprovação mantém o conteúdo transacional sem oferta comercial.
- Na aprovação, respostas 5xx do Resend e falhas de rede são registradas como `uncertain`; rejeições explícitas não-5xx ficam como `failed`. O estado incerto não deve gerar reenvio automático, para evitar mensagens duplicadas.
- A identificação por assunto dos templates padrão do Supabase Auth é uma classificação auxiliar; novos templates personalizados devem gravar o ID do Resend na tabela de entrega correspondente.
- A identificação automática de origem para novos fluxos (boas-vindas e oferta de busca) depende de implementar e registrar esses fluxos; não deve ser inferida apenas a partir do assunto.
- Envios manuais antigos sem `provider_id` no log de auditoria podem continuar classificados como "Outro envio pelo Resend".

## Testes antes de produção

1. Entrar no preview com uma conta autorizada em `master_admins`.
2. Abrir Central de Comunicação e conferir que Suporte e Financeiro continuam listando suas caixas de entrada.
3. Abrir a aba Enviados e verificar assunto, destinatário, remetente, data, origem e último evento.
4. Abrir um e-mail e conferir os detalhes e o conteúdo.
5. Carregar a próxima página quando `has_more` estiver ativo.
6. Entrar com usuário sem permissão Master e confirmar resposta 403 da Edge Function.
7. Confirmar que erro do Resend aparece de forma clara sem expor chave, token ou conteúdo sensível.
8. Criar uma conta de teste, confirmar o e-mail e entrar; validar um único envio de boas-vindas e o registro em `email_welcome_delivery`.
9. Aprovar um anúncio de teste; validar que o e-mail mostra apenas pacotes publicados no catálogo, valores atuais e o ID do anúncio no link.
10. Reaprovar o mesmo anúncio e confirmar que o mecanismo atual não dispara novo e-mail.

## Publicação

Esta alteração requer publicar a versão atualizada da Edge Function `master-resend-inboxes` no projeto Supabase de produção para que a aba Enviados funcione. O deploy do frontend no Vercel Preview, isoladamente, não publica a Edge Function.

Não publicar a Edge Function nem alterar produção até concluir revisão e receber autorização explícita.
