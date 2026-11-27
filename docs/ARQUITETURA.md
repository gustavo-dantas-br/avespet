# Arquitetura do Avespet

> Documento vivo da arquitetura. Atualizar este arquivo sempre que uma mudança estrutural, funcional ou de dados for feita.
>
> **Última revisão:** 11/11/2026  
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


## 13. Retomada do Painel Master — 16/11/2026

**Branch de desenvolvimento:** `feature/master-modulos-20261116` (base `535b769`).

### Integração 1 — Anúncios e moderação
- [x] Recuperado `AdsModeration.jsx` da branch histórica `feature/master-ads-moderation` e ligado à seção **Anúncios e moderação** de `MasterApp.jsx`.
- [x] Navegação Master preserva a visão geral e a gestão de criadores já existentes na `main`.
- [x] Filtros pendente/aprovado/rejeitado/todos e paginação de 20 anúncios por página; exibição de espécie, mutação, sexo, preço, criador e situação.
- [x] Aprovação, rejeição com motivo registrado em auditoria e retorno à análise por função exclusiva no Supabase.
- [x] Interface impede aprovar anúncio que o próprio criador desativou. Os demais privilégios e validações permanecem no servidor.
- [x] Código da Edge Function `master-manage-ads` incluído no repositório para rastreabilidade. Essa função **já estava ativa** no projeto Supabase antes desta integração; nenhuma função ou banco foi implantado por esta alteração.
- [x] `vercel.json` desabilita deploy automático **somente** para `feature/master-modulos-20261116`; `main` permanece com comportamento normal. A regra pode ser removida antes do merge final.
- [ ] Executar build local, testes de integração e conferir a moderação usando conta Master autenticada antes de levar à produção.
- [ ] Validar visualmente a tela no computador e celular em preview controlado, quando for necessário.
- [ ] Testar falha de permissão para conta não Master e conferir entradas na auditoria.
- [ ] Testar concorrência de moderação e retorno de erros HTTP da Edge Function.
- [ ] Considerar futura comunicação do motivo de rejeição ao criador, sem expor dados privados.

**Regras de segurança:** credenciais privilegiadas não vão para o front-end; o acesso continua validado pela identidade autenticada em `master_admins`; ações permanecem registradas em `master_audit_log`. Não alterar o legado `/admin` sem testes separados.

**Observação:** este registro documenta implementação em branch, não uma liberação em produção. Sem migrations, sem deploy manual da Vercel e sem execução de SQL modificador no Supabase.

### Integração 2 — Gestão de aves (consulta administrativa)
- [x] Recuperada a tela `BirdsManagement.jsx` com busca por nome, anilha, mutação, espécie e sexo; paginação de 25 registros por página.
- [x] Módulo adicionado à navegação Master sem interferir no cadastro e nas telas do criador.
- [x] Corrigido delimitador de linha inválido presente no JSX histórico antes da integração.
- [x] Função `master-list-birds` versionada no GitHub; já existe ativa no Supabase de produção e **não foi reimplantada**.
- [x] Consulta somente leitura, validada em `master_admins` no servidor, reduzida aos campos necessários, com auditoria no `master_audit_log`.
- [ ] Validar o build e testar busca/filtros, isolamento de acesso e comportamento em celular.

A branch `feature/master-modulos-20261116` continua sem publicação automática pela configuração presente em `vercel.json`. Produção e banco não foram alterados nesta etapa.

### Integração 3 — Contato de criadores (sem alterações em senhas)
- [x] Criada a coluna **Contato**, priorizando o WhatsApp comercial do criador; o telefone da conta Auth aparece como alternativa identificada.
- [x] A ficha mostra o WhatsApp mesmo quando não cadastrado e o separa do telefone de autenticação.
- [x] O WhatsApp é editável no perfil comercial, sem modificar o login nem o e-mail de autenticação.
- [x] Pesquisa administrativa pode localizar criadores por número.
- [x] Conforme decisão do projeto, o fluxo existente de **redefinição de senha permanece inalterado** em relação à versão anterior a esta integração.
- [ ] Validar build, busca, edição e campos vazios em um ciclo de testes agrupado antes da publicação.
- [ ] O ajuste do backend de listagem e edição do WhatsApp deve ser publicado junto com o frontend em futura atualização controlada.

Esta alteração é apenas código em branch; **sem deploy na Vercel, sem alteração no Supabase em execução e sem mudanças no banco**.

### Integração 4 — Aves vinculadas e histórico administrativo por conta

**Objetivo:** permitir que o Master consulte as aves e as ações administrativas vinculadas a um criador, sem consultar diretamente dados privilegiados do navegador.

