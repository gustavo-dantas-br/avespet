# Arquitetura do Avespet

> Documento vivo da arquitetura. Atualizar este arquivo sempre que uma mudança estrutural, funcional ou de dados for feita.
>
> **Última revisão:** 17/11/2026  
> **Estado desta revisão:** documentação alinhada ao código encontrado na branch padrão `main`. Não representa uma refatoração completa.

## 1. Objetivo arquitetural

O Avespet deve evoluir como uma aplicação React modular, com responsabilidades claras entre interface, funcionalidades de domínio, acesso a dados, autenticação e infraestrutura. A prioridade é preservar o comportamento existente e a segurança dos dados enquanto reduzimos o acoplamento e o tamanho do componente principal.

## 2. Stack identificada

| Camada | Tecnologia | Papel |
|---|---|---|
| Interface | React 18 | Componentes e estado da aplicação |
| Build e desenvolvimento | Vite 5 | Servidor local e build de produção |
| Persistência e autenticação | Supabase JS 2 | Auth e acesso ao PostgreSQL |
| Ícones | lucide-react | Ícones da interface |
| PWA | vite-plugin-pwa | Instalação e atualização como aplicação web |
| Hospedagem | Vercel | Deploy contínuo conectado ao GitHub |

Scripts disponíveis em `package.json`: `npm run dev`, `npm run build` e `npm run preview`. Nesta revisão não foi identificado script de testes automatizados.

## 3. Estrutura encontrada no código

A estrutura abaixo registra os caminhos confirmados por imports e arquivos consultados. Não é uma lista exaustiva de todos os arquivos do repositório.

```text
src/
├── App.jsx                    # Componente central; ainda concentra estado e orquestração
├── main.jsx                   # Inicialização do React
├── index.css                  # Estilos globais
├── supabaseClient.js           # Criação do cliente Supabase
├── components/                # Componentes compartilhados
│   ├── AuthPage.jsx
│   ├── NotificationsCenter
│   └── SuporteWhatsApp
├── features/                  # Funcionalidades organizadas por domínio
│   ├── anuncios/
│   ├── aves-perdidas/
│   ├── campanhas/
│   ├── clientes/
│   ├── dashboard/
│   ├── financeiro/
│   ├── fornecedores/
│   ├── genetica/
│   ├── indicacoes/
│   ├── perfil/
│   ├── plantel/
│   ├── pos-venda/
│   └── reproducao/
├── lib/
│   ├── db.js                  # Consultas e operações Supabase
│   └── modelos.js             # Fábricas dos modelos iniciais
├── publico/
│   └── roteador.jsx           # Navegação da área pública
└── conteudo/
    └── ConteudoAdmin          # Conteúdo administrativo

supabase/
└── schema.sql                 # Schema inicial do banco
```

Observações:
- Os nomes acima refletem os caminhos vistos no código; extensões omitidas em imports podem variar.
- `App.jsx` já importa telas e componentes de vários domínios, mas ainda contém muito estado, carregamento de dados e coordenação de ações. Portanto, o projeto está parcialmente modularizado, não totalmente separado.
- `lib/db.js` centraliza boa parte do acesso ao Supabase. `supabaseClient.js` cria o cliente.
- `publico/roteador.jsx` implementa um roteador mínimo próprio para a área pública.

## 4. Domínios funcionais identificados

| Domínio | Responsabilidade principal |
|---|---|
| Plantel | Cadastro, edição, fotos, histórico, árvore e placas das aves |
| Genética | Mutações e calculadora genética |
| Reprodução | Casais, posturas e acompanhamento reprodutivo |
| Financeiro | Despesas e indicadores financeiros |
| Anúncios | Publicação, vitrine e aprovação de anúncios |
| Aves perdidas | Registro, busca por anilha, achados e moderação |
| Clientes e fornecedores | Cadastro e histórico de relacionamento |
| Pós-venda e indicações | Acompanhamento após venda e indicações |
| Perfil | Dados públicos e privados do criador |
| Dashboard | Visão geral e indicadores |
| Campanhas | Ferramentas administrativas de campanhas |

