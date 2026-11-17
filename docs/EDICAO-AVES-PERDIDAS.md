# Edição de anúncios de aves perdidas pelo tutor

- O formulário público permite publicar uma ocorrência, inclusive para visitantes. Somente anúncios com `user_id` associado a conta autenticada podem ser editados pelo próprio tutor.
- O tutor autenticado abre o **painel do criador** > **Ave perdida** > **Meus anúncios de aves perdidas** > **Editar anúncio**. A página pública informa que, para editar, é preciso entrar na conta. A edição não aparece na lista pública.
- Foto (JPEG comprimido até 150 KiB, dentro do limite de 160 KiB do bucket), cor, anilha, localização, descrição e contato podem ser corrigidos.
- O botão **Salvar e enviar para análise** atualiza a mesma ocorrência e altera status para `pendente`. Não cria um anúncio duplicado; a publicação fica fora da página pública até nova aprovação.
- O banco verifica `user_id = auth.uid()` para UPDATE com RLS, impede mudanças para status `aprovado` e impede editar ocorrências `encerrado`.
- Anúncios criados como visitante sem conta associada não permitem reivindicação automática. Encaminhar ao suporte; nunca atribuir titularidade só por WhatsApp ou número da anilha.
- A página pública continua usando a RPC `listar_aves_perdidas_publicas()`, que omite contato e anilha. A política antiga de leitura direta do JSON completo em anúncios aprovados é removida; só o tutor e os administradores podem consultar dados completos. Nunca publicar estes campos no card.
- Requer aplicar a política SQL de `supabase/migrations/20261117_edicao_anuncio_ave_perdida_tutor.sql` antes de disponibilizar a versão da interface.

## Verificação manual

1. Com a conta dona do anúncio, abrir **Aves perdidas**, acessar **Meus anúncios**, editar o próprio registro, adicionar foto e salvar.
2. Confirmar que o mesmo ID permanece, status muda para `pendente` e anúncio some da listagem pública até aprovação.
3. No Master, aprovar e confirmar retorno ao anúncio público com a foto atualizada.
4. Com outra conta, comprovar que não pode acessar nem atualizar o anúncio alheio.
5. Em um registro `encerrado`, confirmar que não aparece o botão de edição.
6. Confirmar a compressão de JPEG e o sucesso do upload sob as políticas existentes de Storage.
