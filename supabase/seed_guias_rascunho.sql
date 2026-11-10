-- Rascunhos dos primeiros guias (Ring Neck e Calopsita)
-- Entram como RASCUNHO (publicado = false): ninguem do publico ve ate voce revisar e publicar.
-- Rodar de novo nao duplica (pula o que ja existe pelo slug).
-- Revise no site: aba Conteudo > Editar > Ver previa. Os numeros variam entre fontes: confira com a sua experiencia.

insert into artigos (id, slug, titulo, resumo, corpo, especie, categoria, publicado)
select gen_random_uuid(), 'quantos-dias-o-ovo-leva-para-chocar-ring-neck-calopsita', $t1$Quantos dias o ovo leva para chocar? Ring Neck e Calopsita$t1$, $r1$Tempo de incubação de Ring Neck e Calopsita, de quanto em quanto tempo a fêmea bota e por que os ovos da mesma postura não nascem todos no mesmo dia.$r1$, $c1$Saber a data provável do nascimento ajuda a organizar a rotina, a não incomodar o casal sem necessidade e a perceber cedo quando algo foge do normal. Os números abaixo são **faixas tiradas de fontes de criadores e de veterinários**: cada casal tem o seu ritmo, e as fontes nem sempre concordam entre si.

## Quanto tempo dura a incubação

- **Ring Neck:** em geral de 22 a 25 dias; alguns criadores relatam até 26.
- **Calopsita:** em geral de 18 a 21 dias; algumas fontes citam de 17 a 23.

A contagem certa começa **quando a fêmea realmente passa a chocar**, e não necessariamente no dia em que o ovo foi posto. Por isso a mesma postura pode ter ovos nascendo com dias de diferença.

## De quanto em quanto tempo a fêmea bota

Nas duas espécies, o normal é **um ovo a cada dois dias** até completar a postura.

- **Ring Neck:** de 3 a 6 ovos na maioria dos relatos (às vezes só 2).
- **Calopsita:** de 4 a 6 ovos é o mais comum, mas há posturas de 2 a 8.

## Por que os ovos nascem em dias diferentes

Muitas fêmeas só começam a chocar de verdade depois do segundo ou do terceiro ovo. Enquanto isso, os primeiros ovos esperam sem se desenvolver, e os filhotes tendem a nascer mais próximos uns dos outros. Já quando a fêmea começa a chocar logo no primeiro ovo, os nascimentos ficam mais espalhados. Os dois jeitos aparecem nos relatos e variam de casal para casal.

## Quando conferir se o ovo é fértil

Nos guias de Ring Neck e de calopsita, a ovoscopia (olhar o ovo contra uma luz forte e focada, em ambiente escuro) costuma ser feita depois de cerca de **7 a 10 dias de incubação**. Faça rápido e com cuidado: mexer demais no ninho ou nos ovos pode levar a fêmea a abandonar a postura. Combine o melhor momento com o seu veterinário ou com um criador experiente.

## Como usar isso no dia a dia

Anote a **data de cada ovo** e some os dias de incubação da espécie para ter uma previsão. Se um ovo passar bastante da data prevista, não tire conclusões sozinho: fale com um veterinário de aves ou com um criador experiente antes de interferir.

No Avespet, a aba **Reproducao** faz essa conta por você: informe o casal, os dias de incubação (o sistema sugere 24 para Ring Neck e 20 para Calopsita, e você ajusta) e a data de cada ovo. O painel mostra os ovos incubando e os nascimentos previstos para os próximos 7 dias, e avisa quando algum ovo passa da data prevista.

## Fontes consultadas

