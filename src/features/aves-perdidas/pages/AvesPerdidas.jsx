import React, { useEffect, useState } from "react";
import { listarAvesPerdidas } from "../services/avesPerdidasService";
import PerdiUmaAve from "./PerdiUmaAve";
import { Link } from "../../../publico/roteador";
import { PaginaPublica, CabecalhoPublico, CartaoPublico, TEMA_PUBLICO } from "../../../publico/ComponentesPublicos";

export default function AvesPerdidas() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [mostrarCadastro, setMostrarCadastro] = useState(false);

  useEffect(() => {
    let ativa = true;
    listarAvesPerdidas()
      .then((dados) => ativa && setLista(dados))
      .catch(() => ativa && setErro("Não foi possível carregar os anúncios agora. Tente novamente em instantes."))
      .finally(() => ativa && setLoading(false));
    return () => { ativa = false; };
  }, []);

  return (
    <div style={{ background: TEMA_PUBLICO.fundo, minHeight: "65vh" }}>
      <PaginaPublica>
        <CabecalhoPublico
          etiqueta="Ajude a encontrar"
          titulo="Aves perdidas"
          descricao="Cada compartilhamento pode ajudar uma família a reencontrar sua ave. Veja os anúncios publicados e, se encontrou uma ave, consulte a anilha para avisar nossa equipe."
          acao="Consultar anilha"
          destino="/achei-uma-ave"
        />

        {loading ? (
          <div className="rounded-2xl p-8 text-center text-sm" style={{ background: "#FFFFFF", color: TEMA_PUBLICO.texto }}>Carregando anúncios...</div>
        ) : erro ? (
          <div role="alert" className="rounded-2xl p-6 text-sm" style={{ background: "#FCEFEB", color: "#9A3D2C" }}>{erro}</div>
        ) : lista.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: "#FFFFFF", border: `1px solid ${TEMA_PUBLICO.borda}` }}>
            <h2 className="text-lg font-bold" style={{ color: TEMA_PUBLICO.tinta }}>Nenhum anúncio publicado no momento</h2>
            <p className="mt-2 text-sm" style={{ color: TEMA_PUBLICO.texto }}>Se sua ave desapareceu, você pode registrar a ocorrência gratuitamente, sem precisar criar uma conta. Após análise, o anúncio poderá aparecer nesta página.</p>
            <p className="mt-4 text-xs" style={{ color: TEMA_PUBLICO.texto }}>Você não precisa entrar ou criar uma conta para enviar o cadastro.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map(({ id, data }) => (
              <CartaoPublico key={id}>
                {data.foto ? (
                  <img src={data.foto} alt={data.nomeAve || data.especie || "Ave perdida"} loading="lazy" className="aspect-[16/10] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[16/10] items-center justify-center" style={{ background: TEMA_PUBLICO.verdeClaro, color: TEMA_PUBLICO.verde }}>Ave cadastrada</div>
                )}
                <div className="p-5">
                  <p className="text-sm font-semibold" style={{ color: TEMA_PUBLICO.verde }}>
                    {[data.bairro || data.regiao, data.cidade, data.uf].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-4 rounded-xl p-3 text-xs leading-5" style={{ background: TEMA_PUBLICO.fundo, color: TEMA_PUBLICO.texto }}>
                    Encontrou esta ave? Avise o Avespet. Nossa equipe fará a intermediação com o responsável.
                  </p>
                </div>
              </CartaoPublico>
            ))}
          </div>
        )}

        {mostrarCadastro ? (
          <div className="mt-10 rounded-2xl p-6 md:p-8" style={{ background: TEMA_PUBLICO.verdeEscuro }}>
            <button type="button" onClick={() => setMostrarCadastro(false)} className="mb-5 rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: "#D2E1D6", color: TEMA_PUBLICO.verde }}>Voltar para os anúncios</button>
            <PerdiUmaAve />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setMostrarCadastro(true)}
            className="mt-10 block w-full rounded-2xl p-6 text-left transition hover:brightness-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300 md:p-8"
            style={{ background: TEMA_PUBLICO.verdeEscuro }}
          >
            <span className="block text-xl font-bold md:text-2xl" style={{ color: "#FFFFFF", fontFamily: "'Fraunces', Georgia, serif" }}>Sua ave desapareceu?</span>
            <span className="mt-2 block max-w-2xl text-sm leading-6" style={{ color: "#D2E1D6" }}>Preencha o cadastro diretamente por aqui, sem precisar entrar ou criar uma conta. O anúncio passa por análise antes de ser publicado.</span>
            <span className="mt-5 inline-flex rounded-xl px-5 py-3 text-sm font-bold" style={{ background: "#FFFFFF", color: TEMA_PUBLICO.verde }}>Cadastrar ave perdida</span>
          </button>
        )}
      </PaginaPublica>
    </div>
  );
}