## 5. Fluxo atual simplificado

1. `main.jsx` monta o React e renderiza `App.jsx`.
2. `App.jsx` coordena a sessão recebida, estado global da área autenticada, carregamentos e seleção de telas.
3. Visitantes passam por `components/AuthPage.jsx`, que organiza o cabeçalho, navegação, login e roteamento público. A home foi extraída para `publico/home/Inicio.jsx`; páginas de domínio continuam em `features/` e conteúdos editoriais em `publico/`.
4. As telas e componentes ficam principalmente em `components/`, `features/` e `publico/`.
5. As funções em `lib/db.js` consultam e persistem dados no Supabase.
6. `supabaseClient.js` fornece o cliente configurado pelas variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
7. O PostgreSQL aplica políticas de Row Level Security (RLS) definidas no banco. O arquivo `supabase/schema.sql` é apenas o schema inicial; alterações posteriores podem existir no projeto Supabase e precisam ser documentadas em migrações versionadas.

## 6. Arquitetura-alvo

Evoluir gradualmente para esta separação, sem mover arquivos em massa nem quebrar imports:

- **pages:** composição de páginas e telas por domínio.
- **components:** componentes visuais reutilizáveis, sem regras de persistência.
- **services ou repositories:** operações de dados por domínio; componentes não devem executar consultas Supabase diretamente.
- **hooks:** lógica reutilizável de interface e carregamento.
- **contexts:** somente estado realmente compartilhado entre várias áreas.
- **lib:** utilitários puros, formatadores, validações e configuração transversal.
- **supabase/migrations:** histórico versionado de mudanças no banco e nas políticas RLS.

A estrutura final deve respeitar o padrão já existente em `features/`; não criar uma segunda organização paralela sem necessidade. Quando fizer sentido, cada domínio deve concentrar suas páginas, componentes, hooks, serviços e testes dentro da própria pasta.

## 7. Regras obrigatórias para novas alterações

1. Identificar primeiro o domínio responsável pela funcionalidade.
2. Manter componentes visuais separados de consultas e regras de persistência.
3. Reutilizar funções e modelos existentes antes de criar duplicatas.
4. Não colocar novas funcionalidades grandes dentro de `App.jsx`; manter nele apenas a composição e a orquestração que ainda não foi extraída.
5. Toda alteração de banco deve ter migração SQL versionada, com políticas RLS revisadas.
6. Nunca colocar chaves secretas no frontend ou versionar arquivos `.env`. A chave anon/public é a única apropriada ao cliente, protegida pelas políticas RLS.
7. Preservar isolamento entre usuários. Toda tabela com dados privados deve ter RLS habilitada e políticas de leitura/escrita coerentes com o proprietário e com papéis administrativos.
8. Tratar dados públicos e privados do perfil em áreas distintas; não expor endereço residencial em consultas públicas.
9. Ao alterar uma funcionalidade, verificar seus imports, chamadas, permissões, estados de carregamento e mensagens de erro.
10. Não apagar nem substituir comportamento existente sem verificar dependências e registrar a decisão.
11. Preferir mudanças pequenas, revisáveis e reversíveis.
12. Atualizar este documento e o README quando a estrutura, os fluxos ou as decisões arquiteturais mudarem.

## 8. Pontos de atenção para auditoria

- `App.jsx` ainda é um ponto de concentração de estado e coordenação. É o principal candidato a extração incremental.
- `lib/db.js` reúne operações de muitos domínios. A evolução recomendada é extrair serviços por domínio mantendo compatibilidade temporária com os imports existentes.
- `deleteRow(table, id)` filtra por ID no cliente, sem incluir explicitamente `user_id`; a segurança depende da política RLS no banco. Confirmar que todas as tabelas e operações possuem políticas corretas.
- O schema inicial em `supabase/schema.sql` não deve ser considerado a fotografia completa do banco atual. Comparar com o projeto Supabase antes de qualquer migração.
- Fotos de aves são descritas no README histórico como dados em base64. Avaliar Supabase Storage antes de aumentar volume; não migrar sem plano de compatibilidade.
- Criar testes automatizados por domínio antes de refatorações maiores. Até lá, executar pelo menos o build de produção e testes manuais dos fluxos afetados.

