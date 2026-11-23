import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
const s=readFileSync(new URL("../src/features/aves-perdidas/components/ReencontrosVitrine.jsx",import.meta.url),"utf8");
test("cada página possui uma largura de foto proporcional própria",()=>{
  for(const name of ["home","lost","campaign"]) assert.match(s,new RegExp(name+": \\{ columns:"));
  assert.match(s,/max-w-\[420px\]/);
  assert.match(s,/max-w-\[310px\]/);
  assert.match(s,/max-w-\[340px\]/);
});
test("poster vertical não sofre recorte ou altura forçada",()=>{
  assert.match(s,/block h-auto w-full object-contain/);
  assert.doesNotMatch(s,/object-cover/);
  assert.doesNotMatch(s,/imageHeight/);
});