- [x] Nova aba **Aves vinculadas** dentro da ficha de cada conta, com nome, espécie, mutação, sexo, anilha, status, atualização e paginação de 15 registros.
- [x] Nova aba **Histórico Master**, com eventos de auditoria, data/hora, autoria indicada e motivo quando registrado.
- [x] Criada Edge Function `master-creator-details` que verifica JWT, autorização em `master_admins`, UUID e existência da conta; mantém a segregação de contas administrativas.
- [x] A função faz leitura somente das aves do usuário selecionado e eventos de auditoria associados àquele usuário. Nunca devolve o JSON bruto das aves, evitando vazar informações de vendas, compradores, fornecedores, fotos e outros dados privados.
- [x] Toda visualização é registrada na auditoria; as próprias visualizações são omitidas da aba de histórico para não gerar ruído.
- [x] Os componentes somente são montados quando o Master abre a ficha, evitando consultas desnecessárias.
- [x] Nenhuma modificação na redefinição de senha, no fluxo de autenticação existente ou em `master-manage-creator`.
- [ ] Executar build Vite e validação manual das abas com conta Master e com conta comum sem permissão.
- [ ] No momento de publicação conjunta, implantar a Edge Function `master-creator-details` (JWT habilitado) e as funções de listagem/edição de WhatsApp preparadas anteriormente.
- [ ] Conferir paginação, estados vazios, conta sem perfil e audit trail depois da publicação.

**Situação:** somente código preparado em `feature/master-modulos-20261116`; nenhum deploy Vercel/Supabase e nenhuma alteração em tabelas ou usuários em produção.


### Integração 5 — Planos provisórios a R$ 0,00 (17/11/2026)

- [x] Módulo **Planos e assinaturas** integrado à navegação do Master, recuperando a interface já desenvolvida na branch histórica.
- [x] Catálogo inicial preparado com **Gratuito**, **Essencial** e **Profissional**, todos com `price_cents = 0` (R$ 0,00); nomes Essencial/Profissional são provisórios.
- [x] Somente o plano Gratuito (`free`) é cadastrado como ativo; Essencial e Profissional permanecem **inativos**, não contratáveis e sem receita.
- [x] O plano gratuito tem limite **configurado como referência** de 10 aves na tabela de futuros planos; **nenhum limite novo é imposto aos criadores da produção** nesta implementação.
- [x] Campos de preço e disponibilidade indisponíveis na interface, enquanto a precificação não for aprovada.
- [x] Regras adicionais nos arquivos de backend e SQL rejeitam preços diferentes de R$ 0,00 e ativação de modalidades futuras; funções disponíveis: consultar, cadastrar e editar catálogo (Master).
- [x] Estrutura histórica do catálogo versionada para implantação futura. **Não há processamento de pagamentos, atribuição automática de assinaturas nem checkout.**
- [ ] Validar build e testar a Edge Function `master-manage-billing` depois de configurar um ambiente de teste com as tabelas.
- [ ] Conferir rigorosamente política de leitura autenticada e auditoria de operações em ambiente de teste.
- [ ] Antes de publicar: revisar/aprovar aplicação da migração `202611130001_platform_plans_subscriptions.sql`, implantação da função e integração de UI em um lote único, sem alterar políticas existentes de aves.
- [ ] Após definir preços, criar uma **nova migração** para retirar os bloqueios provisórios de preço/ativação, nunca simplesmente alterar valores na produção.

**Importante:** nem a migração nem a função foram executadas em produção. Não há qualquer mudança financeira nem cobrança nos criadores atuais. A redefinição de senhas permanece intocada.

### Publicação controlada — edição de contato separada da senha
- A atualização do contato comercial utiliza a função específica `master-update-creator-profile`, protegida por autenticação e validação Master.
- `master-manage-creator` permanece idêntica à implementação preexistente da `main`, inclusive no fluxo de redefinição de senha, atendendo à decisão explícita de não alterá-la.
- A função de perfil não modifica senha, telefone Auth, `user_metadata` ou `app_metadata`, somente o perfil comercial.
- Configuração temporária para suprimir previews foi retirada de `vercel.json` antes da publicação.


## Painel Master e Central de Comunicação — implantação de 17/11/2026