## 9. Checklist de conclusão por alteração

- [ ] Código implementado no domínio correto.
- [ ] Sem duplicação desnecessária de regra ou componente.
- [ ] Permissões e RLS verificadas quando houver dados.
- [ ] Build de produção executado.
- [ ] Fluxo afetado testado.
- [ ] Migração SQL criada, se aplicável.
- [ ] Documentação atualizada.
- [ ] Commit com mensagem clara.

## 10. Histórico desta revisão

### 11/11/2026 — documentação inicial da arquitetura
- Conferidos `README.md`, `package.json`, `src/App.jsx`, `src/main.jsx`, `src/lib/db.js`, `src/lib/modelos.js`, `src/publico/roteador.jsx`, `src/supabaseClient.js` e `supabase/schema.sql`.
- Registrada a modularização já existente em `features/`.
- Corrigida a expectativa: `App.jsx` ainda concentra responsabilidades; a arquitetura modular é uma evolução em andamento.
- Definidas regras de documentação, segurança, migrações e validação para as próximas alterações.


## 11. Identidade e integrações — Avespet

A marca do software é **Avespet**. O nome “Criatório Dantas” pode continuar aparecendo como nome de um criatório cadastrado, mas não deve ser usado como nome da plataforma.

### Estado da renomeação em 11/11/2026

- [x] Projeto Vercel renomeado de `criatorio-dantas-cadastro` para `avespet`.
- [x] Domínios personalizados `avespet.com.br` e `www.avespet.com.br` continuam associados e verificados no mesmo projeto Vercel.
- [x] `package.json` e `package-lock.json` alinhados para o nome `avespet`.
- [x] Manifest PWA atualizado para exibir Avespet no nome e na descrição.
- [x] README atualizado com a identidade correta.
- [ ] Repositório GitHub ainda usa o nome legado `criatorio-dantas-cadastro`; renomeação e atualização do remote local ainda pendentes.
- [ ] Pasta local do projeto ainda precisa ser auditada e, se desejado, renomeada.
- [ ] Confirmar integração Git do projeto Vercel após a renomeação do repositório GitHub.
- [ ] Revisar URLs de redirecionamento do Supabase Auth somente depois de confirmar se o domínio público mudou. O domínio atual permanece `www.avespet.com.br`.

### Regras de segurança para a renomeação

1. Não criar outro projeto Supabase nem trocar o project ref ou as chaves por causa da mudança de marca.
2. Preservar o domínio público e os redirects de produção.
3. Não remover domínios antigos ou aliases até confirmar que não há dependências externas.
4. Após renomear o repositório, atualizar o remote local e validar `git remote -v`, `git fetch` e `git status`.
5. Fazer um deploy de validação e testar login, cadastro, rotas públicas, busca de anilha, aves perdidas e PWA.
6. Registrar qualquer alteração de Auth redirect URL e configuração de domínio antes de aplicá-la.

### Histórico — 11/11/2026

- Projeto Vercel renomeado para `avespet`, preservando o mesmo ID de projeto.
- Verificação posterior confirmou os domínios personalizados `avespet.com.br` e `www.avespet.com.br` ainda associados ao projeto.
- Identificados os nomes legados em `package.json`, `package-lock.json`, README e manifest PWA; documentação e metadados do pacote foram alinhados.
- Repositório GitHub e pasta local permanecem pendentes por dependerem da atualização do remote e da configuração local.


## 12. Área pública e redesign da página inicial — 12/11/2026

Documento operacional e checklist de aceite: [REDESIGN-HOME-PUBLICA.md](./REDESIGN-HOME-PUBLICA.md).

### Organização atual

