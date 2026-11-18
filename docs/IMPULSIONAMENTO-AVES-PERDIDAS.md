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
