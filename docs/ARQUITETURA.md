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
3. As telas e componentes ficam principalmente em `components/` e `features/`.
4. As funções em `lib/db.js` consultam e persistem dados no Supabase.
5. `supabaseClient.js` fornece o cliente configurado pelas variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
6. O PostgreSQL aplica políticas de Row Level Security (RLS) definidas no banco. O arquivo `supabase/schema.sql` é apenas o schema inicial; alterações posteriores podem existir no projeto Supabase e precisam ser documentadas em migrações versionadas.

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


## 12. Genetica — primeira evolucao incremental (13/11/2026)

- Criada a branch `feature/genetica-ringneck-base` para desenvolver a primeira etapa sem publicar diretamente em producao.
- Adicionado catalogo inicial Ring Neck em `src/features/genetica/data/catalogoRingNeck.js`, com nomenclatura tecnica + popular e status de validacao.
- A tela Banco de Genetica permite importar itens ausentes, sem substituir nem apagar registros existentes.
- O modelo da ave agora reserva campos estruturados para cor-base, mutacoes visuais e fatores Dark/Violet, mantendo `corMutacao` e `portadores` para compatibilidade com cadastros antigos.
- O cadastro separa cor-base e fatores SF/DF; permite selecionar portadores do catalogo, inclusive itens em validacao. Femeas nao podem marcar portadores ocultos de mutacoes ligadas ao sexo.
- A calculadora permite selecionar aves cadastradas ou informar pai/mae manualmente e foi disponibilizada para os criadores.
- Limite importante: nesta etapa, a calculadora ainda usa o motor mendeliano legado. Cor-base, fatores Dark/Violet, genes ligados entre si, recombinacao e alelos do locus Ino/Pallid ainda nao estao plenamente conectados. A interface sinaliza que esses campos sao apenas registro ate a validacao do motor.
- O catalogo inicial inclui mutacoes em diferentes niveis de evidencia; apenas Cleartail esta marcada para calculo nesta primeira etapa. As demais ficam disponiveis para cadastro/portadores, mas bloqueadas no motor quando a regra nao estiver validada.
- O banco Supabase de producao foi inspecionado: `aves` e `mutacoes` usam JSONB em `data`, com RLS habilitada. Nenhuma alteracao estrutural ou migracao de banco foi feita nesta etapa.
- A publicacao de preview nao foi concluida porque a API da Vercel retornou limite diario do plano. A branch permanece separada; nao houve deploy de producao.


### 12.1. Combinacoes fenotipicas e estrutura visual

- Adicionado `src/features/genetica/data/combinacoesRingNeck.js` como catalogo de combinacoes, separado das mutacoes primarias.
- Registra Lutino, Albino, Creamino/Cremino, Pallid-ino, Skyblue/Azul Canela e Silver com componentes, nomenclatura alternativa, ressalvas e fonte de referencia.
- As combinacoes nao foram importadas como mutacoes no banco nem habilitadas como genes independentes.
- O formulario de aves passou a aceitar multiplas mutacoes visuais por ave; a calculadora manual tambem permite informar cor-base, mutacoes visuais e fatores SF/DF.
- O motor legado agora reconhece mutacoes visuais adicionais em loci autossomicos e ligados ao sexo, mas isso nao resolve ainda a representacao dos alelos da serie azul/turquesa, Dark/Violet ou o locus alelico Ino/Pallid.
- Corrigida a separacao entre mutacoes bloqueadas por validacao e mutacoes com heranca ainda nao classificada.
- Referencias consultadas: Psittacula World (Pallid, Ino, Cinnamon e combinacoes) e calculadora brasileira Criar e Preservar para nomenclatura de mercado. A taxa de ligacao Dark/Blue nao sera presumida como comprovada em Ring Neck: material de calculadora antigo cita estimativa baseada em periquito-australiano e ressalva que nao estava conclusivamente demonstrada em Ring Neck.
- Preview continua pendente por limite diario da Vercel; nenhuma publicacao de producao foi feita.
