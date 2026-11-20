import test from "node:test";
import assert from "node:assert/strict";
import { agruparFilhotesPorNascimento } from "../src/features/plantel/utils/agruparFilhotes.js";

const criar = (id,nascimento,paiId="leo",maeId="luna") => ({id,nome:id,nascimento,paiId,maeId});
test("separa junho de outubro/novembro, mesmo atravessando o mês", () => {
  const aves=[criar("042","31/10/2026"),criar("044","01/11/2026"),criar("045","03/11/2026"),criar("018","10/06/2026"),criar("019","14/06/2026"),criar("046","04/11/2026"),criar("043","01/11/2026")];
  const original = JSON.stringify(aves);
  const grupos=agruparFilhotesPorNascimento(aves);
  assert.equal(grupos.length,2);
  assert.equal(grupos[0].aves.length,5);
  assert.equal(grupos[0].periodo,"31/10/2026 a 04/11/2026");
  assert.equal(grupos[1].aves.length,2);
  assert.equal(grupos[1].periodo,"10/06/2026 a 14/06/2026");
  assert.equal(JSON.stringify(aves),original);
});
test("não mistura pais diferentes ou datas incompletas",()=>{
  const grupos=agruparFilhotesPorNascimento([criar("a","03/11/2026"),criar("b","04/11/2026","outro"),criar("c","2026"),criar("d","Ago/2026")]);
  assert.equal(grupos.length,3);
  assert.equal(grupos.at(-1).aves.length,2);
  assert.equal(grupos.at(-1).titulo,"Nascimento sem data completa");
});
test("não encadeia datas distantes em uma única ninhada",()=>{
  const grupos=agruparFilhotesPorNascimento([criar("a","01/11/2026"),criar("b","12/11/2026"),criar("c","23/11/2026")]);
  assert.equal(grupos.length,2);
});
