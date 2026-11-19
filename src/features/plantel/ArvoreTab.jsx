import React from "react";
import { Bird, GitBranch, Mars, Venus } from "lucide-react";

const PALETA = {
  macho: { fundo: "#EFF6FF", borda: "#AACDED", cor: "#235B95", marca: "♂" },
  femea: { fundo: "#FFF2F7", borda: "#F2BCD2", cor: "#A63970", marca: "♀" },
  neutro: { fundo: "#F1F7F2", borda: "#C9DACD", cor: "#376447", marca: "•" },
};

function estiloPorSexo(sexo) {
  if (sexo === "Macho") return PALETA.macho;
  if (sexo === "Femea" || sexo === "Fêmea") return PALETA.femea;
  return PALETA.neutro;
}

function TreeCard({ ave, destaque = false }) {
  if (!ave) return null;
  const tema = estiloPorSexo(ave.sexo);
  return (
    <article
      className={`flex min-w-[160px] max-w-[240px] flex-col items-center gap-2 rounded-2xl border p-3 text-center shadow-sm transition-shadow hover:shadow-md ${destaque ? "ring-2 ring-emerald-400 ring-offset-2" : ""}`}
      style={{ background: tema.fundo, borderColor: tema.borda }}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white" style={{ color: tema.cor }} aria-hidden="true">
        {ave.sexo === "Macho" ? <Mars size={22} /> : (ave.sexo === "Femea" || ave.sexo === "Fêmea") ? <Venus size={22} /> : <Bird size={22} />}
      </span>
      <div className="min-w-0">
        <p className="break-words font-semibold text-sm" style={{ color: tema.cor }}>{ave.nome || "Ave sem nome"}</p>
        <p className="mt-1 text-xs text-slate-600">{ave.especie || "Espécie não informada"}</p>
        <p className="mt-1 text-xs font-medium" style={{ color: tema.cor }}>{tema.marca} {ave.sexo === "Femea" ? "Fêmea" : ave.sexo || "Sexo não informado"}</p>
      </div>
    </article>
  );
}

export default function ArvoreTab({ aves, arvoreId, setArvoreId, arvoreAve, pai, mae, parceiro, filhos, SectionTitle, Field, inputStyle, Card }) {
  return (
    <div className="space-y-5">
      <SectionTitle>Árvore Genealógica</SectionTitle>
      <p className="text-sm text-slate-600">Visualize pais, parceiros e filhotes. Azul identifica machos e rosa identifica fêmeas; as cores não representam mutações.</p>
      <Field label="Escolha a ave">
        <select style={{ ...inputStyle, maxWidth: 360 }} value={arvoreId} onChange={(e) => setArvoreId(e.target.value)}>
          <option value="">Selecione uma ave do plantel</option>
          {aves.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
      </Field>
      {arvoreAve ? (
        <Card className="p-4 sm:p-7">
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-800"><GitBranch size={17} aria-hidden="true" /> Pais</div>
            <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-blue-700">♂ Pai</span>
                {pai || arvoreAve.paiExterno
                  ? <TreeCard ave={pai || { nome: arvoreAve.paiExterno, especie: "Externo", sexo: "Macho" }} />
                  : <p className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-500">Pai não informado</p>}
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-pink-700">♀ Mãe</span>
                {mae || arvoreAve.maeExterno
                  ? <TreeCard ave={mae || { nome: arvoreAve.maeExterno, especie: "Externo", sexo: "Fêmea" }} />
                  : <p className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-500">Mãe não informada</p>}
              </div>
            </div>
            <div aria-hidden="true" className="h-7 w-px bg-emerald-300" />
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Ave selecionada</div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <TreeCard ave={arvoreAve} destaque />
              {parceiro && <><span aria-hidden="true" className="text-lg font-bold text-emerald-700">×</span><TreeCard ave={parceiro} /></>}
            </div>
            {filhos.length > 0 && (
              <>
                <div aria-hidden="true" className="h-7 w-px bg-emerald-300" />
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Filhotes ({filhos.length})</div>
                <div className="flex w-full flex-wrap justify-center gap-3">{filhos.map((filho) => <TreeCard key={filho.id} ave={filho} />)}</div>
              </>
            )}
          </div>
        </Card>
      ) : (
        <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-6 text-center text-sm text-emerald-800">
          Selecione uma ave para visualizar sua árvore genealógica.
        </div>
      )}
    </div>
  );
}
