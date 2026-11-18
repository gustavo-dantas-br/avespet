import { test } from "node:test";
import { strict as assert } from "node:assert";
import {readFileSync} from "node:fs";
const read=(p)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const sql=read("supabase/migrations/20261118_reencontros_depoimentos.sql");
const page=read("src/features/aves-perdidas/pages/AvesPerdidas.jsx");
const service=read("src/features/aves-perdidas/services/avesPerdidasService.js");
const review=read("supabase/functions/master-reunion-reviews/index.ts");
test("Reencontro preservado na página pública",()=>{
 assert.match(sql,/status in \('aprovado','reencontrado'\)/);
 assert.match(page,/Reencontrada! Final feliz!/);
 assert.match(page,/data\.situacao !== "reencontrado"/);
});
test("Depoimento só com autorização e moderação",()=>{
 assert.match(sql,/r\.aprovado_publicacao and r\.autoriza_publicacao/);
 assert.match(sql,/user_id=v_uid for update/);
 assert.match(review,/from\("master_admins"\)/);
 assert.match(review,/record\.autoriza_publicacao/);
});
test("Confirmação exige sessão e não revela contatos",()=>{
 assert.match(service,/confirmar_reencontro_ave_perdida/);
 assert.match(sql,/revoke all on function public\.confirmar_reencontro_ave_perdida/);
 assert.doesNotMatch(sql,/a\.data->'whatsapp'/);
 assert.doesNotMatch(sql,/a\.data->'anilha'/);
});
