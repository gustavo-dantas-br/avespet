# Crescimento Master — fase 1

Dashboard lazy-loaded, somente ao abrir a seção, com consulta agregada única via master-infra-monitor action growth_summary após autorização Master. RPC service_role exclusiva e checagem de master_admins; não coleta dados novos e não expõe identidades. Cadastros existentes, último login 30d (não MAU), perfil, aves, interseção perfil + aves, visualizações instrumentadas e estados de planos. Registros de assinatura não representam vigência, pagamento ou receita. Não inferir conversão a partir de pageviews, nem atribuir canal retroativamente. Próxima fase: UTM e atribuição de origem com minimização de dados. Sem mudanças de planos. SQL antes de publicar a função. Homologação e aprovação antes de merge.

## Fase 2 — Origem opcional

UTM source reconhecida apenas em lista fechada; mantém sugestão em memória durante navegação SPA, não cookies/localStorage. Cadastro oferece escolha opcional sem valor pré-selecionado; salva somente canal escolhido no Auth metadata growth_source_v1, que acompanha a confirmação de e-mail. Metadata editável pelo usuário: dado autodeclarado, nunca autorização ou prova de conversão. RPC agrupa por mês com allowlist no servidor; históricos sem campo aparecem como não informado. Nenhuma URL bruta, campanha arbitrária, click ID, IP ou novo identificador. Não envia eventos a plataformas de anúncios. Recarregar a página sem UTM pode perder sugestão. Campanha detalhada e atribuição verificada ficam para fase futura.

## Fase 3 — Funil de ativação da coorte atual

Agrega auth.users criados no mês em Brasília, confirmação de email, último login não nulo, existência de perfil e de aves. Etapas cumulativas por mesma conta; porcentagem do total e da etapa anterior. Estado atual, não eventos de transição nem tempo até ativação. Perfis podem ser criados automaticamente e não indicam conclusão cadastral; aves excluídas e contas excluídas não contam. Sem coleta adicional ou armazenamento pessoal. Não divide cadastros por pageviews. 

## Fase 4 — Engajamento e retenção (recência)

Reutiliza auth.users.last_sign_in_at e email_user_activity.last_seen_at, escolhendo o mais recente. Exclui Master. Segmentos mutuamente exclusivos: até 7 dias, mais de 7 até 30, mais de 30, sem registro. Atividade 30d inclui 7d. Confirmação de e-mail e cobertura do registro de atividade são indicadores separados, não segmentos. Sem coleta adicional nem dados individuais. Não equivale a retenção histórica, MAU faturável ou autorização de marketing; a seção oferece atalho para automações existentes, sem disparar envios, alterar consentimento ou regras de elegibilidade.

## Fase 5 — Leads comerciais manuais

Cadastro separado de prospectos voluntariamente registrados pelo Master; não duplica solicitações de campanha, não importa contas e não altera consentimento. Cinco etapas manuais, origem, próximo retorno; sem disparos automáticos. RLS privada, RPC service_role com verificação Master, auditoria sem nome/contato, exclusão individual confirmada. Lista limitada aos últimos 200, contadores globais. Deduplicação textual básica, não identidade verificada. Conversão manual não é pagamento. Carregamento sob demanda. 

## Fase 6 — Campanhas próprias de marketing

Cadastro manual separado das solicitações de divulgação de aves perdidas. Orçamento/gasto em centavos BRL, período, canal, situação e contagens acumuladas opcionais de leads/cadastros. CPL e custo por cadastro apenas quando gasto informado e denominador positivo. Sem integração de anúncios, gasto autorizado, criação publicitária ou atribuição automática. RPC restrita service_role e Master, auditoria, RLS, lista de até 200. Sem dados pessoais adicionais.

## Fase 7 — Planos e assinaturas

Somente leitura de platform_plans, creator_subscriptions e creator_entitlement_overrides. Exclui Master; vigência considera active/trialing e intervalo de datas. Contas distintas globalmente e em cada plano (planos podem sobrepor). Status são registros, não recebimentos. Ausência de registro não impede acesso gratuito; não inferir assinantes gratuitos exatos. Liberações manuais separadas. Atalho à Central Comercial. Nenhuma alteração de preços, disponibilidade, limites ou cobrança. Restrições de lançamento existentes preservadas.

## Fase 8 — Financeiro

Receita confirmada de campanhas de recuperação: total contratado em campaign_order_operations com payment_confirmed_at não nulo, usando mês de confirmação em São Paulo. Registro manual de confirmação não é conciliação bancária. Solicitações não representam recebíveis. Valores de reserva_pagamentos são transações dos criadores e explicitamente excluídos da receita da plataforma. MRR fica null (indisponível), não zero como afirmação de faturamento, até existir fonte de faturamento/recebimento de assinaturas. Sem novas cobranças, sem preços ativados e sem pagamentos simulados.
