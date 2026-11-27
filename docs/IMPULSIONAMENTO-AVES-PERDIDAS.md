# Impulsionamento de aves perdidas — proposta v1

Estado: **não comercializado / não publicado**. O cadastro gratuito continua disponível.

## Catálogo proposto

| Plano | Preço total | Dias | Mídia Meta incluída | Gestão/destaque |
|---|---:|---:|---:|---:|
| Gratuito | R$ 0,00 | Enquanto desaparecida | R$ 0 | R$ 0 |
| Destaque Avespet | R$ 29,90 | 7 | R$ 0 | R$ 29,90 |
| Alerta Local | R$ 119,90 | 3 | R$ 60 | R$ 59,90 |
| Alerta Regional | R$ 229,90 | 7 | R$ 140 | R$ 89,90 |
| Busca Intensiva | R$ 399,90 | 10 | R$ 270 | R$ 129,90 |

Os raios de 5, 10 e 15 km são referências, não garantias de entrega. O catálogo é preliminar; o Master mostra a proposta sem habilitar vendas.

## Fluxo operacional acordado

1. O tutor cadastra a ave gratuitamente e mantém o anúncio ativo enquanto desaparecida, sujeito à moderação.
2. O tutor solicita um plano pago opcional. Exibir preço total e separação entre verba de mídia e criação/gestão, antes do aceite.
3. Registrar autorização para divulgação de fotos e localização aproximada; manter o telefone privado e o contato intermediado.
4. Somente após cobrança validada, aprovação operacional e configuração verificada na conta Meta, ativar campanha.
5. Registrar datas, identificação da campanha, mídia gasta, alcance, impressões, cliques e histórico de atendimento.
6. Se houver notícia de reencontro, **confirmar com o tutor** antes de mudar o status e encerrar a campanha. Oferecer depoimento opcional com autorização de publicação.

## Requisitos de implementação antes das vendas

- Schema versionado com planos, pedidos, pagamentos, campanhas, eventos de auditoria e consentimentos.
- RLS por titular do anúncio; acesso Master validado no servidor, sem autorizações baseadas em metadados alteráveis do usuário.
- Nunca confiar em valores enviados pelo cliente: preço e orçamento de mídia devem ser resolvidos no servidor usando o plano vigente e armazenados em centavos no pedido.
- Pedido vinculado a anúncio de ave perdida pertencente ao tutor autenticado.
- Pix/cartão com confirmação por webhook assinada e processamento idempotente.
- Tratar cancelamentos, campanhas pausadas e política de reembolso aprovada; registrar separadamente gasto efetivo e verba não utilizada.
- Relatórios baseados em dados efetivos da Meta, sem prometer número de visualizações ou reencontro.
- Tela de contratação e envio de comunicações somente após homologação e aprovação comercial.
- Testes de RLS, acesso indevido, duplicidade de pagamentos, campanha encerrada por recuperação e cenário sem foto.

## Estado técnico da primeira entrega

A branch `feature/impulsionamento-aves-perdidas` adiciona um catálogo centralizado e um painel informativo no Master. Não altera a base Supabase, não habilita pagamentos, não cria campanhas na Meta e não altera produção. O catálogo permanece fixo no código nesta fase; edição de preços pelo Master dependerá da etapa de persistência segura.

## Continuidade — integração com solicitações existentes (18/11/2026)

- Confirmada no Supabase de produção, **somente por consultas de leitura**, a existência das tabelas `solicitacoes_campanhas_aves` e `anuncios_aves_perdidas`.
- O formulário já existente em `/campanha-ave-perdida` utiliza três pacotes de orçamento sob consulta (`bairro`, `cidade`, `regional`). Não migrar IDs históricos nem tratar estes três IDs como equivalentes automáticos aos cinco novos planos.
- O painel novo passou a **listar em somente leitura** as solicitações existentes, reutilizando `listarCampanhasAdmin()`. Nenhuma solicitação é alterada.
- A policy atual de leitura das solicitações concede acesso a integrantes de `public.admins`; caso o Master esteja apenas em `master_admins`, a listagem poderá mostrar erro de permissão. Corrigir com fluxo administrativo validado e auditado, **não** abrindo SELECT público.
- A policy existente permite envio público de pedidos de orçamento por `anon` e `authenticated` sob campos controlados; os contatos não podem ser expostos em páginas públicas.
- Não executar alterações de schema sem testes de RLS e plano de compatibilidade. Não alterar o fluxo de e-mails ou senhas.
- Próxima etapa: consolidar um modelo único de contratação autenticada, preços definidos no servidor, histórico de pedidos e confirmação de pagamento. Manter o formulário legado enquanto a migração não estiver homologada.
- Nenhum deploy, alteração no Supabase de produção, cobrança ou anúncio Meta foi realizado.

## Continuidade — área do tutor

