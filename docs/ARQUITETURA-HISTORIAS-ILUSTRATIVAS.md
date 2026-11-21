# Histórias ilustrativas programadas

Material exclusivamente educativo: personagens e fotos sintéticos, sem depoimentos, avaliações, registros de recuperação ou métricas falsas. O bloco de reencontros reais permanece independente.

Implementação: `HistoriasIlustrativas.jsx` e `historiasIlustrativas.mjs`. Exibição por data no navegador, com atualização a cada 30 segundos. Calendário de 22 a 29/11/2026 às 10h de Brasília. Não é um cron, não publica nas redes sociais, e os arquivos poderão ficar acessíveis no build antes do horário. Nenhuma alteração de banco ou permissão.

## Gate de publicação

Não importar nem renderizar o componente na página pública enquanto as oito imagens WebP não estiverem presentes em `public/historias-ilustrativas/`. Esta branch é preparação de código; o pacote de imagens ainda precisa ser recebido. Após obter as imagens, executar `node --test tests/historias-ilustrativas.test.mjs`, os testes existentes e o build. Adicionar a importação e o componente abaixo de ReencontrosPublicos na página SolicitarCampanha. Rever o calendário antes de publicar se a data inicial já passou. Controle pelo Master não implementado nesta versão.
