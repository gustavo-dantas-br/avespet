# Histórico de medicamentos e vitaminas na Agenda
Registros de administração por ave, separados de tarefas. Captura data efetiva, tipo, nome do produto, quantidade opcional estritamente histórica, observações e próxima data **informada manualmente**. Próxima data é lembrete no calendário, não administração confirmada. Nenhum cálculo automático de dose, intervalo, tratamento, notificação push ou recomendação clínica. Novas administrações geram novos registros.

Banco: tabela ave_cuidados_registros vinculada a auth.users e aves, RLS exigindo propriedade do criador E da ave, inclusive UPDATE/INSERT. Excluir ave apaga registros associados. Registros de saúde sensíveis para criadores; evitar divulgar em perfis públicos, anúncios ou relatórios não autorizados. Sem novos eventos analíticos. Migração aditiva, pronta para homologação.

Testes: criadores diferentes não podem visualizar/alterar registros alheios; impedir vínculo com ave de outra conta; histórico data A e lembrete data B aparecem no calendário; ausência de B não inventa retorno; editar/excluir; mobile; data no mês seguinte; compilação Vite. Publicação condicionada à aprovação.
