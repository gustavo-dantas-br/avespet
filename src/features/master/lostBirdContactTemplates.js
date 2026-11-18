// Mensagens individuais de acompanhamento. Nunca pressupor que a ave foi encontrada.
const tidy = (value, limit = 100) => String(value || "")
  .replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, limit);
const firstName = value => tidy(value).split(" ")[0] || "tudo bem";
const dateBR = value => /^\d{4}-\d{2}-\d{2}$/.test(value || "")
  ? value.split("-").reverse().join("/") : "";
export function whatsappDigits(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) return digits;
  if (digits.length === 10 || digits.length === 11) return "55" + digits;
  return "";
}
export function lostBirdMessage(ad, kind = "acompanhamento") {
  const d = ad?.data || {};
  const owner = firstName(d.contatoNome);
  const bird = tidy(d.nomeAve || "sua ave");
  const species = tidy(d.especie);
  const color = tidy(d.cor);
  const city = tidy(d.cidade);
  const uf = tidy(d.uf, 2);
  const when = dateBR(d.dataPerda);
  const details = [species, color].filter(Boolean).join(" ") || "ave";
  const place = [city, uf].filter(Boolean).join("/");
  const description = [details, place ? "em " + place : "", when ? "desaparecida em " + when : ""]
    .filter(Boolean).join(", ");
  const intro = `Olá, ${owner}! Tudo bem? 🦜💚\n\nAqui é da equipe Avespet!\n\nEstamos acompanhando a busca por ${bird}, ${description}.`;
  const campaignUrl = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(ad?.id || ""))
    ? "https://www.avespet.com.br/campanha-ave-perdida?anuncio=" + encodeURIComponent(ad.id)
    : "https://www.avespet.com.br/campanha-ave-perdida";
  const boostPitch = `\n\n🟢 *Se ${bird} ainda estiver desaparecida, podemos ampliar a divulgação!*\n\nO anúncio gratuito no Avespet continua disponível para consulta e compartilhamento. Ele é importante, mas a divulgação orgânica depende de quem vê e compartilha a publicação.\n\n📣 *Como funciona o impulsionamento?* É uma divulgação paga no Facebook e Instagram (Meta), direcionada à cidade onde a ave desapareceu e a áreas próximas, para que mais pessoas possam ver a foto e as informações da busca, mesmo sem seguir o Avespet.

💡 *Imagine esta situação:* alguém encontra uma ave parecida com ${bird}, mas não sabe qual é a espécie. Essa pessoa pode procurar informações na internet para tentar identificá-la. Se também utilizar Facebook ou Instagram, poderá encontrar o anúncio de ${bird} durante a campanha, caso esteja entre as pessoas alcançadas na região. Assim, pode reconhecer a ave e avisar nossa equipe.

*Importante:* a pesquisa na internet não ativa automaticamente o anúncio no Facebook ou Instagram. A campanha amplia a divulgação regional e cria mais oportunidades de encontrar alguém que tenha visto ou acolhido a ave.\n\nA campanha é opcional: nossa equipe analisa a região, apresenta um orçamento e só inicia a divulgação após sua aprovação e confirmação do pagamento. *Não há garantia de recuperação.*\n\n👉 Solicite uma proposta sem compromisso: ${campaignUrl}`;

  const outro = `\n\nSe ${bird} já estiver em casa, ficaremos muito felizes em registrar esse final feliz. Ela continuará na página de aves perdidas, identificada como “🦜💚 Reencontrada! Final feliz!”.\n\nVocê também poderá deixar uma avaliação ou depoimento sobre sua experiência, se desejar. A publicação dependerá da sua autorização.\n\n🌐 www.avespet.com.br\n\nEquipe Avespet 💚\nConectando pessoas, cuidando de aves.`;
  if (kind === "possivel_reencontro") return {
    subject: `Avespet | Possível notícia sobre ${bird}`,
    text: intro + `\n\nRecebemos informações que podem indicar que ${bird} foi localizada. Ainda não temos a confirmação da família e gostaríamos de verificar diretamente com você.\n\n**Você pode nos confirmar se ${bird} já voltou para casa em segurança?**` + boostPitch + outro,
  };
  return {
    subject: `Avespet | Como está a busca por ${bird}?`,
    text: intro + `\n\nSeu anúncio continua disponível no Avespet, para ampliar a visibilidade da busca e ajudar a conectar pessoas.\n\n**Você tem alguma novidade sobre ${bird}? Ela já retornou para casa em segurança?**` + boostPitch + outro,
  };
}
