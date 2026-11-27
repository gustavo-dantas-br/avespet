import React, { useEffect, useState } from "react";
import { listarAvesPerdidas } from "../services/avesPerdidasService";
import { listarPacotesPublicos } from "../../campanhas/services/campanhasService";
import PerdiUmaAve from "./PerdiUmaAve";
import { Link } from "../../../publico/roteador";
import { useSEO } from "../../../publico/seo";
import { PaginaPublica, CartaoPublico, TEMA_PUBLICO } from "../../../publico/ComponentesPublicos";

const DESTAQUES_AVES = [
  {
    id: "ring-neck",
    especie: "Ring Neck",
    chamada: "Seu Ring Neck merece uma busca que não pare.",
    texto: "Cor, mutação, anilha e local do último avistamento: cada detalhe pode ajudar alguém a reconhecer sua ave.",
    imagem: "https://cdn.pixabay.com/photo/2021/01/18/18/17/indian-ring-necked-parakeet-5929020_1280.jpg",
    alt: "Ring Neck azul e verde pousados lado a lado",
    etiqueta: "Identificação por detalhes",
    posicao: "center 45%",
  },
  {
    id: "calopsita",
    especie: "Calopsita",
    chamada: "Topete, bochechas e cores. Cada detalhe conta.",
    texto: "Uma boa fotografia e uma descrição cuidadosa ajudam a comunidade a identificar uma calopsita desaparecida.",
    imagem: "https://images.unsplash.com/photo-1759384278288-14f680d9cae7?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=80&w=2400",
    alt: "Calopsita com topete amarelo e bochecha alaranjada",
    etiqueta: "Uma foto faz diferença",
    posicao: "center 38%",
  },
  {
    id: "agapornis",
    especie: "Agapornis",
    chamada: "Pequeno no tamanho. Gigante no coração.",
    texto: "Registre o desaparecimento, conte como reconhecer seu Agapornis e ajude a informação a chegar mais longe.",
    imagem: "https://images.pexels.com/photos/30518528/pexels-photo-30518528/free-photo-of-pair-of-colorful-lovebirds-in-gentle-embrace.jpeg?auto=compress&dpr=1&h=1200&w=2000",
    alt: "Dois Agapornis verdes aconchegados em um galho",
    etiqueta: "Compartilhe a informação",
    posicao: "center 45%",
  },
  {
    id: "loris",
    especie: "Lóris",
    chamada: "Uma ave cheia de cores merece ser reconhecida.",
    texto: "Descreva as cores da plumagem, envie uma fotografia e conte com o cadastro gratuito para iniciar a busca.",
    imagem: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Rainbow_larakeet.jpg",
    alt: "Lóris-arco-íris com plumagem azul, verde e laranja",
    etiqueta: "Cores que ajudam a identificar",
    posicao: "center 35%",
  },
];

