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

## 12. Planos, assinaturas e pagamentos da plataforma

A gestão comercial do AvesPet é separada do módulo financeiro dos criadores.

- `platform_plans`: catálogo de planos, preço em centavos, periodicidade, limite de aves e permissões funcionais em JSON.
- `creator_subscriptions`: vínculo do criador com um plano e estado da assinatura.
- `platform_payment_records`: histórico de cobranças e pagamentos, preparado para futura integração com gateway.
- O plano gratuito inicial é criado com limite de 10 aves e permissões essenciais. Os recursos avançados ficam configuráveis no catálogo; a divisão inicial deve ser revisada conforme a oferta comercial evoluir.
- `max_birds = NULL` representa ausência de limite de aves.
- O catálogo ativo pode ser consultado publicamente; assinatura e pagamentos são visíveis somente ao próprio criador por RLS.
- Alterações administrativas de planos, assinaturas e pagamentos devem ocorrer no servidor, com validação de vínculo em `master_admins` e registro de auditoria. Não confiar em bloqueios somente na interface.
- Nenhum gateway de pagamento está integrado nesta etapa. Não há preço de plano pago definido nesta migração.
- A migração `202611130001_platform_plans_subscriptions.sql` foi adicionada à branch de desenvolvimento. Ela ainda não foi aplicada ao projeto Supabase.

Próximas etapas: criar o serviço administrativo protegido para manutenção do catálogo, construir a interface Master de planos e permissões, e depois implementar a atribuição de assinatura e enforcement de limites/recursos no servidor. Antes de aplicar a migração, comparar seu conteúdo com o schema real do projeto Supabase e revisar as políticas RLS.

### Administração do catálogo no Painel Master

A tela `src/features/master/BillingManagement.jsx` administra o catálogo por meio da Edge Function `master-manage-billing`.

- A função valida o token com Supabase Auth e confirma o usuário em `master_admins` antes de permitir qualquer ação.
- Ações disponíveis: `list_plans`, `save_plan` e `toggle_plan`.
- A criação e edição validam código único, preço em centavos, periodicidade, limite de aves e permissões funcionais.
- Ativação, desativação, criação e edição geram eventos em `master_audit_log`.
- A interface não possui exclusão física de planos para preservar referências futuras em assinaturas e histórico.
- A tela não atribui planos a criadores, não registra pagamentos e não realiza cobranças. Essas etapas dependem de regras comerciais e de integração próprias.
- A Edge Function e a interface estão versionadas na branch de desenvolvimento e ainda não foram implantadas.

### Gestão de assinaturas no Painel Master

A tela `src/features/master/SubscriptionsManagement.jsx` utiliza a Edge Function `master-manage-subscriptions`, que valida a sessão e a permissão em `master_admins` antes de qualquer consulta ou alteração.

- Consulta o histórico recente de assinaturas, plano vinculado, criador, período e situação.
- Permite pesquisar criadores por nome, nome do criatório ou e-mail.
- Permite atribuir plano ativo, com situação inicial e datas de início/término.
- Ao atribuir um novo plano, assinaturas anteriores em situação ativa, em teste ou com pagamento pendente são encerradas antes da criação do novo vínculo.
- Permite alterar a situação de uma assinatura e registra as operações em `master_audit_log`.
- Contas Master e administradores legados não podem receber planos de criador.
- O módulo não gera cobrança nem confirma pagamento; esses estados dependerão de integração de pagamentos e regras próprias.
- O histórico apresentado é limitado aos 500 registros mais recentes nesta primeira versão.
- A implementação está somente na branch de desenvolvimento e depende da migração `202611130001_platform_plans_subscriptions.sql`; não foi implantada no Supabase nem publicada em produção.

### Exceções individuais de permissões e limites

A tela `src/features/master/EntitlementsManagement.jsx` permite que o Master conceda ou retire permissões específicas de um criador sem trocar seu plano.

- A tabela `creator_entitlement_overrides` guarda exceções por usuário, separadas do catálogo e da assinatura.
- Cada funcionalidade aceita três estados: herdar do plano, liberar ou bloquear.
- O limite de aves pode herdar o plano, receber um novo limite numérico ou ficar ilimitado.
- Exceções podem ter data de expiração; após esse instante deixam de ser consideradas pela camada de autorização.
- O motivo da concessão é obrigatório e as operações são registradas em `master_audit_log`.
- O Master pode remover todas as exceções para retornar o criador às regras do plano.
- A Edge Function `master-manage-entitlements` valida sessão, vínculo Master e protege contas administrativas.
- A migração `202611130002_creator_entitlement_overrides.sql` está versionada, mas não aplicada no banco.
- Esta etapa implementa o cadastro administrativo das exceções. A aplicação efetiva no cadastro de aves e nos módulos premium depende da próxima etapa de integração dos controles server-side.

### Aplicação do limite de aves no banco

A migração `202611130003_enforce_creator_bird_limits.sql` instala o trigger `enforce_creator_bird_limit_before_write` na tabela `aves`.

- A inclusão de uma nova ave consulta a assinatura vigente e usa o plano gratuito quando não há assinatura ativa/em teste.
- O limite individual do Master prevalece sobre o limite do plano; a liberação ilimitada também é suportada.
- Exceções expiradas deixam de ser consideradas automaticamente.
- A validação ocorre no PostgreSQL, inclusive para inclusões feitas fora da interface.
- Um bloqueio transacional por criador evita ultrapassar o limite com duas inclusões simultâneas.
- Atualizações de aves existentes não consomem novas vagas.
- A migração está versionada na branch, mas ainda não foi aplicada no Supabase.
- O bloqueio de funcionalidades premium ainda será integrado nos módulos e nas respectivas operações de servidor.

### Aplicação de permissões nos módulos do criador

As migrações `202611130004_enforce_premium_feature_access.sql` e `202611130006_enforce_after_sales_feature.sql`, junto da Edge Function `creator-get-entitlements`, completam a primeira integração dos recursos premium.

- O painel do criador consulta a Edge Function `creator-get-entitlements`, que valida o token e retorna apenas o plano e as permissões efetivas do usuário autenticado.
- O menu identifica com cadeado os módulos de genética, reprodução, financeiro e pós-venda quando não liberados.
- A navegação direta também é bloqueada e apresenta uma explicação com opção de atualizar as permissões.
- Genética (`mutacoes`), reprodução (`posturas`) e financeiro (`despesas`) recebem políticas RLS: cada criador continua limitado aos próprios registros e precisa ter a funcionalidade liberada pelo plano ou por exceção válida.
- As políticas permissivas de propriedade são criadas explicitamente para manter o acesso normal aos próprios dados; políticas restritivas adicionam a checagem do recurso.
- Pós-venda é protegido por trigger que bloqueia alterações nos campos de acompanhamento quando o recurso não estiver liberado, sem impedir outras edições da ave.
- As exceções expiradas voltam a herdar as permissões do plano.
- As migrações estão apenas versionadas na branch. Nenhuma foi aplicada ao banco de produção.
- A integração de campanhas e de outros recursos ainda precisa ser feita quando seus fluxos e operações de servidor forem definidos.
