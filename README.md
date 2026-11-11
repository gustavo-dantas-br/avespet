# Criatorio Dantas - Cadastro de Aves

Sistema web de gerenciamento de criatório, com cadastro e acompanhamento de aves, genealogia, reprodução, genética, anúncios, aves perdidas/encontradas, clientes, fornecedores e financeiro.

## Documentação do projeto

- **[Arquitetura e organização do código](docs/ARQUITETURA.md)** — estrutura atual, responsabilidades, arquitetura-alvo, regras de desenvolvimento e checklist obrigatório.
- **[Schema inicial do Supabase](supabase/schema.sql)** — estrutura inicial do banco. O banco em produção pode ter evoluído além deste arquivo; confira as migrações e o projeto Supabase antes de alterar dados.

> Regra de manutenção: toda alteração estrutural ou funcional relevante deve atualizar a documentação correspondente. Mudanças no banco devem ser registradas em migrações SQL versionadas.

## Stack

- React 18 + Vite 5
- Supabase (Auth e PostgreSQL)
- Tailwind CSS
- Vite PWA
- Deploy na Vercel

## Executar localmente

```bash
npm install
cp .env.example .env
```

Configure no arquivo `.env`:

```env
VITE_SUPABASE_URL=sua_url_do_projeto
VITE_SUPABASE_ANON_KEY=sua_chave_anon_public
```

Depois execute:

```bash
npm run dev
```

Para validar a compilação de produção:

```bash
npm run build
```

## Estrutura em alto nível

- `src/features/` — funcionalidades organizadas por domínio.
- `src/components/` — componentes compartilhados.
- `src/lib/` — modelos e utilitários; o acesso a dados ainda está centralizado em parte em `db.js`.
- `src/App.jsx` — composição e orquestração principal; ainda precisa de extração incremental de responsabilidades.
- `src/supabaseClient.js` — cliente Supabase.
- `supabase/` — schema e, conforme evoluirmos, migrações SQL versionadas.

Para detalhes e decisões, consulte **[docs/ARQUITETURA.md](docs/ARQUITETURA.md)**.

## Segurança

- Nunca versionar `.env` ou credenciais privadas.
- A chave anon/public do Supabase no frontend exige políticas RLS corretas em todas as tabelas.
- Dados privados de criadores não devem ser expostos em consultas públicas.
- Toda mudança de schema ou política deve ser revisada, versionada e testada.

## Qualidade e manutenção

Antes de concluir uma alteração:
1. Validar imports e dependências afetadas.
2. Executar `npm run build`.
3. Testar o fluxo alterado e as permissões correspondentes.
4. Atualizar a documentação e registrar migrações, quando aplicável.

O projeto está em evolução: a presença de pastas por domínio não significa que todas as responsabilidades já estejam totalmente desacopladas. A situação real e os próximos passos ficam registrados em [docs/ARQUITETURA.md](docs/ARQUITETURA.md).