function dataBrasil(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor || "")) return "";
  const [ano, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${ano}`;
}

function dinheiro(centavos) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(centavos || 0) / 100);
}

function SecaoTitulo({ etiqueta, titulo, texto, centralizado = false }) {
  return (
    <div className={`mb-8 ${centralizado ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}`}>
      <span className="text-xs font-extrabold uppercase tracking-[.16em]" style={{ color: TEMA_PUBLICO.verde }}>{etiqueta}</span>
      <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl" style={{ color: TEMA_PUBLICO.tinta, fontFamily: "'Fraunces', Georgia, serif" }}>{titulo}</h2>
      {texto && <p className="mt-3 text-sm leading-7 md:text-base" style={{ color: TEMA_PUBLICO.texto }}>{texto}</p>}
    </div>
  );
}

function PlanoCard({ plano, destaque = false }) {
  const alcance = plano.reach_min && plano.reach_max
    ? `Estimativa de ${Number(plano.reach_min).toLocaleString("pt-BR")} a ${Number(plano.reach_max).toLocaleString("pt-BR")} pessoas`
    : plano.reach_label;
  return (
    <article className="relative flex h-full flex-col rounded-2xl p-5 md:p-6" style={{ background: "#FFFFFF", border: destaque ? `2px solid ${TEMA_PUBLICO.verde}` : `1px solid ${TEMA_PUBLICO.borda}`, boxShadow: destaque ? "0 16px 36px rgba(23,75,59,.12)" : "0 8px 24px rgba(22,58,42,.05)" }}>
      {destaque && <span className="absolute -top-3 left-5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider" style={{ background: TEMA_PUBLICO.verde, color: "#FFFFFF" }}>Mais alcance</span>}
      <div className="text-xs font-bold uppercase tracking-wider" style={{ color: TEMA_PUBLICO.verde }}>{plano.duration_days} dias de divulgação</div>
      <h3 className="mt-2 text-xl font-bold" style={{ color: TEMA_PUBLICO.tinta }}>{plano.name}</h3>
      <p className="mt-2 min-h-[48px] text-sm leading-6" style={{ color: TEMA_PUBLICO.texto }}>{plano.description}</p>
      <div className="mt-5">
        <span className="text-3xl font-extrabold tracking-tight" style={{ color: TEMA_PUBLICO.tinta }}>{dinheiro(plano.price_cents)}</span>
        <span className="ml-2 text-xs" style={{ color: TEMA_PUBLICO.texto }}>valor total</span>
      </div>
      <div className="mt-4 rounded-xl p-3" style={{ background: TEMA_PUBLICO.fundo }}>
        <div className="text-xs font-bold" style={{ color: TEMA_PUBLICO.tinta }}>{plano.reach_label}</div>
        {alcance && <p className="mt-1 text-xs leading-5" style={{ color: TEMA_PUBLICO.texto }}>{alcance}</p>}
      </div>
      <ul className="mt-4 space-y-2 text-sm" style={{ color: TEMA_PUBLICO.texto }}>
        <li>✓ Divulgação por {plano.duration_days} dias</li>
        <li>✓ Alcance geográfico planejado</li>
        <li>✓ Atendimento da equipe Avespet</li>
      </ul>
      <Link para={`/campanha-ave-perdida?pacote=${encodeURIComponent(plano.code)}`} className="mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold transition hover:brightness-105" style={{ background: TEMA_PUBLICO.verde, color: "#FFFFFF" }}>
        Solicitar este plano
      </Link>
      <p className="mt-3 text-center text-[11px] leading-5" style={{ color: TEMA_PUBLICO.texto }}>Solicitação sujeita à análise. Nenhuma cobrança nesta etapa.</p>
    </article>
  );
}


      <section
        className="relative isolate min-h-[560px] overflow-hidden bg-[#123D2E] md:min-h-[620px]"
        aria-roledescription="carrossel"
        aria-label="Destaques de aves atendidas pelo Avespet"
        onMouseEnter={() => setCarrosselPausado(true)}
        onMouseLeave={() => setCarrosselPausado(false)}
        onFocusCapture={() => setCarrosselPausado(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setCarrosselPausado(false);
        }}
      >
        {DESTAQUES_AVES.map((slide, indice) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${indice === slideAtual ? "opacity-100" : "pointer-events-none opacity-0"}`}
            aria-hidden={indice !== slideAtual}
          >
            <img
              src={slide.imagem}
              alt={indice === slideAtual ? slide.alt : ""}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: slide.posicao }}
              loading={indice === 0 ? "eager" : "lazy"}
              fetchPriority={indice === 0 ? "high" : "auto"}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-[#092D20]/95 via-[#0B3827]/75 to-[#0B3827]/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#092D20]/65 via-transparent to-[#092D20]/10" />

        <div className="relative mx-auto flex min-h-[560px] max-w-7xl flex-col justify-center px-5 pb-28 pt-16 md:min-h-[620px] md:px-8 md:pb-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[.16em] text-white backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-[#B9D8BE]" />
              Rede de apoio Avespet
            </span>
            <p className="mt-7 text-sm font-extrabold uppercase tracking-[.2em] text-[#C6E2CB]">
              {DESTAQUES_AVES[slideAtual].especie} · {DESTAQUES_AVES[slideAtual].etiqueta}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-white md:text-6xl" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
              {DESTAQUES_AVES[slideAtual].chamada}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#E1EEE5] md:text-lg">
              {DESTAQUES_AVES[slideAtual].texto}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => { setMostrarCadastro(true); document.getElementById("cadastro-ave")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                className="rounded-xl px-6 py-4 text-sm font-extrabold shadow-xl transition hover:-translate-y-0.5 hover:brightness-105"
                style={{ background: "#FFFFFF", color: TEMA_PUBLICO.verde }}
              >
                Cadastrar ave gratuitamente
              </button>
              <a href="#planos" className="rounded-xl border border-white/50 bg-white/10 px-6 py-4 text-center text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20">
                Conhecer planos de divulgação
              </a>
            </div>
            <p className="mt-4 text-xs text-[#D1E2D6]">Cadastro gratuito. Planos pagos são opcionais e não garantem o reencontro.</p>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto flex max-w-7xl items-end justify-between gap-4 px-5 pb-6 md:px-8 md:pb-8">
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Escolher espécie em destaque">
              {DESTAQUES_AVES.map((slide, indice) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setSlideAtual(indice)}
                  aria-label={`Ver destaque de ${slide.especie}`}
                  aria-pressed={slideAtual === indice}
                  className={`h-2.5 rounded-full transition-all ${slideAtual === indice ? "w-10 bg-white" : "w-2.5 bg-white/55 hover:bg-white/85"}`}
                />
              ))}
              <span className="ml-2 text-xs font-semibold text-white/90">{String(slideAtual + 1).padStart(2, "0")} / 04</span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => irParaSlide(-1)} aria-label="Slide anterior" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/45 bg-black/20 text-xl text-white backdrop-blur-sm transition hover:bg-white/20">‹</button>
              <button type="button" onClick={() => irParaSlide(1)} aria-label="Próximo slide" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/45 bg-black/20 text-xl text-white backdrop-blur-sm transition hover:bg-white/20">›</button>
            </div>
          </div>
        </div>
      </section>

