// Material educativo fictício, não é registro de recuperação nem avaliação de clientes.
export const historias = [
 ['thor','Thor','cobalto','Sorocaba/SP','Google e consulta de anilha','Neste cenário, um morador acolhe Thor, pesquisa no Google como identificar o tutor pela anilha e encontra o Avespet. A consulta aponta um possível responsável; a identidade precisa ser confirmada antes da entrega.'],
 ['luna','Luna','azul','Campinas/SP','Divulgação no Instagram','Neste cenário, uma moradora reconhece Luna em uma divulgação regional no Instagram e comunica o local do avistamento.'],
 ['pipoca','Pipoca','lutino','Guarulhos/SP','Pesquisa no Google','Neste cenário, um conhecido da família pesquisa no Google sobre uma ave amarela encontrada e compartilha o anúncio do Avespet com quem a acolheu.'],
 ['chico','Chico','verde','Santo André/SP','Identificação do tutor','Neste cenário, Chico aparece em um quintal. Quem o acolhe consulta a anilha no Avespet e registra o achado para verificar o possível titular.'],
 ['mel','Mel','turquesa','Jundiaí/SP','Reconhecimento pela foto','Neste cenário, uma moradora pesquisa anúncios de aves perdidas na região e reconhece Mel pela fotografia. Ela encaminha as informações para confirmação.'],
 ['blue','Blue','azul jovem','Osasco/SP','Divulgação no Facebook','Neste cenário, um morador vê a foto de Blue, jovem sem colar, no Facebook e envia um aviso de possível avistamento.'],
 ['kiwi','Kiwi','verde jovem','São José dos Campos/SP','Compartilhamento pelo WhatsApp','Neste cenário, um conhecido recebe o link pelo WhatsApp e reconhece características de uma ave acolhida por um vizinho.'],
 ['sol','Sol','lutino jovem','Ribeirão Preto/SP','Registro de ave encontrada','Neste cenário, uma pessoa pesquisa no Google como devolver uma ave encontrada e registra o achado no Avespet, informando localização e características para verificação.'],
].map(([id,nome,cor,cidade,canal,relato],i)=>Object.freeze({id,nome,cor,cidade,canal,relato,imagem:`/historias-ilustrativas/${id}.webp`,publicarEm:`2026-11-${22+i}T10:00:00-03:00`}));
export function historiasDisponiveis(agora=Date.now()) {
 return historias.filter(h=>Date.parse(h.publicarEm)<=agora).reverse();
}
