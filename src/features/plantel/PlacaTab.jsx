import React from "react";
import { Download } from "lucide-react";

export default function PlacaTab({ aves, placaId, setPlacaId, canvasRef, onDownload, SectionTitle, Field, inputStyle, Card }) {
  return (
    <div>
      <SectionTitle>Gerar Placa</SectionTitle>
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <Field label="Escolha a ave">
          <select style={{ ...inputStyle, minWidth: 200, maxWidth: "100%" }} value={placaId} onChange={(e) => setPlacaId(e.target.value)}>
            <option value="">-- selecione --</option>
            {aves.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        </Field>
        {placaId && (
          <button onClick={onDownload} className="ui-sans flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
            <Download size={16} /> Baixar PNG
          </button>
        )}
      </div>
      {placaId ? (
        <div className="rounded-xl overflow-hidden w-full" style={{ border: "3px solid #4a2c18", maxWidth: 720 }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: "auto", display: "block" }} />
        </div>
      ) : (
        <Card className="p-8 ui-sans" style={{ color: "#8a7a63" }}>Selecione uma ave para ver a prévia da placa.</Card>
      )}
    </div>
  );
}