- Publicação sobre a `main` que contém a genética Ring Neck e correções de tela branca. Não alterar a calculadora ou o fluxo preexistente de redefinição de senha.
- Módulo **Suporte operacional**: acompanhamento interno dos casos de aves encontradas, perdidas e campanhas, sem comunicação externa automática; triagem com status, prioridade, responsável e notas privadas.
- Módulo **Auditoria e segurança**: leitura de histórico administrativo sem enviar dados de `metadata` ao navegador.
- Módulo **Planos e assinaturas**: aba **Permissões especiais** para preparar exceções individuais; tais exceções não aplicam bloqueios automaticamente; planos com preço R$ 0,00 e somente Gratuito ativo.
- Estruturas `master_support_cases` e `creator_entitlement_overrides` criadas no Supabase com RLS, sem SELECT para `anon` ou `authenticated`. Migração aplicada como `master_support_and_entitlement_overrides_20261117`; versões SQL guardadas no repositório.
- Backend `master-support-operations`, `master-audit-events`, `master-manage-entitlements` e `master-resend-test` exigem JWT e autorização na tabela `master_admins`. Somente `service_role` recebe acesso às tabelas internas; na auditoria foi concedida consulta somente às colunas necessárias para operações Master.
- **Central de e-mails**: envio de teste `suporte@avespet.com.br` para a conta Master confirmado pelo usuário. As caixas Resend `suporte@avespet.com.br` e `financeiro@avespet.com.br` foram criadas, mas a leitura de conversas e respostas dentro do Master seguem pendentes da API de Inboxes e da verificação completa de recebimento MX; sem disparos de marketing.
- Atualizar esta documentação antes de ativar cobrança ou bloqueios. Alterações na produção não devem sobrescrever funcionalidades de genética nem ativar campanhas sem consentimento.

### Correção do cadastro de clientes e criação durante a reserva — 17/11/2026

- [x] Corrigida a tela branca de **Novo cliente** em `ClientesTab`: o componente agora recebe `inputStyle` de `App.jsx`, evitando `ReferenceError` quando o formulário é aberto.
- [x] Na tela de **Reservas**, adicionada a opção **Cadastrar novo cliente** ao lado da seleção. Os campos incluem nome, telefone/WhatsApp, endereço e observações.
- [x] O novo cadastro é persistido em `clientes` antes de liberar seu `id` para a reserva; o cliente aparece automaticamente selecionado após o sucesso.
- [x] Regras de nome obrigatório e telefone duplicado mantidas também no fluxo de reserva. Se a gravação do cliente falhar, a reserva não recebe um `cliente_id` sem cadastro.
- [x] Nenhuma alteração na tabela de aves, pagamentos, fluxo de reserva, genética, Master, redefinição de senha ou integração de e-mail.
- [ ] Conferir build Vite e testar o cadastro no desktop e no celular com usuário criador autenticado.

### Correção preventiva de telas brancas no Painel do Criador — 17/11/2026

- [x] Reforçado o carregamento de **Meu Plantel** e dos cartões de aves com importação estática, evitando erro de download de chunk após a atualização do PWA neste menu crítico.
- [x] Novo componente de segurança `PanelErrorBoundary` envolve o conteúdo dos menus e a raiz do aplicativo. Em falhas de renderização ou importação mostra uma mensagem de recuperação, com botão para atualizar a aplicação, sem apagar dados.
- [x] Proteção reinicializada quando o usuário troca de aba (chave `tab`), evitando que um problema numa tela paralise todas as outras.
- [x] Incluído teste de renderização SSR das principais telas do criador, inclusive os filtros do Plantel, no CI do build.
- [x] Dados das aves verificados em leitura no Supabase: 58 registros com campos principais em tipos JSON compatíveis, sem alteração de dados.
- [ ] Validar os testes CI após abertura de PR e executar teste interativo com criador autenticado (PWA/celular e desktop).
- [ ] Integrar a correção na produção após validação e conferir a atualização dos assets pela Vercel.

**Observação:** a falha de carregamento de chunk/PWA é uma hipótese compatível com os sintomas, não foi reproduzida com acesso a uma sessão real. O erro exato no navegador deve ser verificado caso persista.


### Publicação — Central de Comunicação Resend (17/11/2026)

- [x] Integrada à `main` atual, preservando correções do Plantel, cadastro de clientes, reservas, genética e redefinição de senha.
- [x] Caixa de entrada Suporte e Financeiro com leitura de conversas e mensagens, resposta manual e botão **Novo e-mail** (destinatário, assunto e texto), sempre com confirmação antes de enviar.
- [x] Assinatura automática HTML e alternativa texto: pena verde provisória hospedada no site, Avespet, setor, endereço, site oficial e Instagram `@avespet.oficial`.
- [x] Edge Function `master-resend-inboxes`: JWT e autorização Master, chave `RESEND_INBOX_API_KEY` apenas no servidor, destinatário único, limites de 10 novos e-mails/hora e 15 respostas/hora por Master e registros de auditoria sem corpo da mensagem.
- [x] Envio de novo e-mail e resposta ao Gmail/Yahoo validados manualmente pelo proprietário em Preview. Validação de autenticação nos cabeçalhos Yahoo mostrou SPF/DKIM/DMARC PASS, mas classificação na pasta spam ainda requer monitoramento da reputação e boas práticas.
- [ ] Conferir acesso com sessão Master na produção, validar carregamento da imagem e testar também a caixa Financeiro.
- [ ] Campanhas e disparos em massa continuam desligados até existir consentimento explícito, descadastro, segmentação e acompanhamento de entregabilidade.

