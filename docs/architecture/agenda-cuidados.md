# Histórico de medicamentos e vitaminas na Agenda
Registros de administração por ave, separados de tarefas. Captura data efetiva, tipo, nome do produto, quantidade opcional estritamente histórica, observações e próxima data **informada manualmente**. Próxima data é lembrete no calendário, não administração confirmada. Nenhum cálculo automático de dose, intervalo, tratamento, notificação push ou recomendação clínica. Novas administrações geram novos registros.

Banco: tabela ave_cuidados_registros vinculada a auth.users e aves, RLS exigindo propriedade do criador E da ave, inclusive UPDATE/INSERT. Excluir ave apaga registros associados. Registros de saúde sensíveis para criadores; evitar divulgar em perfis públicos, anúncios ou relatórios não autorizados. Sem novos eventos analíticos. Migração aditiva, pronta para homologação.

Testes: criadores diferentes não podem visualizar/alterar registros alheios; impedir vínculo com ave de outra conta; histórico data A e lembrete data B aparecem no calendário; ausência de B não inventa retorno; editar/excluir; mobile; data no mês seguinte; compilação Vite. Publicação condicionada à aprovação.

## Homologação — seguimento
- A agenda consulta separadamente o histórico recente e os registros com data de administração ou de lembrete no mês exibido; une por ID para evitar duplicação.
- A ação **Registrar novamente** inicia um novo registro, sem reaproveitar quantidade, observações, próxima data nem ID do histórico antigo. Cabe ao usuário informar cada administração e futuro lembrete.
- Histórico visual limitado a 100 registros recentes; grade do mês a 500 registros com eventos. Nenhuma automação de tratamento é criada.

## Administração em lote e retorno parcial
O criador informa primeiro as aves que **de fato receberam** o produto; o frontend cria um registro independente por ave em uma única inserção no banco. Para uma próxima data, seleciona um subconjunto (ou todas, ou nenhuma) das aves que receberam o produto. Apenas o subconjunto fica com `proxima_data`, gerando lembrete futuro; nenhuma administração futura é criada. Editar é individual. Registrar novamente pré-seleciona apenas a ave original. O banco já protege propriedade por ave via RLS; não é necessária nova migração.

## Alertas no sino (sem push)
RPC security invoker `agenda_lembretes_cuidados()` filtra dados por auth.uid() e RLS, retornando até 500 próximos lembretes até amanhã, inclusive atrasados, se ainda não existir administração mais recente para o mesmo produto/ave. No frontend os lembretes são agrupados por data, produto e tipo; cada ave tem atalho **Registrar aplicação**, que abre o formulário pré-preenchido **sem quantidade, data futura ou administração automática**. O aviso some após salvar novo registro, atualizar o sino ou retornar ao app. Lembrete atrasado não significa que a aplicação era clinicamente obrigatória. Sem cron, e-mail ou push; a atualização acontece com o app aberto, no foco e periodicamente.

## Lembretes em lote pelo sino
A notificação agrupada oferece seleção individual, selecionar todas ou limpar; botão abre o cadastro de uma nova administração apenas para IDs selecionados e nunca salva automaticamente. A quantidade, próxima data e observações continuam vazias até serem preenchidas pelo usuário. O formulário valida que as aves continuam pertencendo ao criador. Confirmação parcial remove do sino apenas as aves efetivamente registradas depois da atualização.

## Notificações push automáticas de cuidados
A rotina `avespet-care-reminders-daily` executa às 10h de São Paulo (13h UTC) e cria notificações por criador/produto/data/fase. As fases são véspera, dia programado e primeiro atraso; a chave de evento única evita repetição diária. A inserção usa o trigger existente de `notificacoes` e o pipeline `send-push-notification`; só dispositivos com assinatura push ativa recebem a notificação nativa. O frontend exclui `lembrete_cuidado` da lista genérica para não duplicar o bloco agrupado da Agenda, mas atualiza os lembretes em tempo real. O alerta não confirma aplicação e não determina dose ou frequência.
