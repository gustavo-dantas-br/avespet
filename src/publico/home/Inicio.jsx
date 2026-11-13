import React from "react";
import { Link } from "../roteador";

const FOTOS = {
  ringneck: "https://images.pexels.com/photos/1463295/pexels-photo-1463295.jpeg?auto=compress&cs=tinysrgb&w=1400",
  calopsita: "https://images.pexels.com/photos/32276363/pexels-photo-32276363.jpeg?auto=compress&cs=tinysrgb&w=1400",
  arara: "https://images.pexels.com/photos/19649411/pexels-photo-19649411.jpeg?auto=compress&cs=tinysrgb&w=1400",
};

const GALERIA_PSITACIDEOS = [
  { nome: "Ring Neck", detalhe: "Verde e tons naturais", foto: FOTOS.ringneck, alt: "Ring Neck verde em fotografia de alta definição" },
  { nome: "Calopsita", detalhe: "Lutino e cara-branca", foto: FOTOS.calopsita, alt: "Calopsita clara com bochechas alaranjadas" },
  { nome: "Agapórnis", detalhe: "Cores vibrantes", foto: "https://images.unsplash.com/photo-1518001589401-1743b61d1def?auto=format&fit=crop&w=1400&q=90", alt: "Casal de agapórnis coloridos em um galho" },
  { nome: "Periquito-australiano", detalhe: "Azul, verde e amarelo", foto: "https://images.pexels.com/photos/12565371/pexels-photo-12565371.jpeg?auto=compress&cs=tinysrgb&w=1400", alt: "Periquito australiano verde e amarelo" },
  { nome: "Arara", detalhe: "Azul e amarelo", foto: FOTOS.arara, alt: "Arara azul e amarela em ambiente natural" },
  { nome: "Jandaia / Conure", detalhe: "Amarelo, laranja e verde", foto: "https://images.pexels.com/photos/32923339/pexels-photo-32923339.jpeg?auto=compress&cs=tinysrgb&w=1400", alt: "Jandaia do sol colorida em galho" },
];

const verde = "#174B3B";
const verdeClaro = "#E8F1E9";
const tinta = "#1D2B25";
const texto = "#63736A";

function Tag({ children }) {
  return <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold" style={{ background: verdeClaro, color: verde }}>{children}</span>;
}

function TituloSecao({ etiqueta, titulo, descricao, claro = false }) {
  return (
    <div className="max-w-2xl mb-8">
      {etiqueta && <div className="mb-3"><Tag>{etiqueta}</Tag></div>}
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: claro ? "#F4F7F2" : tinta, fontFamily: "'Fraunces', Georgia, serif", lineHeight: 1.12 }}>{titulo}</h2>
      {descricao && <p className="mt-3 text-base leading-7" style={{ color: claro ? "#C4D5CA" : texto }}>{descricao}</p>}
    </div>
  );
}

function Acao({ children, onClick, href, secundaria = false }) {
  const style = secundaria
    ? { background: "#FFFFFF", color: verde, border: "1px solid #D7E3D9" }
    : { background: verde, color: "#FFFFFF", border: "1px solid " + verde };
  const classes = "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5";
  if (href) return <Link para={href} className={classes} style={style}>{children}</Link>;
  return <button type="button" onClick={onClick} className={classes} style={style}>{children}</button>;
}

function CartaoServico({ foto, alt, etiqueta, titulo, descricao, href, acao }) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white" style={{ border: "1px solid #E3EAE4", boxShadow: "0 12px 34px rgba(22,58,42,.06)" }}>
      <div className="aspect-[16/10] overflow-hidden bg-slate-100">
        <img src={foto} alt={alt} loading="lazy" className="h-full w-full object-cover transition duration-500 hover:scale-105" />
      </div>
      <div className="p-5 md:p-6">
        <div className="mb-3"><Tag>{etiqueta}</Tag></div>
        <h3 className="text-xl font-bold" style={{ color: tinta }}>{titulo}</h3>
        <p className="mt-2 min-h-[72px] text-sm leading-6" style={{ color: texto }}>{descricao}</p>
        <Link para={href} className="mt-4 inline-flex items-center gap-2 text-sm font-bold" style={{ color: verde }}>{acao} <span aria-hidden="true">→</span></Link>
      </div>
    </article>
  );
}