### Correção de histórico e importação de contatos — 17/11/2026

- [x] Removida a expressão regular incorreta `/\\D/g` nos módulos **Clientes** e **Fornecedores**; ambos utilizam agora o normalizador já consolidado em `src/lib/telefone.js` (`/\D/g`).
- [x] Compras/vendas antigas com telefone formatado de forma diferente passam a ser identificadas no histórico dos respectivos clientes/fornecedores, quando ainda não possuem vínculo explícito por ID.
- [x] A importação de compradores/fornecedores não deve oferecer novamente contatos já existentes com o mesmo telefone em formatos diferentes.
- [x] Adicionados testes com números formatados, vínculos existentes, números diferentes e sugestões de importação, integrados ao comando `npm run test:painel`.
- [ ] Executar testes da PR antes de integrar ao site oficial. Testes de interface com sessão real de criador continuam como validação complementar.

**Escopo:** não altera registros, reservas, plantas, permissões de Master, e-mail nem redefinição de senha. Sem migrações ou novo serviço.


### Aprovação com confirmação por e-mail (17/11/2026)

- E-mail de acolhimento transacional de anúncios de aves perdidas; nunca uma oferta ou campanha em massa. Envio via Resend (`RESEND_API_KEY`) a partir da função `notify-approved-lost-bird`.
- `src/lib/db.js` encaminha apenas a ação de **aprovar** ao servidor. Demais mudanças de status não são alteradas. A Edge Function exige JWT, confirma vínculo a `admins` ou `master_admins`, aplica transição de estado e grava uma chave única por anúncio em `aves_perdidas_emails_aprovacao`. O e-mail não é repetido em novas aprovações.
- Envio somente para e-mail validado nos dados privados disponíveis ou para e-mail **confirmado** da conta vinculada; se não houver, a aprovação continua sem envio (`no_email`). Anúncios já aprovados anteriormente não recebem mensagens retroativas.
- **Privacidade importante:** o campo `anuncios_aves_perdidas.data` é alcançável via acesso público a anúncios aprovados. **Não armazenar e-mails novos nesse JSON.** A futura coleta de contato de visitantes anônimos deverá usar armazenamento privado e função controlada, sem ampliar dados pessoais da página pública.
- Conteúdo: solidariedade, publicação gratuita, orientações e link genérico para `/aves-perdidas`; sem oferecer campanha paga automaticamente e sem link de edição até a outra implementação concluir sua autorização.
- Logs privados: e-mails não registrados na tabela de idempotência; status `processing`, `sent`, `failed` ou `uncertain`. Não reenviar automaticamente após erro incerto sem conciliação no Resend.
- Esta etapa não altera formulário de cadastro nem edição de anúncios; requer validação de aprovação real e confirmação de entrega com cadastro autenticado.


### Cadastro público integrado à conta do criador — 17/11/2026

- A página pública de aves perdidas permanece acessível aos visitantes. A pessoa preenche todas as informações e fotos antes de criar uma conta.
- No mesmo formulário, são exibidos e-mail e senha (mínimo de oito caracteres) e a alternativa **Já tenho conta**. Nome e WhatsApp do anúncio são reutilizados no cadastro Supabase Auth, sem exigir preenchê-los novamente.
- O rascunho é conservado no `localStorage` do navegador por até 72 h enquanto ocorre a autenticação, incluindo eventual confirmação de e-mail. **Senha e tokens não são guardados**. Ao entrar na conta com o mesmo e-mail, o anúncio é enviado com `user_id`, status `pendente` e UUID persistido; somente então sai do rascunho local.
- Após a autenticação, o painel do criador abre a aba **Ave perdida**, mostra o aviso de recebimento e permite acompanhar ou editar a ocorrência. A edição existente de anúncios permanece inalterada.
- O cadastro no frontend e a política de inserção anônima na tabela devem impedir novos registros sem conta. RLS autenticada existente exige `user_id = auth.uid()` e `status = pendente`.
- A mensagem automática de aprovação utiliza o e-mail confirmado do Auth, sem expô-lo no JSON do anúncio. Anúncios anônimos históricos não são vinculados automaticamente.
- Nenhuma campanha paga é ativada; o fluxo de cadastro geral, senha temporária Master, genética e demais módulos não foram alterados.
- Testes pendentes: usuário novo (com e sem confirmação de e-mail), login de usuário existente, retorno após confirmação, recuperação do rascunho, sincronização de status, edição e tentativa de inserção anônima rejeitada.


### Limite de e-mails do Supabase Auth identificado em 17/11/2026

