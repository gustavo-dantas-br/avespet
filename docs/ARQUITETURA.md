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