cimento da sua ave, compartilhe as informações e conte com uma rede que ajuda a aproximar quem procura de quem pode encontrar.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => { setMostrarCadastro(true); document.getElementById("cadastro-ave")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="rounded-xl px-6 py-4 text-sm font-extrabold shadow-lg transition hover:brightness-105" style={{ background: "#FFFFFF", color: TEMA_PUBLICO.verde }}>
                Cadastrar ave gratuitamente
              </button>
              <a href="#planos" className="rounded-xl border px-6 py-4 text-center text-sm font-bold transition hover:bg-white/10" style={{ borderColor: "rgba(255,255,255,.35)", color: "#FFFFFF" }}>
                Conhecer planos de divulgação
              </a>
            </div>
            <p className="mt-4 text-xs" style={{ color: "#B9CEC0" }}>Cadastro gratuito. Planos pagos são opcionais e não garantem o reencontro.</p>
          </div>
          <div className="rounded-3xl p-5 md:p-7" style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.16)" }}>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: "rgba(255,255,255,.13)" }}>🦜</div>
              <div>
                <p className="text-sm font-bold text-white">A primeira atitude é simples</p>
                <p className="text-xs" style={{ color: "#C5D8CB" }}>Comece sem pagar nada.</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {[
                ["01", "Registre a ave", "Informe as características e onde foi vista pela última vez."],
                ["02", "Acompanhe a análise", "Nossa equipe revisa as informações antes da publicação."],
                ["03", "Amplie se desejar", "Conheça opções extras de divulgação depois do cadastro."],
              ].map(([n, titulo, descricao]) => (
                <div key={n} className="flex gap-4 rounded-2xl p-4" style={{ background: "rgba(255,255,255,.07)" }}>
                  <span className="text-sm font-extrabold" style={{ color: "#B9D8BE" }}>{n}</span>
                  <div><p className="text-sm font-bold text-white">{titulo}</p><p className="mt-1 text-xs leading-5" style={{ color: "#C5D8CB" }}>{descricao}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PaginaPublica>
        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["Cadastro gratuito", "Registre a ocorrência sem contratar um plano de divulgação."],
            ["Contato protegido", "Seus dados de contato não são exibidos na vitrine pública."],
            ["Apoio da equipe", "O Avespet intermedeia o contato de quem encontrou uma ave anunciada."],
          ].map(([titulo, texto]) => (
            <div key={titulo} className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: `1px solid ${TEMA_PUBLICO.borda}` }}>
              <h2 className="font-bold" style={{ color: TEMA_PUBLICO.tinta }}>{titulo}</h2>
              <p className="mt-2 text-sm leading-6" style={{ color: TEMA_PUBLICO.texto }}>{texto}</p>
            </div>
          ))}
        </section>

        <section className="mt-16">
          <SecaoTitulo etiqueta="Como funciona" titulo="Um caminho claro, do cadastro à divulgação" texto="Você começa pelo registro gratuito. Depois, decide se quer ampliar a divulgação da busca." centralizado />
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["1", "Cadastre", "Conte o que aconteceu e envie uma foto da ave."],
              ["2", "Confirme sua conta", "Crie uma conta Avespet para acompanhar e editar o anúncio."],
              ["3", "Aguarde a revisão", "A equipe analisa o cadastro antes de publicar."],
              ["4", "Compartilhe e amplie", "Use a divulgação gratuita e avalie os planos opcionais."],
            ].map(([n, titulo, texto]) => (
              <div key={n} className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: `1px solid ${TEMA_PUBLICO.borda}` }}>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-extrabold" style={{ background: TEMA_PUBLICO.verdeClaro, color: TEMA_PUBLICO.verde }}>{n}</span>
                <h3 className="mt-4 font-bold" style={{ color: TEMA_PUBLICO.tinta }}>{titulo}</h3>
                <p className="mt-2 text-sm leading-6" style={{ color: TEMA_PUBLICO.texto }}>{texto}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="planos" className="mt-20 scroll-mt-8">
          <SecaoTitulo etiqueta="Opções de divulgação" titulo="Comece gratuitamente. Amplie se fizer sentido." texto="Os planos pagos são opcionais. Os valores e condições abaixo vêm do catálogo publicado no Avespet e podem ser atualizados pela equipe." centralizado />
          <div className="mx-auto mb-6 max-w-3xl rounded-2xl p-5 md:flex md:items-center md:justify-between" style={{ background: TEMA_PUBLICO.verdeClaro, border: `1px solid ${TEMA_PUBLICO.borda}` }}>
            <div><span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: TEMA_PUBLICO.verde }}>Plano de entrada</span><h3 className="mt-1 text-xl font-bold" style={{ color: TEMA_PUBLICO.tinta }}>Cadastro gratuito</h3><p className="mt-1 text-sm" style={{ color: TEMA_PUBLICO.texto }}>Publique após aprovação, acompanhe e edite seu anúncio.</p></div>
            <div className="mt-4 flex items-center gap-4 md:mt-0"><strong className="text-2xl" style={{ color: TEMA_PUBLICO.verde }}>R$ 0,00</strong><button type="button" onClick={() => { setMostrarCadastro(true); document.getElementById("cadastro-ave")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="rounded-xl px-4 py-3 text-sm font-bold" style={{ background: TEMA_PUBLICO.verde, color: "#FFFFFF" }}>Começar grátis</button></div>
          </div>
          {loadingPlanos ? <div className="rounded-2xl bg-white p-8 text-center text-sm" style={{ color: TEMA_PUBLICO.texto }}>Carregando opções de divulgação...</div> :
            erroPlanos ? <p role="status" className="rounded-xl bg-white p-5 text-sm" style={{ color: TEMA_PUBLICO.texto }}>{erroPlanos}</p> :
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{planos.map((plano, i) => <PlanoCard key={plano.code} plano={plano} destaque={i === 2} />)}</div>}
          <p className="mx-auto mt-5 max-w-4xl text-center text-xs leading-6" style={{ color: TEMA_PUBLICO.texto }}>
            Alcance é estimado, não garantido. A entrega depende de fatores como região, público, plataforma e disponibilidade de mídia. O Avespet não promete visualizações específicas nem garante o reencontro da ave.
          </p>
        </section>

        <section id="cadastro-ave" className="mt-20 scroll-mt-8">
          <SecaoTitulo etiqueta="Primeiro passo" titulo="Registre sua ave sem custo" texto="Preencha as informações com calma. A conta gratuita permite acompanhar o anúncio e manter os dados atualizados." />
          {mostrarCadastro ? (
            <div className="rounded-3xl p-5 md:p-8" style={{ background: TEMA_PUBLICO.verdeEscuro }}>
              <button type="button" onClick={() => setMostrarCadastro(false)} className="mb-5 rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: "#D2E1D6", color: TEMA_PUBLICO.verde }}>Fechar cadastro</button>
              <PerdiUmaAve onEntrar={onEntrar} />
            </div>
          ) : (
            <div className="rounded-3xl p-6 md:flex md:items-center md:justify-between md:p-8" style={{ background: "#FFFFFF", border: `1px solid ${TEMA_PUBLICO.borda}` }}>
              <div><h3 className="text-xl font-bold" style={{ color: TEMA_PUBLICO.tinta }}>Sua ave desapareceu?</h3><p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: TEMA_PUBLICO.texto }}>Comece pelo cadastro gratuito. Você poderá acompanhar o status e editar as informações pela sua conta.</p></div>
              <button type="button" onClick={() => setMostrarCadastro(true)} className="mt-5 shrink-0 rounded-xl px-5 py-4 text-sm font-bold md:mt-0" style={{ background: TEMA_PUBLICO.verde, color: "#FFFFFF" }}>Cadastrar ave gratuitamente</button>
            </div>
          )}
          <div className="mt-4 rounded-2xl p-4 text-xs leading-6" style={{ background: "#FFFFFF", border: `1px solid ${TEMA_PUBLICO.borda}`, color: TEMA_PUBLICO.texto }}>
            <strong style={{ color: TEMA_PUBLICO.tinta }}>Privacidade:</strong> telefone, e-mail e anilha não são exibidos na vitrine pública. A foto enviada para o anúncio fica acessível publicamente por sua URL; envie somente uma imagem da ave, sem documentos, rostos ou informações pessoais. A localização pública é aproximada. O contato de interessados é intermediado pelo Avespet.
          </div>
        </section>

        <section className="mt-20">
          <SecaoTitulo etiqueta="Rede de apoio" titulo="Anúncios publicados pela comunidade" texto="Consulte as aves divulgadas e ajude compartilhando as informações. Se encontrou uma ave, avise nossa equipe." />
          <div className="mb-6 flex flex-wrap gap-3">
            <Link para="/achei-uma-ave" className="rounded-xl px-4 py-3 text-sm font-bold" style={{ background: TEMA_PUBLICO.verde, color: "#FFFFFF" }}>Encontrei uma ave</Link>
            <button type="button" onClick={() => { setMostrarCadastro(true); document.getElementById("cadastro-ave")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="rounded-xl px-4 py-3 text-sm font-bold" style={{ background: TEMA_PUBLICO.verdeClaro, color: TEMA_PUBLICO.verde }}>Cadastrar ave perdida</button>
          </div>
          {loading ? (
            <div className="rounded-2xl p-8 text-center text-sm" style={{ background: "#FFFFFF", color: TEMA_PUBLICO.texto }}>Carregando anúncios...</div>
          ) : erro ? (
            <div role="alert" className="rounded-2xl p-6 text-sm" style={{ background: "#FCEFEB", color: "#9A3D2C" }}>{erro}</div>
          ) : lista.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "#FFFFFF", border: `1px solid ${TEMA_PUBLICO.borda}` }}>
              <h3 className="text-lg font-bold" style={{ color: TEMA_PUBLICO.tinta }}>Nenhum anúncio publicado no momento</h3>
              <p className="mt-2 text-sm" style={{ color: TEMA_PUBLICO.texto }}>Se sua ave desapareceu, registre a ocorrência gratuitamente. Os anúncios passam por análise antes de aparecer aqui.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {lista.map(({ id, data }) => (
                <CartaoPublico key={id}>
                  <div className="px-5 pt-4">
                    {data.situacao === "reencontrado" ?
                      <span className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-extrabold text-emerald-800">🦜💚 Reencontrada! Final feliz!</span> :
                      <span className="inline-flex rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900">🔎 Ainda desaparecida</span>}
                  </div>
                  {data.foto ? <img src={data.foto} alt={data.nomeAve || data.especie || "Ave perdida"} loading="lazy" className="aspect-[16/10] w-full object-cover" /> :
                    <div className="flex aspect-[16/10] items-center justify-center" style={{ background: TEMA_PUBLICO.verdeClaro, color: TEMA_PUBLICO.verde }}>Ave cadastrada</div>}
                  <div className="p-5">
                    <h3 className="text-lg font-bold" style={{ color: TEMA_PUBLICO.tinta }}>{data.nomeAve || data.especie || "Ave perdida"}</h3>
                    <p className="mt-1 text-sm" style={{ color: TEMA_PUBLICO.texto }}>{[data.especie, data.cor, data.sexo && data.sexo !== "Não sei" ? data.sexo : "", data.idadeAproximada].filter(Boolean).join(" · ")}</p>
                    <p className="mt-2 text-sm font-semibold" style={{ color: TEMA_PUBLICO.verde }}>{[data.bairro, data.cidade && data.uf ? `${data.cidade}/${data.uf}` : data.cidade || data.uf].filter(Boolean).join(" · ")}</p>
                    {dataBrasil(data.dataPerda) && <p className="mt-1 text-xs" style={{ color: TEMA_PUBLICO.texto }}>Desapareceu em {dataBrasil(data.dataPerda)}</p>}
                    {data.situacao === "reencontrado" && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">Boa notícia: esta ave voltou para sua família! 💚 {data.dataReencontro && `Reencontro em ${dataBrasil(data.dataReencontro)}.`}</p>}
                    {data.situacao !== "reencontrado" && data.caracteristicas && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6" style={{ color: TEMA_PUBLICO.texto }}>{data.caracteristicas}</p>}
                    {data.situacao !== "reencontrado" && data.descricao && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6" style={{ color: TEMA_PUBLICO.texto }}>{data.descricao}</p>}
                    {data.situacao === "reencontrado" && data.depoimento && <blockquote className="mt-3 rounded-xl border border-emerald-100 bg-white p-3 text-sm italic leading-6 text-emerald-900">“{data.depoimento}”{Number(data.avaliacao) > 0 && <span className="mt-2 block font-bold not-italic">{"⭐".repeat(Math.min(5, Number(data.avaliacao)))}</span>}</blockquote>}
                    {data.situacao !== "reencontrado" && <p className="mt-4 rounded-xl p-3 text-xs leading-5" style={{ background: TEMA_PUBLICO.fundo, color: TEMA_PUBLICO.texto }}>Encontrou esta ave? Avise o Avespet. Nossa equipe fará a intermediação com o responsável.</p>}
                  </div>
                </CartaoPublico>
              ))}
            </div>
          )}
        </section>

        <section className="mt-20 rounded-3xl p-6 md:p-10" style={{ background: TEMA_PUBLICO.verdeClaro }}>
          <SecaoTitulo etiqueta="Dúvidas frequentes" titulo="O que você precisa saber" />
          <div className="grid gap-5 md:grid-cols-2">
            {[
              ["O cadastro é realmente gratuito?", "Sim. Você pode registrar a ave e acompanhar o anúncio sem contratar um plano pago. A publicação depende da análise da equipe."],
              ["Preciso contratar um plano para publicar?", "Não. Os planos de divulgação ampliada são opcionais e podem ser avaliados separadamente."],
              ["Meu telefone ficará visível?", "Não. O telefone e o e-mail do responsável não aparecem na vitrine pública. O Avespet intermedeia o contato."],
              ["O plano garante que minha ave será encontrada?", "Não. Os planos ampliam a divulgação, mas não garantem visualizações, contatos ou o reencontro da ave."],
              ["Quando o anúncio aparece?", "Depois do envio e da revisão da equipe Avespet. Se você editar informações, o anúncio poderá voltar para análise."],
              ["Como aviso que encontrei uma ave?", "Use a página Encontrei uma ave ou consulte a anilha. Nossa equipe fará a intermediação com o responsável."],
            ].map(([pergunta, resposta]) => (
              <div key={pergunta} className="rounded-2xl bg-white p-5">
                <h3 className="font-bold" style={{ color: TEMA_PUBLICO.tinta }}>{pergunta}</h3>
                <p className="mt-2 text-sm leading-6" style={{ color: TEMA_PUBLICO.texto }}>{resposta}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-3xl p-7 text-center md:p-10" style={{ background: TEMA_PUBLICO.verdeEscuro }}>
          <h2 className="text-2xl font-bold text-white md:text-3xl" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>Comece pelo que importa: registre sua ave.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6" style={{ color: "#D4E2D8" }}>O primeiro passo é gratuito. Você decide depois se deseja ampliar a divulgação.</p>
          <button type="button" onClick={() => { setMostrarCadastro(true); document.getElementById("cadastro-ave")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="mt-6 rounded-xl px-6 py-4 text-sm font-extrabold" style={{ background: "#FFFFFF", color: TEMA_PUBLICO.verde }}>Cadastrar ave gratuitamente</button>
        </section>
      </PaginaPublica>
    </div>
  );
}