- Nos logs de Auth houve `429 over_email_send_rate_limit` em `POST /signup`. O Resend já usado pelas Edge Functions do Master **não** atende ao Supabase Auth automaticamente.
- O provedor integrado de demonstração do Supabase impõe 2 e-mails de autenticação por hora para todo o projeto e restringe destinatários. Para produção, habilitar SMTP próprio do Resend em **Supabase > Authentication > SMTP Settings**; configurar remetente verificado, `smtp.resend.com`, porta `465` (ou `587` se necessário), usuário `resend`, senha = chave de API Resend. Não compartilhar a chave em código, chat ou commit; configurar somente no dashboard e ajustar os limites de Auth de forma conservadora.
- Não desabilitar a verificação de e-mail para contornar a limitação. O registro da ave fica temporariamente no navegador durante a confirmação e é vinculado ao perfil após entrar na conta.
- Correção visual do formulário de cadastro de ave perdida: rótulos de e-mail e senha separados e mensagem amigável de limite de envio. O problema do SMTP continuará até completar a configuração no Auth do Supabase.


### Pós-cadastro de ave perdida: confirmação de e-mail (17/11/2026)

- Após `auth.signUp` aceito com sessão nula, o formulário público é substituído por uma tela de confirmação com título destacado, e-mail utilizado, instruções para conferir spam e aviso de que a ave ainda não foi submetida ao Master.
- A confirmação pendente persiste em `localStorage` com o rascunho (sem senha). Ao retornar ou recarregar, a tela continua; após confirmar, o botão de login abre o modal Avespet preenchido com o endereço do rascunho.
- **Não recebi o e-mail** chama `supabase.auth.resend({type: "signup"})`, com bloqueio local de repetição em 60 segundos e mensagens adequadas de erro.
- **Digitei o e-mail errado/não tenho acesso** volta ao formulário preservado para criação de nova conta com outro endereço; não tenta alterar a identidade de uma conta sem autenticação.
- O anúncio só é criado após uma sessão válida, com `user_id` do titular e status `pendente`; após autenticar, o usuário abre a área do criador. Manter SMTP Resend e confirmação de e-mail ativados.


### Aviso de entregabilidade dos e-mails de confirmação — 17/11/2026

- Após teste de confirmação com entrega na pasta de Spam, a tela pós-cadastro de ave perdida destaca um aviso **“Não encontrou o e-mail? Veja o SPAM!”** com orientações para conferir Spam, Lixo eletrônico e Promoções e marcar a mensagem como “Não é spam”.
- Avisos similares são exibidos no cadastro geral, na recuperação de senha e após reenvio de confirmação. A mensagem não substitui a confirmação do endereço e não altera a segurança da autenticação.
- A marcação “Não é spam” pode ajudar, mas não garante entrega. Para melhorar a reputação, verificar futuramente SPF, DKIM e DMARC e a configuração do domínio de envio no Resend.


### Moderação de aves perdidas no Master — 17/11/2026

- O Master agora possui menu próprio **Aves perdidas**, separado de **Anúncios e moderação** (que permanece para anúncios de venda).
- A função `master-lost-birds` lista ocorrências paginadas, com status, vínculo à conta e situação registrada de e-mails transacionais. Exige sessão Supabase e acesso `master_admins` confirmado no servidor.
- A aprovação usa exclusivamente a função existente `notify-approved-lost-bird`, responsável pela transição de status, idempotência e confirmação por Resend. O Master exibe o resultado de envio ou a ausência de e-mail. Não há aprovação automática de anúncios pendentes.
- Rejeitar, encerrar ou voltar à análise utiliza a função `master-lost-birds`, com confirmação do operador, justificativa obrigatória para rejeição e auditoria antes da alteração.
- Os anúncios históricos permanecem intactos, inclusive aqueles sem conta vinculada. O anúncio fictício “Mara teste” ficou pendente aguardando decisão explícita do Master.
- Verificar na produção os filtros, aprovação manual e aceite do provedor, inclusive entregabilidade em spam. Nenhuma campanha paga foi ativada.


### Teste seguro de e-mail na moderação Master — 17/11/2026

- A aba **Master > Aves perdidas** oferece **Testar e-mail**, com confirmação do operador. O teste chama a Edge Function existente `master-resend-test` (requer acesso Master, limita 3 testes/hora e envia exclusivamente ao endereço autenticado do administrador).
- O botão não altera anúncios, não aprova ocorrências fictícias e não utiliza contatos dos tutores. Sua finalidade é verificar apenas o envio básico do Resend; o e-mail específico de aprovação continua dependendo de uma aprovação real e consentida.
- Mensagens explicam que aceitar o envio pelo provedor não equivale à entrega na caixa principal; verificar spam e registros de entrega. Nenhum segredo é exposto no navegador.


## 18. Landing page comercial — aves perdidas (27/11/2026)

### Escopo desta entrega

