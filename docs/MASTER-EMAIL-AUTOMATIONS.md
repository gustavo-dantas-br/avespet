# Central de Automações de E-mail — Master

- Menu **Master → Automações de e-mail** restrito a `master_admins`.
- Edge Function `master-email-automations`: `overview` oferece inscrições, previsões, status de tentativas, artigos publicados e últimas tentativas. Endereços apresentados sempre mascarados; sem acesso público ao banco.
- `settings`: confirma a sessão Master, audita a intenção e permite alterar `enabled`, mínimo 5–90 dias, intervalo 14–90 dias, limite diário 1–50. Não executa envios na própria ação.
- Resend `sent` significa apenas aceitação pelo provedor; entrega, abertura e cliques dependem de callbacks/capacidades adicionais, **não implementados**.
- A consulta a próximos contatos é **estimativa** e muda com a atividade, cancelamento e novas inscrições.
- Guias exibidos são apenas `artigos.publicado=true`. O e-mail tenta sugerir primeiro um guia compatível com a espécie; entre os compatíveis, prefere um slug que ainda não conste de envio bem-sucedido ao mesmo usuário, retornando ao primeiro se todos já tiverem sido usados.
- Os artigos não são copiados para e-mails; enviam-se título e link, evitando reproduzir conteúdo desatualizado ou não revisado.
- Continua necessário testar a autenticação e entrega de `novidades@avespet.com.br` com um assinante real voluntário e consultar bloqueios/bounces no Resend.
