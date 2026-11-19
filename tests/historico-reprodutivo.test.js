import test from "node:test";
import assert from "node:assert/strict";
import {listarHistoricoReprodutivo, previsaoOvoSomenteLeitura, formatarDataReproducao} from "../src/features/plantel/utils/historicoReprodutivo.js";
test("associa postura aos pais e encontra filhote vinculado",()=>{
 const aves=[{id:"p",nome:"Pai"},{id:"m",nome:"Mãe"},{id:"f",nome:"Filhote"}];
 const posturas=[{id:"post1",paiId:"p",maeId:"m",diasIncubacao:24,ovos:[{n:1,status:"Nasceu",aveId:"f",dataPostura:"2026-10-01"},{n:2,status:"Fertil",dataPostura:"2026-11-01"}]}];
 const original=JSON.stringify(posturas);
 const resultado=listarHistoricoReprodutivo(aves[0],posturas,aves);
 assert.equal(resultado.length,1);assert.equal(resultado[0].resumo.nascidos,1);
 assert.equal(resultado[0].ovosDetalhados[0].filhote.nome,"Filhote");
 assert.equal(resultado[0].ovosDetalhados[1].previsao,"25/11/2026");
 assert.equal(JSON.stringify(posturas),original);
 assert.equal(listarHistoricoReprodutivo(aves[1],posturas,aves).length,1);
 assert.equal(listarHistoricoReprodutivo(aves[2],posturas,aves).length,0);
});
test("não inventa eclosão de ovo sem data ou com status encerrado",()=>{
 assert.equal(previsaoOvoSomenteLeitura({diasIncubacao:24},{status:"Nasceu",dataPostura:"2026-11-01"}),null);
 assert.equal(previsaoOvoSomenteLeitura({diasIncubacao:24},{status:"Fertil"}),null);
 assert.equal(formatarDataReproducao("2026-11-19"),"19/11/2026");
});
