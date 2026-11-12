import React, { useEffect, useState } from "react";
import { listarAvesPerdidas } from "../services/avesPerdidasService";
import { Link } from "../../../publico/roteador";
import { PaginaPublica, CabecalhoPublico, CartaoPublico, TEMA_PUBLICO } from "../../../publico/ComponentesPublicos";

export default function AvesPerdidas({ onEntrar }) {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

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
            <p className="mt-2 text-sm" style={{ color: TEMA_PUBLICO.texto }}>Se sua ave desapareceu, cadastre a ocorrência na sua conta. Após análise, o anúncio poderá aparecer nesta página.</p>
            <p className="mt-4 text-xs" style={{ color: TEMA_PUBLICO.texto }}>O cadastro de ave perdida é feito por usuários conectados.</p>
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
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold" style={{ color: TEMA_PUBLICO.tinta }}>{data.nomeAve || data.especie || "Ave perdida"}</h2>
                    {data.cor && <span className="rounded-full px-2 py-1 text-[11px] font-semibold" style={{ background: TEMA_PUBLICO.verdeClaro, color: TEMA_PUBLICO.verde }}>{data.cor}</span>}
                  </div>
                  <p className="mt-1 text-sm" style={{ color: TEMA_PUBLICO.texto }}>{data.especie || "Espécie não informada"}</p>
                  <p className="mt-3 text-sm font-semibold" style={{ color: TEMA_PUBLICO.verde }}>{data.cidade}{data.uf ? "/" + data.uf : ""}</p>
                  {data.dataPerda && <p className="mt-1 text-xs" style={{ color: TEMA_PUBLICO.texto }}>Desapareceu em {new Date(data.dataPerda + "T12:00:00").toLocaleDateString("pt-BR")}</p>}
                  {data.descricao && <p className="mt-3 whitespace-pre-wrap text-sm leading-6" style={{ color: TEMA_PUBLICO.texto }}>{data.descricao}</p>}
                  <div className="mt-4 rounded-xl p-3 text-xs leading-5" style={{ background: TEMA_PUBLICO.fundo, color: TEMA_PUBLICO.texto }}>
                    Para proteger os envolvidos, o contato é intermediado pelo Avespet.
                  </div>
                </div>
              </CartaoPublico>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-2xl p-6 md:p-8" style={{ background: TEMA_PUBLICO.verdeEscuro }}>
          <h2 className="text-xl font-bold md:text-2xl" style={{ color: "#FFFFFF", fontFamily: "'Fraunces', Georgia, serif" }}>Sua ave desapareceu?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: "#D2E1D6" }}>Entre na sua conta para registrar a ocorrência. O anúncio passa por análise antes de ser publicado.</p>
          <button type="button" onClick={onEntrar} className="mt-5 inline-flex rounded-xl px-5 py-3 text-sm font-bold" style={{ background: "#FFFFFF", color: TEMA_PUBLICO.verde }}>Entrar para cadastrar ave perdida</button>
        </div>
      </PaginaPublica>
    </div>
  );
}