- Em `src/features/aves-perdidas/pages/PerdiUmaAve.jsx`, anúncios **aprovados** exibem um link para solicitar divulgação ampliada. Anúncios pendentes, encerrados ou reencontrados não oferecem esse atalho.
- O link abre o formulário existente em `/campanha-ave-perdida?anuncio=<uuid>`, sem efetuar contratação ou cobrança.
- `SolicitarCampanha.jsx` agora consulta a identidade Supabase e confirma que o anúncio aprovado pertence à conta autenticada **antes de vinculá-lo ao pedido**. Se não for possível conferir, aceita somente orçamento sem vínculo.
- Quando o vínculo é validado, pré-preenche nome, contato, cidade, bairro e descrição a partir do cadastro, permitindo revisão pelo tutor.
- A validação de titularidade no navegador é apenas uma camada de conveniência: antes de ativar **planos de preço fixo, pagamentos ou outras operações sensíveis**, será necessária validação autoritativa de titularidade no servidor, com RLS, auditoria e testes específicos.
- Atenção ao fluxo legado: a inserção pública de solicitação de orçamento continua existente. Não interpretar recebimento de pedido como pagamento confirmado.
- Verificação até agora: arquivos e ligações de código conferidos no GitHub; **build e testes de execução ainda pendentes**. Não houve deploy.

## Continuidade — triagem de solicitações no Master

- Adicionado o componente `src/features/impulsionamento/SolicitacoesMaster.jsx` ao painel de impulsionamento. Utiliza a tabela legada `solicitacoes_campanhas_aves` e reaproveita o serviço de campanhas existente.
- O Master pode listar, pesquisar e filtrar pedidos de orçamento e, quando permitido pelo banco, registrar observações privadas e status de triagem (`solicitada`, `em_orcamento`, `aguardando_pagamento`, `cancelada`).
- A tela bloqueia a edição de pedidos em estados `paga`, `em_execucao` e `concluida`, e não disponibiliza ação de confirmar pagamento, efetuar cobrança ou ativar Meta Ads.
- O banco legado possui uma função administrativa mais ampla de alteração de status. **O bloqueio na interface não é controle de autorização**. Antes de lançar pagamentos é obrigatório criar fluxo de servidor validado, transições com auditoria e verificação do webhook financeiro, impedindo marcação arbitrária de pago.
- A confirmação de ações de triagem ocorre com confirmação explícita no navegador. A execução do SQL em produção não foi alterada.
- No repositório, a nova tela e o vínculo com o Master foram salvos na branch de desenvolvimento. O build e os testes de navegação ainda não foram executados; produção segue inalterada.

## Continuidade — simulação financeira sem integração de pagamentos (19/11/2026)

- Confirmado por leitura do Supabase: a tabela legada de campanhas guarda orçamento em `valor` (numeric), mas ainda não possui uma contabilidade separada para preço final, verba reservada, gasto de mídia, receita de gestão, estornos e eventos financeiros. A tabela de `reserva_pagamentos` pertence ao domínio de reservas; **não reutilizar para campanhas**.
- Adicionados `src/features/impulsionamento/financeiro.js` e `SimuladorFinanceiro.jsx`. O Master apresenta simulação de preço, mídia reservada, verba gasta, saldo de mídia, taxas, custos operacionais, contribuição e reembolso hipotético, sem gravar valores, processar Pix/cartão ou executar estornos.
- Valores internos são inteiros em centavos. Gasto de mídia não pode superar a verba prevista, reembolso hipotético não pode superar o saldo do preço pago e todos os resultados são explicitamente estimativas.
- Adicionados testes de unidade em `tests/impulsionamento-financeiro.test.js`. Testes foram versionados; **a execução de build/testes ainda não foi confirmada** nesta etapa.
- Não atribuir valores reais a pedidos antigos a partir dos novos planos nem deduzir que um status legado `paga` significa pagamento verificado.
- Próxima fase: definir gateway de pagamento, confirmar pagamento pelo webhook com validação de assinatura/idempotência e segregar registros de pedido, tentativa de cobrança, evento de pagamento, gasto de mídia e reembolso, com auditoria do Master e RLS.
- Publicação em produção, migração Supabase e cobranças permanecem **não realizadas**.

## Asaas: estrutura preparada enquanto aguarda CNPJ (19/11/2026)

**Decisão comercial:** Asaas é o provedor planejado; pagamentos devem permanecer desabilitados enquanto CPF/CNPJ, enquadramento fiscal e conta aprovada não forem definidos.

**Entregue nesta branch (não implantado):**
- `src/features/impulsionamento/asaasConfig.js`: `ASAAS_PAGAMENTOS_ATIVOS = false`, ambiente previsto `sandbox`.
- `src/features/impulsionamento/asaasGateway.js`: contrato interno desabilitado para checkout e função de classificação de eventos **sem validar autenticidade e sem alterar pagamentos**.
- `docs/sql/asaas-impulsionamento-schema-draft.sql`: rascunho transacional de pedidos, pagamentos, eventos idempotentes, gastos e reembolsos, com RLS, grants somente leitura para tutor e escrita restrita ao backend. **Não foi executado no banco**.
- `tests/impulsionamento-asaas.test.js`: testes criados para confirmar fail-closed e nenhuma confirmação financeira por evento sem validação.
- Aviso de configuração no painel Master. Não há chave de API, checkout funcional ou webhook ativo.