- A rota pública existente `/aves-perdidas` foi reorganizada como landing page comercial, sem criar rota paralela nem alterar o roteador.
- Arquivo principal: `src/features/aves-perdidas/pages/AvesPerdidas.jsx`.
- A página apresenta hero com chamada para cadastro gratuito, explicação do fluxo, benefícios, planos pagos, cadastro, anúncios publicados, FAQ e CTA final.
- A identidade visual utiliza os tokens de `src/publico/ComponentesPublicos.jsx` e mantém o padrão verde/branco do Avespet.
- SEO da rota é aplicado com `useSEO` de `src/publico/seo.js`, com título, descrição, Open Graph e canonical.
- A vitrine pública continua usando `listarAvesPerdidas()` e a RPC `listar_aves_perdidas_publicas`; não foi criada consulta direta dos dados privados dos tutores.

### Catálogo de planos e compatibilidade

- A fonte oficial dos planos e preços publicados é `public.campaign_packages`.
- O serviço `listarPacotesPublicos()` em `src/features/campanhas/services/campanhasService.js` consulta somente campos de apresentação, filtra `is_published = true` e ordena por `sort_order`.
- A policy RLS existente `catalogo publicado somente leitura` autoriza SELECT público apenas quando `is_published = true`. A página não recebe permissões de escrita no catálogo.
- Os códigos persistidos e aceitos no schema legado são `destaque`, `bairro`, `cidade` e `regional`. Não substituir esses identificadores por slugs comerciais como `local` ou `intensiva` sem migração compatível.
- `src/features/campanhas/config/pacotes.js` recebeu a opção histórica `destaque`, pois esse código já é aceito pela constraint da tabela de solicitações.
- O CTA dos cards envia o código do plano em `/campanha-ave-perdida?pacote=<code>`; `SolicitarCampanha.jsx` lê o parâmetro e pré-seleciona a opção correspondente.
- O formulário de campanhas continua sendo uma solicitação de orçamento/contato, não uma contratação nem um checkout. A RLS existente exige `status = solicitada`, `valor IS NULL` e campos de contato dentro dos limites. A interface informa que nenhuma cobrança ocorre nessa etapa.
- O preço apresentado na LP é lido do catálogo publicado; não é enviado como preço confiável pelo navegador. A solicitação atual ainda não grava `catalog_price_cents` nem `catalog_snapshot`; isso deve ser implementado em fluxo servidor-side antes de qualquer contratação com preço fixo.

### Dados públicos, privacidade e LGPD

- A página informa que telefone, e-mail e anilha não são exibidos na vitrine pública e que o contato é intermediado pelo Avespet.
- A página informa expressamente que as fotos do bucket público podem ser acessadas por URL e orienta enviar somente fotografia da ave, sem documentos, rostos ou informações pessoais.
- A localização exibida é aproximada, conforme projeção pública já utilizada.
- Este aviso de interface não equivale a uma auditoria jurídica ou a um registro completo de consentimento. Antes da publicação comercial definitiva, validar a Política de Privacidade publicada, base legal e finalidade de cada tratamento, consentimento específico quando aplicável para divulgação de imagem/localização e consentimento de marketing separado e opcional.
- O formulário atual de cadastro continua sendo o existente em `PerdiUmaAve.jsx`; não houve alteração de autenticação, upload, Storage ou persistência de dados nesta entrega.

### Banco e infraestrutura

- Consultas realizadas em modo de leitura confirmaram as tabelas `campaign_packages`, `solicitacoes_campanhas_aves`, `anuncios_aves_perdidas`, `campaign_order_operations` e `campaign_order_events`.
- RLS está habilitada nas tabelas consultadas. A policy pública do catálogo restringe leitura a pacotes publicados; solicitações públicas permitem INSERT controlado, sem SELECT público; anúncios mantêm leitura pública por RPC e leitura do tutor/admin conforme policies existentes.
- Nenhuma tabela, policy, função, trigger, bucket ou dado do Supabase foi alterado.
- Nenhuma variável, domínio, configuração ou deployment da Vercel foi alterado. O projeto Vercel consultado é `avespet`, framework Vite, com domínios `avespet.com.br` e `www.avespet.com.br`.
- A branch de trabalho desta entrega é `feature/lp-aves-perdidas`, criada a partir de `feature/impulsionamento-aves-perdidas`.

### Validação pendente

- [ ] Executar `npm run build` e testes automatizados na branch.
- [ ] Validar visualmente em desktop e celular.
- [ ] Testar leitura pública do catálogo com usuário anônimo e indisponibilidade do catálogo.
- [ ] Testar pré-seleção dos quatro códigos e envio de solicitação de orçamento sem cobrança.
- [ ] Validar a URL e o conteúdo da Política de Privacidade.
- [ ] Definir e implementar registro de consentimentos aplicáveis, sem misturar consentimento de marketing com tratamento necessário ao serviço.
- [ ] Conferir métricas de alcance e sua comunicação como estimativas, não garantias.

