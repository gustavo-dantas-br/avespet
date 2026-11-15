# Agente Genético Avespet

> Documento de decisão e implementação incremental. A arquitetura foi aprovada para oferecer calculadora genética e conversa livre, inicialmente para Ring Neck e calopsitas.
>
> **Branch de trabalho:** `feature/agente-genetico-avespet`
> **Base:** `integration/genetica-sobre-producao`
> **Produção:** nenhuma alteração nesta etapa.

## 1. Decisão aprovada

O Avespet terá um agente genético com duas formas de uso:

1. **Dentro da calculadora:** o criador seleciona aves do plantel ou informa os pais manualmente; o agente pode ajudar a interpretar campos, esclarecer dúvidas e explicar o resultado calculado.
2. **Conversa livre:** o criador pergunta sobre mutações, herança, portadores, fatores, cruzamentos e interpretação de resultados sem precisar iniciar a calculadora.

As primeiras espécies atendidas serão:
- Ring Neck.
- Calopsita.

A experiência deve usar português brasileiro, linguagem acessível e nomenclatura técnica seguida do nome popular quando houver.

## 2. Responsabilidades: IA e motor genético

### IA — interpretação e explicação

A IA poderá:
- Interpretar perguntas em linguagem natural.
- Identificar espécie, sexo, aparência, mutações e informações declaradas sobre os pais.
- Perguntar somente os dados que faltarem para responder com segurança.
- Traduzir termos técnicos para linguagem simples.
- Explicar resultados que tenham sido produzidos pelo motor genético.
- Distinguir fatos informados, hipóteses e dados desconhecidos.
- Consultar somente conteúdo técnico aprovado e dados do plantel aos quais o usuário autenticado tenha acesso.

A IA não poderá:
- Inventar genótipos, mutações, portadores ou percentuais.
- Tratar aparência visual como prova de um portador oculto quando isso não for geneticamente dedutível.
- Transformar hipótese em certeza.
- Liberar uma regra de cálculo que esteja marcada como pendente, controversa ou em estudo.
- Substituir o motor genético por cálculo probabilístico em texto livre.

### Motor genético — cálculo determinístico

O motor será a única fonte dos percentuais e combinações calculadas. Deve receber dados estruturados e retornar:
- Possibilidades por sexo.
- Percentuais por filhote e, quando útil, percentuais dentro de cada sexo.
- Fenótipos previstos.
- Portadores possíveis.
- Fatores simples e duplos quando a regra estiver validada. Para o Violet Factor no fluxo Ring Neck, a regra de produto aprovada é assumir SF quando o campo estiver vazio; DF somente quando o criador selecionar DF explicitamente.
- Dados desconhecidos, cenários condicionais e regras não suportadas.
- Explicação técnica suficiente para a IA comunicar o resultado sem alterar os números.

Quando a regra genética não estiver implementada ou os dados forem insuficientes, o motor deve retornar estado explícito de incerteza, sem criar resultado normal por padrão.

## 3. Fluxo proposto

1. A interface recebe a pergunta ou os dados da calculadora.
2. O backend autentica o criador e valida o acesso aos dados.
3. A IA interpreta a intenção e produz uma solicitação estruturada ou uma pergunta de esclarecimento.
4. Quando houver dados suficientes, o backend chama o motor genético apropriado para a espécie.
5. O motor devolve resultados determinísticos e avisos de limitações.
6. A IA explica o resultado sem recalcular nem modificar percentuais.
7. A interface apresenta a resposta, os dados considerados e a seção **Entenda o resultado**.

A conversa livre também pode responder dúvidas conceituais sem executar um cruzamento. Se o usuário pedir percentuais, a IA deve encaminhar a solicitação ao motor ou explicar por que ainda não é possível calcular.

## 4. Arquitetura técnica proposta

- **Frontend React:** interface da calculadora, painel de conversa e histórico opcional.
- **Backend seguro:** endpoint autenticado para orquestrar a IA e o motor.
- **Adaptador de provedor de IA:** camada substituível, sem acoplar regras genéticas a um único fornecedor.
- **Base técnica curada:** catálogo por espécie, tipo de herança, locus, alelos, relações alélicas, status de validação, fontes e observações.
- **Motor por espécie:** regras isoladas para Ring Neck e calopsita, compartilhando apenas utilitários comprovadamente comuns.
- **Supabase:** autenticação, persistência e políticas RLS para conversas e dados privados, caso o histórico seja habilitado.

Segurança obrigatória:
- Chaves de IA somente no backend como secrets; nunca no React, no repositório ou em variáveis públicas.
- Toda chamada deve exigir sessão válida e limitar o acesso aos dados do próprio criador.
- Não enviar à IA dados pessoais desnecessários.
- Aplicar limites de tamanho, frequência e custo por usuário.
- Registrar metadados operacionais sem armazenar segredos ou dados sensíveis no log.
- Não executar SQL arbitrário nem ferramentas administrativas a partir da conversa.

