import React from "react";

function TreeCard({ ave }) {
  if (!ave) return null;
  return (
    <div className="rounded-lg px-4 py-2.5 ui-sans text-center" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4", minWidth: 140 }}>
      <div className="font-semibold text-sm" style={{ color: "#2B241C" }}>{ave.nome}</div>
      <div className="text-[11px]" style={{ color: "#8a7a63" }}>{ave.especie} - {ave.sexo}</div>
    </div>
  );
}

export default function ArvoreTab({ aves, arvoreId, setArvoreId, arvoreAve, pai, mae, parceiro, filhos, SectionTitle, Field, inputStyle, Card }) {
  return (
    <div>
      <SectionTitle>Árvore Genealógica</SectionTitle>
      <Field label="Escolha a ave">
        <select style={{ ...inputStyle, maxWidth: 320 }} value={arvoreId} onChange={(e) => setArvoreId(e.target.value)}>
          <option value="">-- selecione --</option>
          {aves.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
      </Field>
      {arvoreAve && (
        <Card className="p-8 mt-6">
          <div className="flex flex-col items-center gap-6 ui-sans">
            <div className="ui-mono text-xs" style={{ color: "#8a7a63" }}>PAIS</div>
            <div className="flex gap-4 flex-wrap justify-center">
              <TreeCard ave={pai} />
              {!pai && arvoreAve.paiExterno && <TreeCard ave={{ nome: arvoreAve.paiExterno, especie: "externo", sexo: "Macho" }} />}
              <TreeCard ave={mae} />
              {!mae && arvoreAve.maeExterno && <TreeCard ave={{ nome: arvoreAve.maeExterno, especie: "externo", sexo: "Fêmea" }} />}
            </div>
            <div className="h-6 w-px" style={{ background: "#e3d3b4" }} />
            <div className="flex gap-4 items-center">
              <div className="rounded-lg px-5 py-3 text-center" style={{ background: "#C69A2E", color: "#2B1D14" }}>
                <div className="font-bold">{arvoreAve.nome}</div>
                <div className="text-[11px]">{arvoreAve.especie} - {arvoreAve.sexo}</div>
              </div>
              {parceiro && <><span className="text-xs" style={{ color: "#8a7a63" }}>x</span><TreeCard ave={parceiro} /></>}
            </div>
            {filhos.length > 0 && (
              <>
                <div className="h-6 w-px" style={{ background: "#e3d3b4" }} />
                <div className="ui-mono text-xs" style={{ color: "#8a7a63" }}>FILHOS ({filhos.length})</div>
                <div className="flex flex-wrap gap-3 justify-center">{filhos.map((f) => <TreeCard key={f.id} ave={f} />)}</div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
