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
- sem correspondência → Outro envio pelo Resend.

A origem "Outro envio pelo Resend" não significa falha. Significa apenas que o envio não está associado a uma das duas tabelas internas consultadas.

## Limitações conhecidas

- O histórico global do Resend inclui apenas mensagens disponíveis na conta e no período de retenção do provedor.
- `last_event` é o último evento informado pelo Resend; não equivale a confirmação de leitura humana.
- O fluxo atual de cadastro usa Supabase Auth e a confirmação de e-mail padrão. Não foi localizado um disparo personalizado de boas-vindas.
- O e-mail de aprovação de ave perdida atualmente confirma a publicação e oferece orientações gratuitas. Ele ainda não contém uma oferta comercial de serviço de busca.
- A identificação automática de origem para novos fluxos (boas-vindas e oferta de busca) depende de implementar e registrar esses fluxos; não deve ser inferida a partir do assunto.

## Testes antes de produção

1. Entrar no preview com uma conta autorizada em `master_admins`.
2. Abrir Central de Comunicação e conferir que Suporte e Financeiro continuam listando suas caixas de entrada.
3. Abrir a aba Enviados e verificar assunto, destinatário, remetente, data, origem e último evento.
4. Abrir um e-mail e conferir os detalhes e o conteúdo.
5. Carregar a próxima página quando `has_more` estiver ativo.
6. Entrar com usuário sem permissão Master e confirmar resposta 403 da Edge Function.
7. Confirmar que erro do Resend aparece de forma clara sem expor chave, token ou conteúdo sensível.

## Publicação

Esta alteração requer publicar a versão atualizada da Edge Function `master-resend-inboxes` no projeto Supabase de produção para que a aba Enviados funcione. O deploy do frontend no Vercel Preview, isoladamente, não publica a Edge Function.

Não publicar a Edge Function nem alterar produção até concluir revisão e receber autorização explícita.
