# Ativação da persistência Avespet IA

Estado: propostas e serviço preparados. Nenhuma alteração remota aplicada.
1. Aplicar propostas somente em ambiente isolado.
2. Com duas contas de teste, validar leitura, insert, update e delete próprios; negar acesso anônimo e acesso cruzado, inclusive user_id próprio com ave_id alheio.
3. Testar troca de aves, reabertura em outro navegador, falha de rede e conflito de edição. Não importar registros locais silenciosamente.
4. Integrar a UI ao serviço de perfil e habilitar flags somente após aprovação. O diário já tem serviço separado. Não remover registros locais até confirmação de sucesso.
5. Validar exclusão em cascata e ausência de alterações no plantel.