- `src/components/AuthPage.jsx` continua sendo o ponto de entrada público: controla o cabeçalho, menu, modal de autenticação e escolhe o conteúdo pela rota.
- `src/publico/home/Inicio.jsx` concentra a composição visual da página inicial e recebe por propriedades os recursos já existentes (`BuscaAnilha`, `VitrinePublica`, `GuiasEmDestaque` e `onEntrar`).
- O roteador público continua em `src/publico/roteador.jsx`; links da nova home devem usar o componente `Link` com a propriedade `para`, não `href`.
- Páginas completas permanecem nas rotas já existentes: `/aves-a-venda`, `/guias`, `/videos`, `/achei-uma-ave`, `/aves-perdidas` e `/campanha-ave-perdida`. A home apresenta resumos e direciona para essas páginas, sem duplicar suas explicações.

### Direção visual e conteúdo

- Apresentação equilibrada para tutores/visitantes e criadores.
- Identidade visual clara com tons naturais de verde e superfícies neutras, preservando as rotas e os componentes funcionais existentes.
- Blocos da home: apresentação geral; proteção da ave; consulta de anilha; ferramentas do criador; vitrine pública; guias e vídeos; chamadas para cadastro.
- Fotografia real de aves em múltiplas espécies. As imagens externas atualmente referenciadas no componente precisam ser verificadas visualmente e avaliadas quanto a disponibilidade, licença, desempenho e estratégia de hospedagem antes da publicação definitiva.

### Implementação registrada nesta branch

- Criada `src/publico/home/Inicio.jsx` para separar a página inicial da composição de rotas.
- Atualizado `src/components/AuthPage.jsx` para carregar a nova home e manter os componentes e destinos públicos existentes.
- O cabeçalho e o rodapé adotam cores compatíveis com o fundo claro quando a rota é a home; as páginas internas mantêm o tema anterior nesta primeira etapa.
- Nenhuma tabela, política RLS, dado de usuário ou configuração de produção foi alterada.
- Branch de trabalho: `feature/homepage-redesign`.

### Validação e pendências

- [ ] Executar `npm run build` na branch.
- [ ] Conferir em desktop e celular: cabeçalho, navegação, imagens, cards, espaçamentos e chamadas.
- [ ] Testar cada link da home e confirmar que abre a página existente correta.
- [ ] Testar abertura e fechamento do login/cadastro a partir dos CTAs.
- [ ] Testar consulta de anilha e vitrine pública sem autenticação.
- [ ] Confirmar o fluxo real de cadastro de tutor e registro de ave perdida; não prometer cadastro de animal se o fluxo exigir uma conta ou etapa ainda não disponível.
- [ ] Revisar acessibilidade, carregamento e direitos/estabilidade das imagens externas.
- [ ] Gerar implantação Preview e validar antes de qualquer merge ou publicação.
- [ ] Atualizar este histórico após cada etapa de validação.

### Limitação de implantação em 12/11/2026

A tentativa de criar uma implantação Preview foi bloqueada pela Vercel por limite diário de API (`api-deployments-free-per-day`, resposta 402). Portanto, não existe URL Preview confirmada para esta branch e a validação visual/build ainda está pendente. A produção não foi modificada.

### Histórico — 12/11/2026

- Iniciada a reorganização da home em componente próprio.
- Criada a branch `feature/homepage-redesign` a partir de `main`.
- Adicionada a primeira composição modular da home e conectada ao roteamento público.
- Registrada a necessidade de validar os caminhos de cadastro de tutores e proteção das aves antes de afirmar que a funcionalidade está completa.


### Atualização de organização pública — 12/11/2026

- Criado `src/publico/ComponentesPublicos.jsx` para centralizar tokens visuais e componentes compartilhados entre páginas públicas.
- A página `src/features/aves-perdidas/pages/AvesPerdidas.jsx` foi adaptada para consumir esses componentes, mantendo seu serviço de listagem e suas regras de acesso.
- O botão de cadastro dessa página reutiliza o modal de autenticação existente via propriedade `onEntrar`.
- O plano e checklist detalhados estão em [REDESIGN-HOME-PUBLICA.md](./REDESIGN-HOME-PUBLICA.md).

## 13. Central de Comunicação por e-mail — Resend (17/11/2026)