**Para ativar futuramente, após CNPJ e conta Asaas:**
1. Confirmar cadastro PJ e taxas, obter credenciais de **sandbox** no painel Asaas, configurar segredos apenas no ambiente de Edge Functions, nunca no React/GitHub.
2. Revisar e migrar SQL em ambiente de homologação, executar testes de RLS com papéis anônimos/tutor/outro tutor/Master e inspecionar advisors. O schema é um desenho inicial; ainda requer validação de versionamento, índices, transições e integridade financeira.
3. Implementar endpoint autenticado de criação de pedidos: validar tutor, anúncio aprovado e titularidade **no servidor**; resolver preço a partir de catálogo servidor-side; gravar snapshot imutável em centavos.
4. Criar checkout hospedado Asaas com API privada, vinculação idempotente ao pedido, URLs de retorno confiáveis e somente métodos permitidos.
5. Implementar webhook público somente para o provedor, autenticado por token/cabeçalhos definidos na documentação oficial e reforçado com consulta autenticada do recurso ao Asaas. Persistir `event_id` único, processar evento em transação; usar deduplicação e rejeitar mudanças indevidas de estado.
6. Validar valor, moeda, pedido, destinatário e situação efetiva na API Asaas antes de marcar pedido como pago. Registrar estornos e chargebacks em eventos financeiros separados, mantendo trilha de auditoria.
7. Preparar teste de integração do sandbox (Pix, cartão, expiração, repetição de webhook, refund, pagamento inconsistente, pedido já cancelado), teste de build e UX. Não habilitar vendas sem homologação.
8. Revisar práticas fiscais de emissão de NFS-e e exibição do nome do recebedor, privacidade de dados pessoais e termos de cancelamento.
9. Habilitação final por chave **servidor-side** após aprovação explícita; não confundir o sinal desabilitado no frontend com controle de acesso.

**Nenhuma cobrança real, segredo ou alteração de Supabase/Vercel de produção foi executada.**


## Entrega LP — primeira implementação (27/11/2026)

- Branch: `feature/lp-aves-perdidas`, derivada de `feature/impulsionamento-aves-perdidas`.
- A rota `/aves-perdidas` foi transformada em landing page com hero, CTA gratuito, benefícios, explicação da jornada, planos, formulário de cadastro, anúncios públicos, FAQ e CTA final.
- Os planos pagos são carregados dinamicamente de `campaign_packages` por `listarPacotesPublicos()`; a policy pública existente limita a leitura aos registros publicados.
- O cadastro gratuito aparece primeiro e não depende de um registro artificial no catálogo pago.
- Os códigos históricos `destaque`, `bairro`, `cidade` e `regional` foram preservados. O formulário legado recebe o plano selecionado via query string e pré-seleciona a opção.
- Solicitar um plano continua significando solicitar orçamento. Não há checkout, confirmação de pagamento ou início automático de campanha nesta etapa.
- A LP explica que não há garantia de alcance ou reencontro e informa a privacidade dos contatos, intermediação pelo Avespet e natureza pública das fotos enviadas.
- O catálogo confirmado no banco, na consulta de leitura desta etapa, contém: Destaque Avespet (7 dias); Alerta Local (até 5 km, 3 dias); Alerta Regional (até 10 km, 7 dias); Busca Intensiva (até 15 km, 10 dias). Preços e faixas de alcance são lidos do banco, não copiados para o frontend.
- Pendências antes da publicação comercial: validar política de privacidade, implementar e auditar registro de consentimentos aplicáveis, testes de RLS/fluxo, build e revisão visual responsiva.
- Não houve alteração no Supabase, deploy, merge, cobrança, disparo de e-mails ou campanha Meta.


## Revisão funcional — 27/11/2026

- O formulário de solicitação consulta o catálogo público publicado, incluindo preço, prazo, raio e estimativa de alcance.
- A opção escolhida na LP é pré-selecionada apenas se o pacote ainda estiver publicado.
- Sem catálogo disponível, o envio é bloqueado; não há fallback que permita solicitar pacote oculto/despublicado.
- Os códigos de negócio permanecem `destaque`, `bairro`, `cidade`, `regional`.
- O fluxo é de orçamento sob consulta, sem cobrança nesta etapa.
- A rota foi confirmada no `AuthPage.jsx`; visitante sem sessão consegue acessar a LP.
- A política de privacidade não foi localizada em rota/arquivo verificável no repositório. Não inventar URL; publicar/validar política antes da divulgação comercial.
- Build inicial aprovado; alteração posterior causou erro de sintaxe JSX e foi corrigida. Build do último commit ainda precisa ser confirmado.
- Testes ponta a ponta, validação de RLS em usuário anônimo e conferência visual responsiva continuam pendentes.
