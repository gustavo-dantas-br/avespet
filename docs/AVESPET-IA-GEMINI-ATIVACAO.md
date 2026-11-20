# Ativação do Gemini no Avespet IA — 2026-11-19

## Estado da integração
- UI e conversa com contexto já funcionam no preview **sem API externa**.
- Cliente opcional `src/features/avespet-ia/chatGenerativo.js` chama exclusivamente `supabase.functions.invoke("avespet-ia-chat")`.
- Função server-side em `supabase/functions/avespet-ia-chat/index.ts`, preparada em branch, **não implantada**.
- Por padrão, o cliente exige `VITE_AVESPET_IA_GEMINI_ENABLED=true`; o servidor exige `AVESPET_IA_ENABLED=true`.
- Os segredos `GEMINI_API_KEY` (confidencial) e `GEMINI_MODEL` devem ficar somente nas Edge Function Secrets do Supabase, jamais em `VITE_*`, git, logs ou mensagens.
- Não ativar a integração até revisar quota, elegibilidade do plano gratuito e controles de custo na conta Google AI Studio.
- Modelo inicial sugerido: `gemini-2.5-flash-lite` se estiver disponível na cota gratuita para a chave do proprietário; verificar disponibilidade real no AI Studio.
- O Google informa que entradas e saídas do free tier podem ser usadas para melhorar seus produtos; avisar os usuários e evitar enviar dados sensíveis.

## Ações de ativação (após revisão)
1. Usuário cria chave no Google AI Studio: https://aistudio.google.com/api-keys ; **não compartilhar a chave no chat**.
2. Na conta/projeto Google, conferir Free Tier/Rate Limits e verificar ausência de faturamento pago inesperado. O free tier é uma elegibilidade, não um teto financeiro de segurança.
3. Configurar as variáveis da Edge Function pelo painel Supabase (projeto Avespet):
   - `GEMINI_API_KEY`: chave sigilosa
   - `GEMINI_MODEL`: nome do modelo com Free Tier efetivamente habilitado
   - `AVESPET_IA_ENABLED`: `false` até final de revisão e verificação
4. Inspecionar e revisar o código; fazer implantação **somente da função nova**, com verificação de JWT. Isso não publica frontend, mas disponibiliza endpoint — mantido fechado por flag.
5. Testar com conta autenticada de teste: JWT inválido, exceder limite, texto sem diagnóstico, múltiplas mensagens, erro 429, erro 503, injeção de instruções, privacidade, tempo limite e custos da conta.
6. Configurar `AVESPET_IA_ENABLED=true` e **somente em Preview Vercel** `VITE_AVESPET_IA_GEMINI_ENABLED=true` quando as verificações estiverem prontas. Deploy novo de preview será necessário para incorporar a variável de build.
7. Monitorar uso via Google AI Studio. Habilitar desligamento imediato com a flag e planejar limite centralizado por usuário em banco, porque o limite em memória do protótipo não é confiável em instâncias distribuídas.

## Limitações
- Sem chave configurada e sem ativação dupla, o Gemini **não funciona**; a UI usa resposta local contextual.
- O motor de linguagem livre não possui acesso automático a fontes. Saúde e manejo técnico continuam restritos.
- Para uso público, implementar quota centralizada, observabilidade, consentimento, controles de moderação e bloqueio de conteúdo perigoso antes da exposição.
- Nenhuma migração do diário ou alteração de banco decorre desta configuração.