A escolha do provedor, modelo e orçamento será feita antes da primeira chamada real, pois o uso de IA pode gerar cobrança. A arquitetura deve permitir trocar o provedor sem reescrever o motor genético.

## 5. Auditoria inicial do código existente

A auditoria inicial foi feita na branch `integration/genetica-sobre-producao`, que contém o Preview de genética citado nas conversas anteriores.

### O que já existe nessa branch

- `src/features/genetica/components/CalculadoraGenetica.jsx`: calculadora com seleção do plantel ou cadastro manual dos pais.
- `src/features/genetica/utils/calcularCruzamentoGenetico.js`: motor genérico para alguns padrões autossômicos e ligados ao sexo.
- `src/features/genetica/data/catalogoRingNeck.js`: catálogo inicial Ring Neck com status de validação.
- `src/features/genetica/utils/serieCorRingNeck.js`: regras específicas para série de cor, Dark Factor e Violet Factor.
- `tests/geneticaMotor.test.js` e testes da série de cor Ring Neck.
- Script `npm run test:genetica` nessa branch.

### Lacunas identificadas na inspeção

- Não foi encontrado, nos arquivos de genética inspecionados, um catálogo equivalente de mutações e regras para calopsitas.
- O motor genérico cobre apenas classes de herança implementadas; não representa ainda todos os casos complexos de alelos múltiplos, séries alélicas, interações entre loci e combinações específicas por espécie.
- Algumas mutações do catálogo Ring Neck estão deliberadamente bloqueadas para cálculo, inclusive regras que precisam de modelagem adicional.
- A calculadora e o catálogo Ring Neck contêm regras específicas; elas precisam ser separadas do fluxo genérico para que a IA não confunda uma espécie com outra.
- Existem dois arquivos de testes da série Ring Neck com cobertura parcialmente sobreposta; revisar e consolidar sem perder cenários.
- A inspeção foi estática dos arquivos citados; ainda é necessário executar os testes e validar cruzamentos de referência antes de considerar qualquer regra aprovada.

## 6. Plano de execução

### Fase 1 — consolidar a base existente
- [ ] Confirmar a branch e o Preview que serão a referência funcional.
- [ ] Executar os testes existentes e registrar o resultado.
- [x] Registrar a regra aprovada do Violet Factor: SF por padrão quando não informado; DF somente quando selecionado explicitamente.
- [ ] Revisar os casos de referência de Ring Neck.
- [ ] Corrigir inconsistências do motor antes de conectar IA.
- [ ] Consolidar testes duplicados sem remover cobertura útil.

### Fase 2 — modelar a genética por espécie
- [ ] Definir um esquema comum de dados genéticos.
- [ ] Separar catálogo, loci, alelos, herança e combinações por espécie.
- [ ] Completar e validar Ring Neck.
- [ ] Criar catálogo inicial de calopsitas com fontes e status de validação.
- [ ] Implementar apenas regras com evidência suficiente.
- [ ] Exibir explicitamente regras em estudo e combinações não suportadas.

### Fase 3 — preparar o backend do agente
- [ ] Escolher provedor/modelo e definir orçamento máximo.
- [ ] Criar endpoint autenticado e seguro.
- [ ] Definir formato estruturado de entrada e saída.
- [ ] Conectar o endpoint ao motor, nunca delegando o cálculo à IA.
- [ ] Implementar limites, tratamento de erros e proteção contra abuso.

### Fase 4 — interface e experiência
- [ ] Criar área de conversa livre.
- [ ] Integrar assistência contextual na calculadora.
- [ ] Permitir que o criador autorize o uso dos dados das aves selecionadas.
- [ ] Exibir dados considerados, perguntas pendentes e limitações.
- [ ] Padronizar a seção **Entenda o resultado**.

### Fase 5 — validação e Preview
- [ ] Testar perguntas conceituais e cruzamentos conhecidos.
- [ ] Testar informações incompletas, contraditórias e mutações não suportadas.
- [ ] Verificar que a IA nunca altera percentuais retornados pelo motor.
- [ ] Validar isolamento entre criadores e limites de uso.
- [ ] Publicar somente em Preview para avaliação; produção depende de aprovação explícita.

## 7. Critérios de aceite

A primeira versão só será considerada pronta quando:
- As duas espécies estiverem identificadas e isoladas corretamente.
- Cada percentual vier do motor genético testado.
- A IA souber pedir esclarecimentos em vez de presumir dados.
- Mutações sem regra validada não gerarem percentuais.
- Toda previsão trouxer a seção **Entenda o resultado**.
- O criador puder usar tanto a calculadora quanto a conversa livre.
- A chamada de IA ocorrer somente no backend, com autenticação, limites e controle de custo.
- Os testes e o Preview forem aprovados antes de qualquer deploy de produção.

## 8. Regra de publicação

Esta branch é de trabalho e não deve ser mesclada automaticamente em `main`. A branch `integration/genetica-sobre-producao` está divergente da `main` e contém alterações de outros domínios. A integração deverá selecionar apenas as mudanças revisadas e aprovadas, evitando publicar alterações não relacionadas à genética.
