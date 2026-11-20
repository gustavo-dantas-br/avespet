# Avespet IA — plano de testes de isolamento do diário (RLS)

**Status em 2026-11-19:** preparado, **NÃO executado** contra a nova tabela. A migração `docs/sql/avespet-ia-diario-proposta.sql` continua **não aplicada** no Supabase. Não executar em produção com dados reais para simular ataques.

## Evidência já coletada
- O Supabase atual contém `public.aves` com `id uuid` e `user_id uuid`, RLS ativado.
- Políticas atuais incluem SELECT para dono e SELECT para admin; a política de escrita do dono já existe.
- A nova tabela requer **dupla verificação**: `diario.user_id = auth.uid()` **e** `aves.user_id = auth.uid()`, em SELECT, INSERT e UPDATE/DELETE.
- GitHub Actions de Avespet IA, genética e build geral reportaram sucesso no commit `4e250f3ac568210d3c0631599f366ba67537cbc9`. Isso verifica código e build, **não simula usuários reais contra RLS**.

## Procedimento em ambiente isolado
Criar duas contas de teste distintas, Usuário A e Usuário B, com autenticação Supabase real; criar uma ave de teste para cada conta. Não usar `service_role` nem bypass de RLS nos testes do cliente. Não imprimir tokens, dados reais ou segredos.

| Caso | Sessão | Operação | Esperado |
|---|---|---|---|
| 01 | A | Inserir diário na ave de A com user_id A | Permitido |
| 02 | A | Listar diário da ave de A | Retorna somente A |
| 03 | B | Consultar diário de A por ID conhecido | 0 registros |
| 04 | B | Inserir diário em ave de A com user_id B | Erro RLS |
| 05 | B | Inserir diário em ave de A informando user_id A | Erro RLS |
| 06 | B | Atualizar registro de A por ID | 0 registros/negado |
| 07 | B | Excluir registro de A por ID | 0 registros/negado |
| 08 | A | Tentar alterar user_id de registro próprio para B | Erro RLS |
| 09 | A | Tentar alterar ave_id para ave de B | Erro RLS |
| 10 | Anônimo | Ler/editar diário | Negado |
| 11 | A | Excluir ave de A | Diários correspondentes excluídos por FK CASCADE |
| 12 | A | Enviar data, peso e texto inválidos | Erro de validação |
| 13 | A | Fazer SELECT sem filtrar user_id | Somente registros A |
| 14 | Admin autenticado | Tentar ler diário de B pelo cliente | Negado (sem política master) |

## Critério para aprovação
Todos os casos passam com duas sessões reais, políticas inspecionadas no banco após migração em ambiente seguro, sem alteração das políticas existentes de `aves`. Registrar evidências do teste sem dados pessoais. Só então habilitar `DIARIO_PERSISTENCIA_ATIVA` em commit independente. **Não publicar a API de IA nem ativar custos.**

## Riscos abertos
- O detector de sinais de risco por expressões regulares não é triagem clínica. Precisa de revisão veterinária e avaliação de erros de escrita e linguagem coloquial.
- A migração ainda não foi aplicada, nem em produção nem em ambiente de homologação.
- A interface atual usa estado de sessão; não é backup nem armazenamento persistente.