### Histórico de implementação — 27/11/2026

- Criada branch `feature/lp-aves-perdidas`.
- Transformada a página pública existente em landing page e conectada a consulta pública do catálogo.
- Corrigida compatibilidade do código `destaque` e pré-seleção do pacote vindo da LP.
- Atualizada esta documentação e `docs/IMPULSIONAMENTO-AVES-PERDIDAS.md`.
- Não houve merge, deploy manual, migration, alteração de produção, cobrança ou campanha Meta.


## Revisão funcional e validação — 27/11/2026

### Revisão adicional do fluxo de campanha

- O formulário `SolicitarCampanha.jsx` agora consulta `listarPacotesPublicos()` e apresenta nome, descrição, prazo, raio/alcance, faixa estimada e preço do catálogo publicado.
- O plano passado por query string é pré-selecionado somente se ainda estiver publicado; caso contrário, o primeiro pacote publicado é selecionado.
- Se não houver pacotes publicados ou se a consulta falhar, o formulário informa a indisponibilidade e desabilita o envio. Não usa mais uma lista estática para permitir solicitação de pacote que não está publicado.
- Antes do INSERT, o frontend verifica se o código escolhido existe na lista publicada carregada. Essa validação de interface não substitui validação server-side; a tabela de solicitações ainda precisa validar o código e o snapshot de preço no servidor antes de qualquer contratação.
- A lista de rótulos locais foi alinhada aos códigos e nomes do catálogo oficial: `destaque`, `bairro`, `cidade`, `regional`.
- O fluxo segue sendo solicitação de orçamento, sem cobrança, checkout ou ativação automática.

### Rota pública

- Confirmado em `src/components/AuthPage.jsx` que `/aves-perdidas` renderiza `AvesPerdidas` e `/campanha-ave-perdida` renderiza `SolicitarCampanha`.
- O visitante sem sessão é direcionado ao conteúdo público pelo `AuthPage`; a rota não depende de estar logado.
- Os links internos usam o componente `Link` de `src/publico/roteador.jsx`, que atualiza a rota sem recarregar a aplicação.

### Privacidade — pendência bloqueadora antes da divulgação comercial

- A busca no repositório por arquivo/rota de Política de Privacidade não encontrou um destino verificável. Não foi criado link fictício.
- A LP explica que os contatos do tutor não são exibidos e que fotos no bucket público podem ser acessadas por URL, mas isso não substitui política publicada nem coleta/registro de consentimentos.
- Antes de liberar campanha comercial, identificar ou criar a Política de Privacidade em rota pública, revisar o texto e incluir link direto junto ao cadastro; revisar consentimento de publicação de dados/foto e eventual consentimento de marketing separado e opcional.
- O formulário de campanha também coleta dados pessoais para contato; a finalidade, retenção, canal de atendimento e compartilhamento com plataformas de mídia precisam constar na política e nos avisos adequados.

### Build e testes

- O primeiro build do preview da branch passou em 27/11/2026, com avisos existentes de chunk principal acima de 500 kB e importação estática/dinâmica do módulo de aves perdidas.
- Uma alteração posterior no formulário gerou falha de sintaxe JSX; a causa foi uma quebra de linha literal inserida no arquivo. A sintaxe foi corrigida e a branch recebeu novo commit. A validação do build do commit corrigido ainda está pendente.
- GitHub Actions não retornou workflow associado ao commit consultado; não há evidência de testes automatizados executados por Actions.
- Não foi executado teste autenticado/anônimo ponta a ponta nem teste de envio de solicitação no Supabase.
- A URL de preview é gerada pela integração Git da Vercel. O acesso externo automatizado à página não foi confirmado; é necessária conferência visual no navegador.


### Retificação da validação do build — 27/11/2026

- O deployment Preview da Vercel associado ao commit `a1f8aaf8d0733583d0833e2774123edce6a07546` concluiu com estado `READY`.
- O log confirma execução de `npm run build`, Vite 5.4.21, transformação de 1.627 módulos e geração dos artefatos de produção. Portanto, a pendência anterior de build está encerrada para esse commit.
- Permanecem avisos não bloqueantes: configuração npm `cache-dir`, script de instalação do esbuild não aprovado na configuração npm e importação estática/dinâmica simultânea de `src/features/aves-perdidas/index.js`. Não foram corrigidos nesta etapa para evitar mudanças fora do escopo.
- O preview é `https://avespet-9b7q8enfe-gustavo-dantas.vercel.app`; ele não é o domínio de produção.

### Revisão de consentimento e dados institucionais

