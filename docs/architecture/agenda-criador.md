# Agenda inteligente — primeira fase
Agenda privada do criador, vinculada a auth.uid. Calendário mensal com eclosões estimadas a partir de posturas/ovos ativos já carregados e tarefas manuais persistidas no Supabase. Acesso via menu do criador e dashboard. Categorias: manejo, reprodução, saúde, pós-venda e outro. Tarefas são registros livres; não diagnósticos nem prescrições.

Segurança: agenda_tarefas com RLS restrita ao proprietário, grant apenas autenticado, usuário definido pela aplicação e validado por RLS. Sem tarefas de terceiros, sem serviços de e-mail, sem notificações push, sem sincronização com Google Calendar.

Limites: previsão de eclosão usa diasIncubacao da postura, aproximada; eventos de ovos apenas com status Incubando/Fertil; tarefas de até 500 por mês na consulta. Tarefas e calendário são independentes; não modificar ovos/filhotes pela agenda.

Homologação: migração SQL precisa ser aplicada antes dos testes autenticados. Preview deve apontar para banco com tabela agenda_tarefas. Verificar RLS com dois usuários, criação/conclusão/edição/exclusão, datas e dispositivos. Não publicar até aprovação.