- [FurryCritter - Indian Ringneck Parakeet: breeding](https://www.furrycritter.com/pages/life_stages/birds/indian_ringneck_parakeet_breeding.htm)
- [IndianRingneck.com - Breeding](https://indianringneck.com/breeding2)
- [Revista AFA Watchbird](https://watchbird-ojs-tamu.tdl.org/watchbird/article/view/2308/2282)
- [FurryCritter - Cockatiel breeding](https://www.furrycritter.com/pages/life_stages/birds/cockatiel_breeding.htm)
- [National Cockatiel Society - Breeding stats](https://national-cockatielsociety.squarespace.com/reading-library/2015/12/21/breeding-stats-at)
- [Animal Diversity Web - Nymphicus hollandicus](https://animaldiversity.org/accounts/Nymphicus_hollandicus/)
- [VCA Animal Hospitals - Cockatiels](https://vcahospitals.com/know-your-pet/cockatiels-general)
- [Cockatiel Cottage - Breeding cockatiels](https://cockatielcottage.net/month/breeding.html)
$c1$, 'Geral', 'Incubacao', false
where not exists (select 1 from artigos where slug = 'quantos-dias-o-ovo-leva-para-chocar-ring-neck-calopsita');

insert into artigos (id, slug, titulo, resumo, corpo, especie, categoria, publicado)
select gen_random_uuid(), 'idade-para-reproduzir-ring-neck-calopsita', $t2$Idade para reproduzir: quando Ring Neck e Calopsita estão prontos?$t2$, $r2$Maturidade sexual não é o mesmo que idade certa para criar. Veja as idades mais recomendadas, os riscos de reproduzir cedo demais, o descanso entre posturas e quando procurar o veterinário.$r2$, $c2$Uma ave pode estar apta a acasalar muito antes de estar **preparada para criar**. Botar ovos, chocar e alimentar filhotes exige muito do corpo, principalmente da fêmea. Por isso a maioria dos criadores e veterinários recomenda esperar além da primeira maturidade sexual.

## Ring Neck

- **Machos:** em geral são considerados prontos entre 2 e 3 anos, idade que costuma coincidir com o colar completo.
- **Fêmeas:** podem amadurecer um pouco antes, por volta de 1 ano e meio a 2 anos. Criar uma fêmea nova demais aumenta o risco de problemas sérios, como retenção de ovo, falta de cálcio e cuidado inadequado com os filhotes.

## Calopsita

- A maturidade sexual pode vir cedo (há relatos de 6 a 9 meses), mas reproduzir nessa idade é fortemente desaconselhado.
- Os mínimos mais citados variam: de 12 a 18 meses para os machos e de 18 meses a 2 anos para as fêmeas. Muitos criadores preferem esperar os 2 anos para os dois.
- Uma das razões é o cálcio: antes dos 2 anos a fêmea ainda usa as reservas para formar o próprio esqueleto, e a produção de ovos gasta ainda mais.

## Antes de formar o casal

- Os dois devem estar **saudáveis e com peso adequado**. Ave magra, doente ou estressada não deve criar.
- Faça uma **consulta com veterinário de aves antes da temporada**. As fontes citam exames de rotina e a triagem de doenças que passam para os filhotes, como a doença do bico e das penas (PBFD), o poliomavírus e a psitacose. Pergunte ao seu veterinário quais exames fazem sentido para o seu plantel.
- A alimentação precisa ser equilibrada e reforçada nesse período, com atenção a cálcio, proteína e vitaminas. **Tipo e quantidade devem vir do seu veterinário**: não existe receita única.
- Nos Ring Neck, a compatibilidade importa: as fontes sugerem apresentar o casal em gaiolas vizinhas por algumas semanas antes de juntar, observando se há carinho e calma, e nunca forçar um par que se agride.
- Tenha um plano para os filhotes: para quem vão, com que idade e como você vai escolher os novos donos.

## Descanso entre posturas

Botar ovos desgasta a fêmea. A recomendação mais comum é **no máximo duas posturas por ano**, retirando o ninho depois que os filhotes estiverem independentes para o casal descansar. A Lafeber recomenda retirar o ninho e dar ao casal pelo menos 6 meses de descanso quando a fêmea volta a botar ainda com filhotes no ninho. Fêmea que bota ovo atrás de ovo, sem pausa, precisa de acompanhamento veterinário.

## Sinal de emergência: retenção de ovo

Fêmea fazendo força sem conseguir botar, parada no fundo da gaiola ou com respiração difícil precisa de **atendimento veterinário imediato**. Não espere para ver se melhora sozinha.

Este conteúdo é informativo e não substitui a avaliação de um veterinário de aves.

## Fontes consultadas

- [FurryCritter - Indian Ringneck Parakeet: breeding](https://www.furrycritter.com/pages/life_stages/birds/indian_ringneck_parakeet_breeding.htm)
- [FurryCritter - Cockatiel breeding](https://www.furrycritter.com/pages/life_stages/birds/cockatiel_breeding.htm)
- [Revista AFA Watchbird - Cockatiels](https://watchbird-ojs-tamu.tdl.org/watchbird/article/view/1726/1703)
- [National Cockatiel Society - Breeding stats](https://national-cockatielsociety.squarespace.com/reading-library/2015/12/21/breeding-stats-at)
- [Lafeber - Ask Lafeber: breeding](https://lafeber.com/pet-birds/?p=30674)
- [Lafeber - Ask Lafeber: nest box and rest](https://lafeber.com/pet-birds/?p=46039)
$c2$, 'Geral', 'Reproducao', false
where not exists (select 1 from artigos where slug = 'idade-para-reproduzir-ring-neck-calopsita');

insert into artigos (id, slug, titulo, resumo, corpo, especie, categoria, publicado)
select gen_random_uuid(), 'epoca-de-criacao-ring-neck-calopsita', $t3$Época de criação: quando o casal entra em atividade?$t3$, $r3$O que faz Ring Neck e Calopsita entrarem na temporada de reprodução (luz, clima e alimento) e por que datas de sites estrangeiros não valem para o Brasil.$r3$, $c3$Ring Neck e Calopsita não "ligam" a reprodução por calendário: o que conta são os sinais do ambiente.

## O que dispara a temporada

- **Dias mais longos:** nos Ring Neck, a atividade hormonal costuma aumentar quando as horas de luz crescem (na primavera). Em cativeiro, luz artificial, temperatura e alimentação também influenciam, e algumas aves entram em condição de reprodução fora da época natural.
- **Clima favorável e comida em abundância:** na natureza, a calopsita se reproduz quando o tempo está mais quente, há alimento de sobra e um lugar seguro para o ninho. Os relatos sobre a espécie também ligam a reprodução aos períodos de chuva, quando há mais recursos.
- **Ninho adequado e sossego:** a presença de uma caixa-ninho estimula o casal, e privacidade ajuda no sucesso.

## Cuidado com datas de sites estrangeiros

A maior parte do que se publica em inglês vem do hemisfério norte, onde as estações são invertidas em relação às do Brasil. Frases como "a temporada começa em dezembro" ou "vai até junho" **não valem para o nosso calendário**. E mesmo dentro do Brasil o clima do Sul é bem diferente do do Nordeste.

## Calor demais atrapalha

Fontes de criadores e guias australianos recomendam **evitar reproduzir nos meses mais quentes**, porque o calor prejudica a fertilidade e a viabilidade dos ovos. Em cativeiro a calopsita pode se reproduzir o ano todo, mas isso não quer dizer que seja bom para a ave: a fêmea precisa de descansos.

## Como descobrir a época do seu plantel

- Observe o seu casal: interesse pela caixa-ninho, cortejo, o macho oferecendo comida à fêmea e acasalamentos.
- Anote a data de cada postura, ano após ano. Em poucas temporadas você enxerga o padrão do seu clima, da sua alimentação e da sua rotina.
- Converse com criadores da sua região e com um veterinário de aves.

No Avespet, cada postura fica registrada com data, ovos e nascimentos. O histórico de cada casal fica sempre à mão para você comparar uma temporada com a outra.

## Fontes consultadas

- [FurryCritter - Indian Ringneck Parakeet: breeding](https://www.furrycritter.com/pages/life_stages/birds/indian_ringneck_parakeet_breeding.htm)
- [Lafeber - Ask Lafeber: ciclo reprodutivo da calopsita](https://lafeber.com/pet-birds/?p=31085)
- [Burke's Backyard - Cockatiel](https://www.burkesbackyard.com.au/?p=3050)
- [VCA Animal Hospitals - Cockatiels](https://vcahospitals.com/know-your-pet/cockatiels-general-information)
- [Cockatiel Cottage - Breeding cockatiels](https://cockatielcottage.net/month/breeding.html)
- [Noah's Ark - Other birds](https://www.noahs-ark.org/other-birds)
$c3$, 'Geral', 'Reproducao', false
where not exists (select 1 from artigos where slug = 'epoca-de-criacao-ring-neck-calopsita');

insert into artigos (id, slug, titulo, resumo, corpo, especie, categoria, publicado)
select gen_random_uuid(), 'filhotes-na-ninhada-o-que-observar-e-quando-chamar-o-veterinario', $t4$Filhotes na ninhada: o que observar e quando chamar o veterinário$t4$, $r4$Como acompanhar uma ninhada sem atrapalhar os pais, sinais de que está tudo bem e sinais de alerta que pedem um veterinário de aves. Também explica por que este guia não ensina criação manual.$r4$, $c4$Na maior parte das espécies de aves de estimação, pai e mãe se revezam para alimentar os filhotes, regurgitando o alimento. Em uma ninhada saudável, o seu trabalho é **alimentar bem os pais, manter o ambiente calmo e observar sem atrapalhar**.

## Como acompanhar sem estressar o casal

- Faça verificações **curtas e silenciosas**, de preferência quando os pais saem do ninho para comer.
- Evite abrir a caixa o tempo todo: perturbação demais pode levar o casal a abandonar o ninho.
- Ofereça comida macia e variada e água limpa sempre. Os pais comem bem mais enquanto criam.
- **Pese e anote.** Acompanhar o peso é a forma mais objetiva de perceber cedo que algo não vai bem.

## Sinais de que está indo bem

- Filhotes quietos, aquecidos e com alimento no papo depois das refeições dos pais.
- Ganho de peso a cada pesagem.
- Penas e região da cloaca limpas, sem sujeira grudada.

## Sinais de alerta: procure um veterinário de aves

- **Papo que não esvazia** ou que fica aumentado por muito tempo.
- Filhote que **não pede comida** ou perde o interesse em ser alimentado.
- **Perda de peso** ou peso que não aumenta.
- Pernas abertas para os lados, postura ou desenvolvimento anormais.
- Apatia, sono em excesso, olhos sem brilho, penas arrepiadas.
- Sujeira nas penas perto da cloaca.
- Pais que **negligenciam ou machucam** os filhotes.

Aves tendem a disfarçar a doença até ficarem bem mal, e quando o problema aparece ele já pode estar adiantado. Por isso, **na dúvida, ligue para o veterinário no mesmo dia**. Se precisar levar o filhote, mantenha-o aquecido no caminho. Vale deixar o contato de um veterinário de aves anotado **antes** da temporada.

## E a criação manual?

Tirar o filhote dos pais para alimentar à mão é uma decisão séria, com riscos reais: queimadura no papo por fórmula quente demais, aspiração, papo que azeda. As fontes especializadas reforçam um ponto: o ideal é **aprender com um veterinário de aves ou com um criador experiente**, e não só lendo artigos ou assistindo a vídeos. Este guia **não** ensina o passo a passo de propósito.

## Saída do ninho e desmame

- **Calopsita:** os filhotes costumam deixar o ninho entre 4 e 6 semanas e comem sozinhos por volta de 7 a 10 semanas.
- **Ring Neck:** em geral saem do ninho entre 6 e 8 semanas e ficam com os pais até o desmame completo, perto de 10 a 12 semanas.

Depois que todos os filhotes saírem do ninho, retire a caixa para o casal não voltar a botar logo em seguida.

Este conteúdo é informativo e não substitui a avaliação de um veterinário de aves.

## Fontes consultadas

- [Manual Veterinário Merck - Reprodução de aves de estimação](https://merckvetmanual.com/bird-owners/routine-care-and-breeding-of-birds/breeding-and-reproduction-of-pet-birds)
- [Manual Veterinário Merck - Doenças pediátricas das aves](https://www.merckvetmanual.com/veterinary/exotic-and-laboratory-animals/pet-birds/pediatric-diseases-of-pet-birds)
- [Lafeber - Ask Lafeber: filhote que não sai do ninho](https://lafeber.com/pet-birds/?p=32387)
- [Revista AFA Watchbird - Problemas em filhotes](https://watchbird-ojs-tamu.tdl.org/watchbird/article/view/2632/2602)
- [Unusual Pet Vets - Hand rearing companion birds](https://www.unusualpetvets.com.au/hand-rearing-companion-birds)
- [Cockatiel Cottage - Feeding problems](https://cockatielcottage.net/feeding.html)
- [FurryCritter - Indian Ringneck Parakeet: breeding](https://www.furrycritter.com/pages/life_stages/birds/indian_ringneck_parakeet_breeding.htm)
- [Burke's Backyard - Cockatiel](https://www.burkesbackyard.com.au/?p=3050)
$c4$, 'Geral', 'Filhotes', false
where not exists (select 1 from artigos where slug = 'filhotes-na-ninhada-o-que-observar-e-quando-chamar-o-veterinario');

insert into artigos (id, slug, titulo, resumo, corpo, especie, categoria, publicado)
select gen_random_uuid(), 'como-acompanhar-ovos-e-filhotes-no-avespet', $t5$Como acompanhar posturas, ovos e filhotes no Avespet$t5$, $r5$Passo a passo para registrar a postura do casal, cada ovo, o nascimento do filhote e o peso dele, com previsão de eclosão e alertas no painel.$r5$, $c5$O Avespet reúne em um só lugar o casal, a postura, cada ovo e o filhote que nasce dele, já ligado ao pai e à mãe na genealogia. Veja o passo a passo.

## 1. Deixe o casal vinculado no cadastro

No cadastro do macho e da fêmea, use o campo **Parceiro(a) / casal** para ligar um ao outro. Casais vinculados aparecem como atalho na hora de registrar a postura.

## 2. Crie a postura

1. Abra a aba **Reproducao** e clique em **Nova postura**.
2. Escolha o casal pelo **Casal (atalho)** ou selecione o macho e a fêmea.
3. Confira os **Dias de incubacao**: o sistema sugere 24 para Ring Neck e 20 para Calopsita, e você ajusta conforme a sua experiência.
4. Clique em **Salvar**.

## 3. Registre os ovos

No cartão da postura, informe a data (e o peso, se quiser) e clique em **Adicionar ovo**. Cada ovo mostra a **previsão de eclosão** e pode ser marcado como Incubando, Fertil, Infertil ou Perdido.

## 4. Registre o nascimento

Quando o filhote nascer, clique em **Registrar nascimento** no ovo. O Avespet cria o filhote no seu cadastro de aves, já com pai, mãe, espécie e data de nascimento. Você só informa o nome. Se deixar em branco, ele recebe o nome "Filhote" seguido do dia e do mês.

## 5. Acompanhe o peso

Abra o filhote e, no formulário, vá em **Historico de peso**. Informe a data e o peso em gramas, clique em **Adicionar peso** e, no fim do formulário, em **Salvar**. O sistema mostra o último peso, a variação desde a pesagem anterior e, a partir de duas pesagens, um gráfico da evolução. Perda de peso é um dos sinais que merecem atenção, como explicado no guia sobre filhotes na ninhada.

## 6. Use o painel

No painel inicial, os cartões **Ovos incubando** e **Nascimentos em 7 dias** mostram o que está por vir, e um aviso aparece quando algum ovo passa da data prevista.

## 7. Faça backup

Na lista de aves, o botão **Backup** gera um arquivo com todos os seus dados (aves, financeiro, clientes, posturas e mais). Guarde uma cópia de tempos em tempos.

Quer organizar o seu plantel? Crie a sua conta gratuita no Avespet.
$c5$, 'Geral', 'Manejo', false
where not exists (select 1 from artigos where slug = 'como-acompanhar-ovos-e-filhotes-no-avespet');