- A revisão do formulário `PerdiUmaAve.jsx` identificou avisos sobre privacidade e gratuidade, mas não encontrou no trecho de cadastro inicial um consentimento explícito e separado para publicação dos dados/imagem da ave nem link verificável para Política de Privacidade.
- O checkbox de autorização localizado no módulo refere-se à publicação opcional de relato/nota de reencontro; não deve ser tratado como autorização geral do anúncio de ave perdida.
- Não criar política jurídica com dados presumidos. Para redigir e publicar uma política correta, confirmar razão social/nome do controlador, CNPJ (se aplicável), endereço/canal institucional de contato, canal para solicitações de titulares e eventuais operadores/serviços terceiros envolvidos.
- O cadastro deve distinguir: (1) tratamento necessário para receber, analisar e administrar o anúncio; (2) autorização específica e destacada para publicar a foto e os dados não sensíveis da ave/localização aproximada; (3) marketing opcional, sem condicionar o cadastro gratuito.
- Até esses pontos serem resolvidos, manter a LP em preview e não anunciar a funcionalidade como pronta para lançamento comercial.


### Identificação do controlador — informação fornecida pelo responsável do projeto (27/11/2026)

- Controlador indicado para o Avespet: **NEBULA CLW LTDA**.
- CNPJ informado: **67.073.285/0001-61**.
- Esta identificação foi fornecida pelo responsável do projeto e ainda não foi conferida em fonte cadastral externa.
- Endereço e e-mail institucional para privacidade foram informados em 27/11/2026 e registrados na seção “Política de Privacidade e autorização de publicação” abaixo.
- A página pública inicial de Política de Privacidade foi criada na branch de desenvolvimento; a revisão jurídica e a confirmação de operadores, retenção e fluxos permanecem pendentes antes de produção.


## Política de Privacidade e autorização de publicação — 27/11/2026

- Controlador informado pelo responsável do projeto: NEBULA CLW LTDA, CNPJ 67.073.285/0001-61.
- Endereço informado: Rua Celestino Marinelli, 10 — Parque São Domingos, São Paulo/SP — CEP 05126-120.
- Canal informado para privacidade: contato@nebulaclw.com.
- Criada a página pública `/privacidade` em `src/publico/PoliticaPrivacidade.jsx`, com identificação do controlador, categorias de dados, finalidades, exposição pública, imagens, compartilhamento, retenção, direitos e contato.
- A rota é renderizada em `src/components/AuthPage.jsx` e o link está no rodapé público.
- Os formulários de cadastro de ave e de solicitação de campanha passaram a apontar para a Política de Privacidade.
- No formulário de ave perdida, a autorização específica para publicar dados da ave, fotografia e localização aproximada é exigida antes do envio. O registro é incluído no JSON `anuncios_aves_perdidas.data.consentimentoPublicacao`, com versão `2026-11-27` e timestamp ISO, junto ao anúncio. O aceite não é consentimento de marketing.
- A autorização cobre publicação do anúncio e imagem em bucket público. O usuário é avisado de que a URL da fotografia pode ser acessada por terceiros; recomenda-se não enviar documentos, rostos ou conteúdo pessoal.
- A solicitação de campanha informa finalidade de contato e liga para a política; não há checkbox de marketing nem contratação automática.
- A política é uma versão inicial informativa, não um parecer jurídico. Antes de produção, revisar com assessoria jurídica e confirmar operadores/suboperadores, países de processamento, prazos concretos de retenção, procedimentos de incidentes, canal do encarregado quando aplicável e texto final de bases legais.
- Nenhuma migration ou mudança de schema foi necessária: o consentimento do anúncio é guardado no campo JSON `data` já existente. Não foi alterada a configuração do Supabase.
- Endereço, CNPJ e e-mail foram informados pelo responsável do projeto; não houve validação cadastral externa.


### Validação do preview com Política de Privacidade — 27/11/2026

- O commit `bdc7ff3564e8ae1eb90ca37250dba628c24c4142` concluiu build na Vercel com estado `READY`.
- O log registra `npm run build`, Vite 5.4.21, transformação dos módulos e geração do service worker/PWA. Build concluído sem erro.
- Preview: `https://avespet-fpo8v1kgu-gustavo-dantas.vercel.app`.
- A rota `/privacidade` foi adicionada ao roteamento público. O rodapé inclui link para a política.
- O build apresenta aviso de chunk principal acima de 500 kB (594,55 kB minificado), além dos avisos de configuração npm já registrados; não bloqueiam a compilação.
- Acesso HTTP externo automatizado à rota não foi confirmado nesta sessão; a conferência visual em navegador continua pendente.
- A versão de Política de Privacidade ainda requer revisão jurídica e validação de inventário de operadores, países de processamento, retenção e bases legais antes de produção.
- Não houve merge, alteração no Supabase, migration ou publicação no domínio de produção.
