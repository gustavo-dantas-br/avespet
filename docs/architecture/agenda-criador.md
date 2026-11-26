# Agenda inteligente — primeira fase
Agenda privada do criador, vinculada a auth.uid. Calendário mensal com eclosões estimadas a partir de posturas/ovos ativos já carregados e tarefas manuais persistidas no Supabase. Acesso via menu do criador e dashboard. Categorias: manejo, reprodução, saúde, pós-venda e outro. Tarefas são registros livres; não diagnósticos nem prescrições.

Segurança: agenda_tarefas com RLS restrita ao proprietário, grant apenas autenticado, usuário definido pela aplicação e validado por RLS. Sem tarefas de terceiros, sem serviços de e-mail, sem notificações push, sem sincronização com Google Calendar.

Limites: previsão de eclosão usa diasIncubacao da postura, aproximada; eventos de ovos apenas com status Incubando/Fertil; tarefas de até 500 por mês na consulta. Tarefas e calendário são independentes; não modificar ovos/filhotes pela agenda.

Homologação: migração SQL precisa ser aplicada antes dos testes autenticados. Preview deve apontar para banco com tabela agenda_tarefas. Verificar RLS com dois usuários, criação/conclusão/edição/exclusão, datas e dispositivos. Não publicar até aprovação.


## Organização da experiência — novembro de 2026
A interface da Agenda foi reorganizada em quatro áreas de navegação: **Resumo**, **Calendário**, **Tarefas** e **Medicamentos e vitaminas**. A mudança é somente de apresentação e fluxo no frontend; mantém as tabelas existentes, as consultas por usuário, as previsões derivadas das posturas e os registros de cuidados já descritos neste documento.

- Resumo: indicadores do mês selecionado, tarefas pendentes, eclosões estimadas, lembretes de cuidados, próximos eventos e itens atrasados que exigem conferência.
- Calendário: navegação mensal e consulta dos eventos por dia, com atalhos para reprodução, tarefas e cuidados.
- Tarefas: filtros de pendentes/concluídas/todas e formulário exibido somente ao criar ou editar.
- Medicamentos e vitaminas: mantém o fluxo de administração individual/em lote, retorno por subconjunto, histórico e pré-preenchimento originado do sino; formulário permanece nessa área, sem misturar-se às tarefas.

A aba de cuidados abre automaticamente quando o criador entra pela ação de registrar cuidado no sino. Nenhuma tabela, coluna, RPC, política RLS, função de backend ou migration foi alterada por esta reorganização. A homologação deve validar as quatro áreas em desktop e mobile, navegação entre meses, CRUD de tarefas, registros em lote e abertura do formulário a partir do sino.