> **Fase atual:** domínio verificado no Resend para **envio**. A Central de Comunicação, o recebimento de e-mails e as automações de campanhas **ainda não foram implementados**. Este registro é uma decisão arquitetural e um checklist de execução, não uma declaração de funcionalidade publicada.

### 13.1 Objetivo aprovado

Criar um módulo de comunicação inteiramente operado dentro do **Avespet / Master**, sem depender de Gmail como caixa operacional. A interface deve oferecer:

- Caixa de **Suporte**: receber, ler, classificar e responder a mensagens de `suporte@avespet.com.br`;
- Caixa de **Financeiro**: atendimento e comunicação relativa a cobranças/assinaturas em `financeiro@avespet.com.br`;
- Possível endereço `contato@avespet.com.br` para contato institucional;
- E-mails **transacionais**: boas-vindas, confirmação e avisos de conta, notificações operacionais e suporte. **Não alterar ou reimplementar o fluxo de redefinição de senha já estabelecido no projeto**;
- E-mails **de marketing**: convites para conhecer o Avespet, novidades e campanhas direcionadas a contatos autorizados, com descadastramento;
- Processamento **diário e automático** de filas e critérios de envio (não significa enviar um e-mail de marketing a cada contato todos os dias);
- Histórico, status, respostas, modelos, agendamento, relatórios, limites, auditoria e opção de pausar campanhas.

**Divisão de responsabilidades:** React/Vite no painel Master (interface); Supabase/PostgreSQL e Edge Functions (dados, autorização, filas, agendamentos); Resend (API de envio e serviço de recebimento). **Resend não é, por si só, uma caixa de entrada estilo Gmail**; a interface e a persistência de mensagens deverão ser implementadas pelo Avespet.

### 13.2 Configuração externa observada

- **Domínio:** `avespet.com.br`
- **Resend:** conta criada pelo responsável, região **São Paulo — sa-east-1**.
- **Status informado em 17/11/2026:** **Verified / Ready**. O painel indicou `DNS verified` às **00:16** e `Domain verified: Your domain is ready to send emails.`
- **DNS:** usuário cadastrou os registros no **Registro.br**; o painel Resend confirmou a verificação para envio. Não há validação de recebimento ainda.
- **Registro de autenticação:** TXT `resend._domainkey` (DKIM; chave pública omitida aqui para evitar repetição); CNAME `rsend` → `rsend-sae1.forge.rmta.net`; CNAME `send` → `send.forge.rmta.net`; TXT `_dmarc` → `v=DMARC1; p=none;`.
- **Site existente:** registros A `avespet.com.br` → `216.198.79.1` e CNAME `www.avespet.com.br` → `b1ef5ccfab51c26a.vercel-dns-017.com.` foram preservados conforme informado pelo usuário.
- **Vercel:** projeto `avespet`, domínios `avespet.com.br` e `www.avespet.com.br` associados e verificados. DNS externo com nameservers `a.sec.dns.br` e `c.sec.dns.br`.
- **Atenção:** status `Verified` do Resend significa aptidão para **envio**, não recebimento, integração com o Supabase, nem campanhas automáticas já ativas. A opção `Enable receiving` requer configuração adicional e verificação de MX/roteamento, sem sobrescrever registros usados por outros serviços.

### 13.3 Levantamento de código e banco antes da implementação

- **GitHub:** repositório atual `gustavo-dantas-br/avespet`. O documento preserva registros históricos do antigo nome; o repositório atual está confirmado.
- **Frontend:** `src/features/master/MasterApp.jsx` já lista a seção `Suporte`, mas em análise da branch `main` essa seção consta como funcionalidade prevista, não como caixa de e-mail implementada.
- **Supabase:** projeto principal `tnnpzitijvklbnwptsuq` com estado `ACTIVE_HEALTHY`, conferido em 17/11/2026.
- **Banco:** foram vistas `public.notificacoes`, `public.master_admins` e `public.master_audit_log`, todas com RLS, mas não foram identificadas tabelas específicas de conversas, caixas de entrada, consentimentos ou fila de e-mails.
- **Funções:** existem `send-push-notification` e funções Master; na lista inspecionada **não havia Edge Function de integração Resend**.
- **Limites:** não assumir volume gratuito ilimitado; parametrizar cotas, monitorar retorno da API e preservar margem para envio de e-mails essenciais.

