# Crescimento Master — fase 1

Dashboard lazy-loaded, somente ao abrir a seção, com consulta agregada única via master-infra-monitor action growth_summary após autorização Master. RPC service_role exclusiva e checagem de master_admins; não coleta dados novos e não expõe identidades. Cadastros existentes, último login 30d (não MAU), perfil, aves, interseção perfil + aves, visualizações instrumentadas e estados de planos. Registros de assinatura não representam vigência, pagamento ou receita. Não inferir conversão a partir de pageviews, nem atribuir canal retroativamente. Próxima fase: UTM e atribuição de origem com minimização de dados. Sem mudanças de planos. SQL antes de publicar a função. Homologação e aprovação antes de merge.

## Fase 2 — Origem opcional

UTM source reconhecida apenas em lista fechada; mantém sugestão em memória durante navegação SPA, não cookies/localStorage. Cadastro oferece escolha opcional sem valor pré-selecionado; salva somente canal escolhido no Auth metadata growth_source_v1, que acompanha a confirmação de e-mail. Metadata editável pelo usuário: dado autodeclarado, nunca autorização ou prova de conversão. RPC agrupa por mês com allowlist no servidor; históricos sem campo aparecem como não informado. Nenhuma URL bruta, campanha arbitrária, click ID, IP ou novo identificador. Não envia eventos a plataformas de anúncios. Recarregar a página sem UTM pode perder sugestão. Campanha detalhada e atribuição verificada ficam para fase futura.

## Fase 3 — Funil de ativação da coorte atual

Agrega auth.users criados no mês em Brasília, confirmação de email, último login não nulo, existência de perfil e de aves. Etapas cumulativas por mesma conta; porcentagem do total e da etapa anterior. Estado atual, não eventos de transição nem tempo até ativação. Perfis podem ser criados automaticamente e não indicam conclusão cadastral; aves excluídas e contas excluídas não contam. Sem coleta adicional ou armazenamento pessoal. Não divide cadastros por pageviews. 
