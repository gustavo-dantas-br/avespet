# Redesign da página inicial pública

> Documento de acompanhamento da iniciativa. Complementa [ARQUITETURA.md](./ARQUITETURA.md).
>
> **Data de início:** 12/11/2026  
> **Branch:** `feature/homepage-redesign`  
> **Status:** implementação inicial no GitHub; build e validação visual pendentes.

## 1. Objetivo

Apresentar o ecossistema Avespet para dois públicos — tutores/visitantes e criadores — e encaminhá-los às páginas específicas já existentes. A home deve ser uma visão geral comercial, não uma cópia extensa de cada página interna.

## 2. Princípios

1. Reaproveitar rotas, componentes e serviços existentes.
2. Não criar páginas duplicadas para funcionalidades já disponíveis.
3. Não alterar dados, tabelas, políticas RLS ou regras de negócio durante a etapa visual.
4. Não publicar em produção sem validação explícita.
5. Documentar decisões, alterações, testes e pendências nesta pasta.
6. Não afirmar que uma ave será devolvida com garantia; o cadastro e a identificação podem facilitar o reencontro, mas não o asseguram.
7. Não expor endereço residencial ou dados pessoais do tutor na consulta pública.

## 3. Mapa da página inicial

| Seção da home | Objetivo | Destino |
|---|---|---|
| Hero | Apresentar Avespet e separar os dois públicos | Âncoras da própria home |
| Proteção da ave | Incentivar o tutor a conhecer o serviço | `/aves-perdidas` |
| Consulta de anilha | Facilitar a consulta pública | `/achei-uma-ave` |
| Campanha regional | Apresentar divulgação adicional | `/campanha-ave-perdida` |
| Gestão do criatório | Apresentar recursos para criadores | CTA de login/cadastro existente |
| Vitrine | Mostrar anúncios públicos | `/aves-a-venda` |
| Conteúdo | Destacar materiais educativos | `/guias` e `/videos` |

## 4. Arquivos envolvidos

- `src/publico/home/Inicio.jsx`: composição visual da home e seções.
- `src/components/AuthPage.jsx`: integração da home, cabeçalho, rodapé, modal de autenticação e roteamento.
- `src/publico/roteador.jsx`: componente `Link` e navegação da área pública; links internos devem passar o destino pela propriedade `para`.
- `src/publico/PaginasConteudo.jsx`: guias, vídeos e destaques existentes.
- `src/features/aves-perdidas`: fluxo existente de aves perdidas.
- `src/features/campanhas`: fluxo existente de campanhas.

## 5. Direção visual

- Estilo moderno, natural, responsivo e profissional.
- Paleta inicial: verde profundo, verdes suaves e fundos neutros.
- Fotografia real de diferentes espécies, evitando aparência de plataforma voltada a uma única ave.
- CTAs claros e conteúdo resumido.
- Imagens com carregamento prioritário apenas para o destaque principal e carregamento tardio nas seções abaixo da dobra.

**Atenção:** as imagens iniciais usam URLs externas do Pexels. Antes da publicação, validar se os arquivos continuam disponíveis, conferir licença/atribuição aplicável, dimensões e desempenho. Avaliar hospedagem otimizada em domínio/CDN controlado pelo projeto.

## 6. Limites funcionais que precisam ser validados

- O fluxo atual de busca por anilha consulta registros de aves perdidas aprovados; não se deve dizer que qualquer ave cadastrada no plantel aparece automaticamente na busca.
- O cadastro atual do modal de autenticação cria perfil de criador. A experiência específica de cadastro de tutor/visitante ainda precisa ser analisada antes de anunciar um fluxo separado.
- O registro de ave perdida e a consulta pública devem continuar respeitando autenticação, moderação e proteção dos dados pessoais.
- A chamada “criar conta gratuita” da home reutiliza o modal existente; não implica que todo recurso avançado seja gratuito para sempre.
- A vitrine e os guias devem continuar usando os componentes atuais, sem duplicar consultas ou regras.

## 7. Critérios de aceite

### Visual e responsividade
- [ ] Home aprovada em largura mobile, tablet e desktop.
- [ ] Imagens carregam corretamente, sem distorção ou layout shift excessivo.
- [ ] Contraste, foco de teclado, textos alternativos e navegação acessível revisados.
- [ ] Menu e rodapé legíveis em todos os tamanhos.

### Navegação
- [ ] Todas as rotas do mapa abrem a página correta.
- [ ] Botões de rolagem levam às seções certas.
- [ ] Voltar/avançar do navegador continuam funcionando.
- [ ] CTAs abrem o modal correto sem mudar indevidamente a rota.