### 13.4 Arquitetura proposta (a implementar)

1. **Persistência própria:** definir migrações versionadas para `comunicacao_contatos`, `comunicacao_conversas`, `comunicacao_mensagens`, `comunicacao_templates`, `comunicacao_campanhas`, `comunicacao_fila_envios`, `comunicacao_eventos` e `comunicacao_consentimentos` (nomes provisórios; verificar reutilização com tabelas existentes).
2. **Acesso:** autorização de Master deve ocorrer no servidor a partir de fonte confiável, com RLS nas tabelas expostas, políticas por recurso e logs na auditoria administrativa. Não autorizar a partir de dados editáveis no perfil.
3. **Envio:** criar Edge Function server-side com chave `RESEND_API_KEY` guardada em Supabase Secrets; validar destinatários, templates, permissões e limite; registrar ID externo, status, tentativas e erros. Não expor credenciais no React nem em variáveis `VITE_*`.
4. **Recebimento:** ativar recebimento no Resend quando adequado e criar webhook HTTPS com **verificação de assinatura**, deduplicação pelo ID do evento, recuperação segura do conteúdo da mensagem, proteção contra anexos perigosos e associação à conversa no banco. Prever falhas/reprocessamento.
5. **Automação diária:** `pg_cron` + `pg_net` chamando função autorizada, com segredo no Vault, ou outro agendador suportado. Selecionar somente itens elegíveis na fila, respeitando fuso `America/Sao_Paulo`, janela, consentimento e limite contratado. Operação idempotente para evitar duplicações.
6. **Marketing e LGPD:** consentimento/base legal documentada, origem e data de inscrição, mecanismo de cancelamento e lista de supressão; tratar descadastros, bounces e reclamações. Evitar listas compradas e disparo não solicitado; **separar identidade/fluxo de marketing dos e-mails essenciais de conta**.
7. **Interface:** nova seção `Central de Comunicação` no Master, reaproveitando padrão de menu e autenticação atuais; abas `Suporte`, `Financeiro`, `Campanhas`, `Modelos`, `Automações` e `Relatórios`, com estados de carregamento, histórico e filtros. Confirmar integrações com módulos de notificações e suporte existentes antes de alterar.
8. **Monitoramento:** logs sem tokens ou conteúdo sensível desnecessário, taxa de entrega, limites e alertas, tentativas com backoff, prevenção de envio repetido, botão de parada e auditoria.

### 13.5 Checklist de implementação e aceite

- [x] Criar conta Resend e selecionar região São Paulo.
- [x] Configurar DNS de envio no Registro.br.
- [x] Confirmar status `Verified / Ready` no Resend (relatado pelo responsável em 17/11/2026).
- [x] Conferir em leitura GitHub, Vercel e projeto Supabase correto.
- [ ] Testar envio de mensagem transacional controlada para endereço autorizado.
- [ ] Definir e validar endereços finais e política de remetentes/subdomínios.
- [ ] Avaliar `Enable receiving`, registros MX e webhooks sem quebrar DNS existente.
- [ ] Criar migrações/RLS, serviços, funções, UI de atendimento e templates.
- [ ] Separar marketing de transacionais, aplicar consentimento, descadastro e supressões.
- [ ] Implementar execução diária segura com limites e política de reprocessamento.
- [ ] Testar entrega/recebimento, autorização Master, falhas e integração no Preview.
- [ ] Atualizar README e, se útil, extrair a especificação para documento dedicado.
- [ ] Planejar publicação somente após revisão e aceite; evitar deploys desnecessários.

**Registro de alterações desta etapa:** apenas documentação no GitHub. **Não** foi configurada API Key, webhook, SMTP/Auth, Edge Function, SQL, campanha, recebimento, serviço de envio ou interface do Master. Não alterar o ambiente de produção apenas por causa deste registro.
