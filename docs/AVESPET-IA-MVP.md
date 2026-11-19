# Avespet IA — MVP 0.1 (implementação isolada)

Data: 2026-11-19. Issue de produto: #39.

## Objetivo e restrições
Entregar onboarding educativo “Meu Primeiro Pet” (Ring Neck e calopsita inicialmente), com regras de triagem conservadoras, custo de IA **zero** e sem integração de provedores externos nesta fase. Não é consulta veterinária.

## Implementação desta etapa
- `src/features/avespet-ia/MeuPrimeiroPet.jsx`: componente React isolado com nível, espécie, fase, idade e pergunta livre; exibe orientações educativas locais.
- `src/features/avespet-ia/motorEducativo.js`: validação dos dados, alerta baseado em regras conservadoras, mensagens educativas por fase, aviso veterinário.
- `tests/avespet-ia.test.js`: testes unitários básicos (cadastro, urgência, papo e desmame).
- Sem chamadas de rede, segredos, dependências novas, migrações ou alterações em `src/App.jsx`. O componente ainda **não está disponível na navegação**.
- Dados do formulário ficam apenas na memória da página; não são persistidos.

## Limitações e riscos
- A detecção por palavras-chave **não é uma triagem clínica confiável**. Frases negativas, erros de digitação e outros sinais graves podem não ser detectados; não ativar para público sem ampliar testes e revisão especializada.
- As orientações são gerais e precisam de revisão técnica antes da publicação.
- A fase da ave não pode ser inferida apenas por idade. Não oferecer volumes, horários ou procedimentos de alimentação manual sem acompanhamento veterinário.
- Não há ainda diário persistente, histórico por ave, agentes conversacionais nem integração com a calculadora genética.

## Arquitetura prevista
1. UI React em `src/features/avespet-ia/`
2. Motor local determinístico para roteiros e alertas essenciais
3. Base de conteúdos editoriais versionados/aprovados
4. Persistência no Supabase com RLS por usuário/ave, após auditoria autorizada
5. Backend opcional de IA com cota gratuita, desligado por padrão; segredo somente no servidor, limite global, limite por usuário e fallback local
6. Integração da genética usando somente motor genético determinístico validado

## Critérios antes da disponibilização
- [ ] Revisão do componente com UX mobile e acessibilidade
- [ ] Cobertura ampla de emergências e negações na triagem, com revisão veterinária
- [ ] Testar `node --test tests/avespet-ia.test.js` e `npm run build`
- [ ] Auditoria do Supabase e políticas RLS antes de persistir histórico
- [ ] Decidir controle de feature flag e integração de rota/menu
- [ ] Verificar configuração de deploy de preview na Vercel antes do merge
- [ ] Obter aprovação para publicação em produção

## Política de custos
Nenhum novo serviço contratado. Nenhuma chave de API no frontend. O assistente funciona com regras locais; API generativa só será considerada após verificar limites de gratuidade, privacidade e mecanismos de bloqueio automático.