### Funcionalidade
- [ ] Consulta de anilha continua pública e funcional.
- [ ] Formulário de ave encontrada continua funcionando.
- [ ] Vitrine e guias carregam dados/conteúdo existentes.
- [ ] Login, cadastro e recuperação de senha continuam funcionando.
- [ ] Registro de ave perdida e campanha testados com os controles de acesso esperados.

### Engenharia
- [ ] `npm run build` concluído sem erros.
- [ ] Nenhum erro de console relevante.
- [ ] Nenhuma alteração indevida no Supabase.
- [ ] Preview da branch validado antes de merge/deploy.
- [ ] Documentação atualizada com os resultados reais dos testes.

## 8. Histórico de alterações

### 12/11/2026 — primeira composição modular
- Criada a branch `feature/homepage-redesign` a partir de `main`.
- Criado `src/publico/home/Inicio.jsx`.
- Integrada a home no `AuthPage.jsx), reaproveitando busca de anilha, vitrine e guias existentes.
- Mantidas as rotas públicas atuais.
- Atualizado `docs/ARQUITETURA.md`.
- Nenhuma alteração de produção ou banco de dados realizada.

### Validação de Preview
A tentativa de implantação pela API da Vercel foi bloqueada por limite diário (`api-deployments-free-per-day`, HTTP 402). Não há URL Preview confirmada para esta branch. O build e a validação visual permanecem pendentes; não considerar a etapa pronta para merge.


### Confirmação de validação pelo usuário — 12/11/2026

O usuário informou que as verificações mencionadas nesta etapa já foram realizadas e que está tudo funcionando corretamente. Registrar esta confirmação como validação feita pelo usuário, sem atribuir ao assistente uma execução de testes que não foi realizada nesta sessão.

- [x] Usuário confirmou que a verificação funcional está concluída e sem problemas identificados.
- [ ] Anexar/registrar URL de Preview ou evidência da validação visual, caso esteja disponível.
- [ ] Fazer uma última conferência automatizada de build na branch antes do merge.


## 9. Segunda etapa — identidade visual das páginas públicas

### 12/11/2026 — componentes compartilhados e página de aves perdidas

- Criado `src/publico/ComponentesPublicos.jsx` com tokens visuais e componentes reutilizáveis: `PaginaPublica`, `CabecalhoPublico` e `CartaoPublico`.
- Atualizada `src/features/aves-perdidas/pages/AvesPerdidas.jsx` para usar fundo claro, cartões padronizados, estados de carregamento/erro/vazio e cabeçalho compartilhado.
- A página agora oferece caminho explícito para consulta de anilha.
- Corrigido o CTA de cadastro da página de aves perdidas: ele aciona o modal de entrada/cadastro existente, em vez de direcionar incorretamente para a consulta de anilha.
- `src/components/AuthPage.jsx` passa a ação `onEntrar` para a página de aves perdidas.
- Nenhuma regra de consulta, aprovação ou persistência foi modificada nesta etapa.

### Próximas páginas a padronizar

- [x] Página de solicitação de campanha (`/campanha-ave-perdida`) — identidade visual atualizada.
- [ ] Guias, vídeos e página individual de artigo — destaque da home ajustado; páginas completas ainda pendentes.
- [ ] Página de consulta de anilha (`/achei-uma-ave`).
- [ ] Vitrine de aves à venda.
- [ ] Cabeçalho e navegação em todas as rotas públicas.

### Validação desta etapa de interface

- [ ] Executar build após as alterações desta segunda etapa.
- [ ] Conferir visualmente página de aves perdidas em mobile e desktop.
- [ ] Testar CTA de entrada/cadastro e consulta de anilha.
- [ ] Conferir estado vazio, carregamento, erro e anúncios com/sem foto.
- [ ] Atualizar este checklist após os testes.


### 12/11/2026 — campanha e destaque de conteúdo

- Atualizada `src/features/campanhas/pages/SolicitarCampanha.jsx` para usar o sistema visual compartilhado, preservando os pacotes, campos, envio e estados de sucesso/erro.
- Ajustado o destaque `GuiasEmDestaque` em `src/publico/PaginasConteudo.jsx` para ter contraste correto no fundo claro da nova home.
- Os cartões de conteúdo passaram a usar superfície branca e borda neutra.
- Nenhuma regra de solicitação, pacote, orçamento ou cobrança foi alterada.
- As páginas completas de guias, vídeos e artigo individual ainda precisam de padronização visual.
- Testes automatizados e visuais destas alterações específicas continuam pendentes; a confirmação anterior do usuário se refere à verificação que já havia sido feita antes desta nova rodada de código.
