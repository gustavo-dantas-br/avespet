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

## Complementação de identificação (17/11/2026)

- O formulário de cadastro e edição inclui **sexo**, **idade aproximada** e **características reconhecíveis** (sons, marcas e comportamento). Esses dados são opcionais.
- Em Meus anúncios, o tutor visualiza dicas para completar foto, bairro, cor e características; o anúncio existente não é alterado automaticamente.
- O cartão público mostra nome da ave, espécie, cor, sexo/idade informados, bairro, data do desaparecimento, características e descrição; nunca exibe contato nem anilha.
- O Master vê avisos de cadastro incompleto e os detalhes enviados pelo tutor antes da aprovação.
- A RPC `listar_aves_perdidas_publicas()` deve continuar projetando apenas campos públicos permitidos; anilha e contato ficam no JSON protegido pelo RLS.

## Solicitação de complementação pelo Suporte Master

- O Suporte operacional (somente Master) mostra as informações incompletas dos anúncios de aves perdidas.
- O botão **Solicitar dados por e-mail** chama a Edge Function autenticada `master-support-operations` com `action: prepare-email`; a função exige Master e confere a titularidade e o e-mail confirmado em `auth.users`.
- O atendimento abre um **rascunho** na Central de Comunicação, caixa Suporte, para revisão do destinatário, assunto e texto. **Nunca há envio automático**; o operador precisa clicar em **Enviar e-mail** e confirmar novamente na Central.
- A mensagem orienta o tutor a incluir fotos diretamente no próprio anúncio, sem mandar arquivos por e-mail. O formulário preserva a anilha e o contato fora da listagem pública.
- O histórico `master_audit_log` registra apenas a preparação, identificação do caso e campos incompletos, sem copiar destinatário nem texto do e-mail.
- Cadastros sem `user_id` ou sem e-mail verificado precisam de atendimento manual; não se atribui acesso a partir de WhatsApp.
- **Teste de regressão:** após executar `npm run build` e `npm run test:genetica`, abrir Suporte no Master, localizar uma ave com dados incompletos, preparar e-mail, confirmar que o formulário está preenchido e **não enviar** durante a validação. Ações comuns de listagem e acompanhamento devem continuar funcionando.