export default function Inicio({ BuscaAnilha, VitrinePublica, GuiasEmDestaque, onEntrar }) {
  const galeriaRef = React.useRef(null);
  const [galeriaPausada, setGaleriaPausada] = React.useState(false);
  const [interacaoGaleria, setInteracaoGaleria] = React.useState(false);
  const [movimentoReduzido, setMovimentoReduzido] = React.useState(false);

  React.useEffect(() => {
    const preferencia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const atualizarPreferencia = () => setMovimentoReduzido(preferencia.matches);
    atualizarPreferencia();
    preferencia.addEventListener("change", atualizarPreferencia);
    return () => preferencia.removeEventListener("change", atualizarPreferencia);
  }, []);

  React.useEffect(() => {
    const galeria = galeriaRef.current;
    if (!galeria || galeriaPausada || interacaoGaleria || movimentoReduzido) return undefined;

    const avancarGaleria = () => {
      const primeiroCartao = galeria.querySelector("article");
      if (!primeiroCartao) return;

      const distancia = primeiroCartao.getBoundingClientRect().width + 16;
      const chegouAoFim = galeria.scrollLeft + galeria.clientWidth >= galeria.scrollWidth - 8;

      galeria.scrollTo({
        left: chegouAoFim ? 0 : galeria.scrollLeft + distancia,
        behavior: "smooth",
      });
    };

    const intervalo = window.setInterval(avancarGaleria, 6500);
    return () => window.clearInterval(intervalo);
  }, [galeriaPausada, interacaoGaleria, movimentoReduzido]);

  const rolarGaleria = (distancia) => galeriaRef.current?.scrollBy({
    left: distancia,
    behavior: movimentoReduzido ? "auto" : "smooth",
  });

  const irPara = (id) => document.getElementById(id)?.scrollIntoView({
    behavior: movimentoReduzido ? "auto" : "smooth",
    block: "start",
  });

  return (
    <div className="pb-16" style={{ background: "#F5F7F3", color: tinta }}>
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-14 pt-10 md:grid-cols-[1.02fr_.98fr] md:px-8 md:pb-20 md:pt-16">
        <div>
          <div className="mb-5 flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: "#6EAA7C" }} /><span className="text-xs font-bold uppercase tracking-[.18em]" style={{ color: verde }}>Avespet • cuidado, conexão e gestão</span></div>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-6xl" style={{ color: tinta, fontFamily: "'Fraunces', Georgia, serif", lineHeight: 1.04 }}>
            Tudo para quem vive o <span style={{ color: verde }}>universo das aves.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 md:text-lg" style={{ color: texto }}>
            Proteja sua ave, encontre aves perdidas, conheça criadores e organize seu criatório em um só lugar.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Acao onClick={() => irPara("tutores")}>Sou tutor / apaixonado por aves</Acao>
            <Acao secundaria onClick={() => irPara("criadores")}>Sou criador</Acao>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium" style={{ color: texto }}>
            <span>✓ Cadastro gratuito</span><span>✓ Consulta pública de anilhas</span><span>✓ Ferramentas para criadores</span>
          </div>
        </div>
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[.16em]" style={{ color: verde }}>Galeria Avespet</div>
              <div className="mt-1 text-lg font-bold" style={{ color: tinta }}>A beleza dos psitacídeos</div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button type="button" aria-label="Ver aves anteriores" onClick={() => rolarGaleria(-290)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow-sm" style={{ border: "1px solid #DCE7DE", color: verde }}>‹</button>
              <button type="button" aria-label="Ver próximas aves" onClick={() => rolarGaleria(290)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow-sm" style={{ border: "1px solid #DCE7DE", color: verde }}>›</button>
              <button
                type="button"
                onClick={() => setGaleriaPausada((pausada) => !pausada)}
                disabled={movimentoReduzido}
                aria-pressed={galeriaPausada}
                className="rounded-full bg-white px-3 py-2 text-xs font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                style={{ border: "1px solid #DCE7DE", color: verde }}
              >
                {movimentoReduzido ? "Movimento reduzido" : galeriaPausada ? "Retomar" : "Pausar"}
              </button>
            </div>
          </div>
          <div
            ref={galeriaRef}
            onMouseEnter={() => setInteracaoGaleria(true)}
            onMouseLeave={() => setInteracaoGaleria(false)}
            onFocusCapture={() => setInteracaoGaleria(true)}
            onBlurCapture={() => setInteracaoGaleria(false)}
            onTouchStart={() => setInteracaoGaleria(true)}
            onTouchEnd={() => setInteracaoGaleria(false)}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4"
            style={{ scrollbarWidth: "thin" }}
            aria-label="Galeria de psitacídeos" aria-live="off"
          >
            {GALERIA_PSITACIDEOS.map((ave, index) => (
              <article key={ave.nome} className="w-[78%] shrink-0 snap-start overflow-hidden rounded-[1.6rem] bg-white shadow-lg sm:w-[62%] md:w-[72%]" style={{ border: "1px solid #E3EAE4" }}>
                <div className="relative h-[330px] overflow-hidden bg-[#E8F1E9]">
                  <img src={ave.foto} alt={ave.alt} loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-5 pb-5 pt-14">
                    <div className="text-xl font-bold text-white">{ave.nome}</div>
                    <div className="mt-1 text-sm text-white/90">{ave.detalhe}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-1 text-xs" style={{ color: texto }}>Uma pequena amostra da diversidade e das cores do universo dos psitacídeos.</p>
        </div>
      </section>

      <section id="tutores" className="scroll-mt-8 px-5 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <TituloSecao etiqueta="Para tutores e apaixonados por aves" titulo="Sua ave já está cadastrada?" descricao="Se ela escapar e alguém a encontrar, a identificação pode fazer toda a diferença. Cadastre sua ave e, se ela desaparecer, registre a busca com o número da anilha para que quem a encontrar possa consultar o anúncio e facilitar o reencontro." />
          <div className="grid gap-5 md:grid-cols-3">
            <CartaoServico foto={FOTOS.calopsita} alt="Calopsita em galho" etiqueta="Proteção" titulo="Cadastre e proteja sua ave" descricao="Mantenha os dados de identificação organizados. Se ela desaparecer, publique a busca e informe a anilha." href="/aves-perdidas" acao="Ver aves perdidas" />
            <CartaoServico foto={FOTOS.ringneck} alt="Ring Neck verde" etiqueta="Reencontro" titulo="Encontrou uma ave?" descricao="Consulte o número da anilha. Se houver um registro de desaparecimento, o Avespet ajuda a aproximar quem encontrou de quem procura." href="/achei-uma-ave" acao="Consultar anilha" />
            <CartaoServico foto={FOTOS.arara} alt="Arara azul e amarela" etiqueta="Divulgação" titulo="Amplie sua busca" descricao="Solicite uma campanha regional para divulgar o desaparecimento e alcançar mais pessoas na região." href="/campanha-ave-perdida" acao="Conhecer campanhas" />
          </div>
          <div className="mt-7 flex flex-col items-start justify-between gap-4 rounded-2xl p-6 md:flex-row md:items-center md:p-8" style={{ background: verdeClaro }}>
            <div className="max-w-2xl">
              <h3 className="text-xl font-bold" style={{ color: verde }}>Não espere sua ave desaparecer para se preparar.</h3>
              <p className="mt-2 text-sm leading-6" style={{ color: "#4E6758" }}>Crie sua conta gratuitamente e conheça os recursos de identificação e proteção do Avespet.</p>
            </div>
            <Acao onClick={onEntrar}>Criar minha conta gratuita</Acao>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-7xl rounded-[2rem] px-5 py-10 md:px-10 md:py-14" style={{ background: "#173E32" }}>
          <div className="grid items-center gap-8 md:grid-cols-[.8fr_1.2fr]">
            <div>
              <TituloSecao etiqueta="Busca pública" titulo="Encontrou uma ave? Consulte a anilha." descricao="Digite a identificação e veja se existe um registro de ave desaparecida. Se não encontrar, você também pode avisar nossa equipe." claro />
              <Link para="/achei-uma-ave" className="inline-flex rounded-xl px-5 py-3 text-sm font-bold" style={{ background: "#DDEBDD", color: verde }}>Abrir consulta de anilha →</Link>
            </div>
            <div className="rounded-2xl p-4 md:p-6" style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.14)" }}>
              <BuscaAnilha />
            </div>
          </div>
        </div>
      </section>

      <section id="criadores" className="scroll-mt-8 px-5 py-14 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-[.9fr_1.1fr]">
          <div className="overflow-hidden rounded-[2rem] shadow-xl">
            <img src={FOTOS.arara} alt="Arara em destaque" loading="lazy" className="h-[360px] w-full object-cover md:h-[480px]" />
          </div>
          <div>
            <TituloSecao etiqueta="Para criadores" titulo="Seu criatório organizado. Sua criação em evolução." descricao="Tenha em um só lugar as informações do seu plantel e as ferramentas para acompanhar a rotina do criatório, do nascimento à venda." />
            <div className="mb-7 grid grid-cols-2 gap-3">
              {["Cadastro e histórico do plantel", "Genética e árvore genealógica", "Reprodução e acompanhamento", "Financeiro e despesas", "Clientes e fornecedores", "Anúncios e pós-venda"].map((item) => <div key={item} className="rounded-xl bg-white p-3 text-sm font-semibold" style={{ border: "1px solid #E3EAE4", color: "#3E5548" }}>✓ {item}</div>)}
            </div>
            <div className="flex flex-wrap gap-3">
              <Acao onClick={onEntrar}>Criar conta gratuita</Acao>
              <Acao href="/aves-a-venda" secundaria>Ver aves anunciadas</Acao>
            </div>
            <p className="mt-3 text-xs" style={{ color: texto }}>Comece gratuitamente. Recursos e serviços adicionais poderão ter planos próprios.</p>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 md:px-8 md:py-20" style={{ background: "#EAF1EB" }}>
        <div className="mx-auto max-w-7xl">
          <TituloSecao etiqueta="Vitrine pública" titulo="Aves disponíveis para conhecer" descricao="Veja anúncios publicados por criadores cadastrados no Avespet." />
          <VitrinePublica />
          <div className="mt-7 text-center"><Link para="/aves-a-venda" className="text-sm font-bold" style={{ color: verde }}>Explorar todas as aves à venda →</Link></div>
        </div>
      </section>

      <section className="px-5 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <TituloSecao etiqueta="Aprenda e compartilhe" titulo="Conteúdo para cuidar melhor das suas aves" descricao="Guias e vídeos para quem está começando ou quer aprofundar seus conhecimentos." />
          <GuiasEmDestaque />
        </div>
      </section>


      <section id="historias" className="px-5 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <TituloSecao etiqueta="Experiências na comunidade" titulo="Histórias que fazem a diferença" descricao="O Avespet nasceu para apoiar quem cuida, cria e ama aves. Veja algumas formas como a plataforma pode ajudar no dia a dia." />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { titulo: "Mais organização no criatório", texto: "Plantel, histórico, reprodução e informações importantes reunidos em um só lugar.", tema: "Gestão do plantel" },
              { titulo: "Apoio quando uma ave desaparece", texto: "Consulta de anilha e divulgação ajudam a aproximar quem encontrou de quem está procurando.", tema: "Proteção e reencontro" },
              { titulo: "Conhecimento compartilhado", texto: "Guias e vídeos ajudam tutores e criadores a aprender e cuidar melhor das aves.", tema: "Aprendizado" },
            ].map((item) => (
              <article key={item.tema} className="rounded-2xl bg-white p-6" style={{ border: "1px solid #DCE7DE", boxShadow: "0 10px 28px rgba(22,58,42,.05)" }}>
                <div className="mb-4 inline-flex rounded-full px-3 py-1 text-xs font-bold" style={{ background: verdeClaro, color: verde }}>Como o Avespet ajuda</div>
                <h3 className="text-xl font-bold" style={{ color: tinta, fontFamily: "'Fraunces', Georgia, serif" }}>{item.titulo}</h3>
                <p className="mt-3 text-sm leading-6" style={{ color: texto }}>{item.texto}</p>
              </article>
            ))}
          </div>
          <p className="mt-5 text-center text-xs" style={{ color: texto }}>Em breve: relatos e avaliações de usuários, publicados com autorização dos participantes.</p>
        </div>
      </section>

      <section className="px-5 pb-4 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 rounded-[2rem] p-7 md:flex-row md:items-center md:p-10" style={{ background: "#173E32" }}>
          <div>
            <h2 className="text-2xl font-bold md:text-3xl" style={{ color: "#FFFFFF", fontFamily: "'Fraunces', Georgia, serif" }}>Faça parte do universo Avespet.</h2>
            <p className="mt-2 text-sm" style={{ color: "#C4D5CA" }}>Crie sua conta gratuitamente e descubra tudo o que a plataforma oferece.</p>
          </div>
          <Acao onClick={onEntrar} secundaria>Começar gratuitamente</Acao>
        </div>
      </section>
    </div>
  );
}
