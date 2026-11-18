import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const ui=read("src/features/master/EmailAutomations.jsx");
const master=read("src/features/master/MasterApp.jsx");
const backend=read("supabase/functions/master-email-automations/index.ts");
const sender=read("supabase/functions/reengage-creators/index.ts");
const migration=read("supabase/migrations/20261117_email_automations_guide_tracking.sql");
test("Somente sessão Master consulta e altera regras",()=>{
 assert.match(backend,/auth\.auth\.getUser\(token\)/);
 assert.match(backend,/from\("master_admins"\)/);
 assert.match(backend,/if\(!master\)return respond/);
 assert.match(backend,/master_email_automation_settings_requested/);
 assert.doesNotMatch(backend,/RESEND_API_KEY/);
});
test("Painel separa aceito pelo provedor de entrega real",()=>{
 assert.match(ui,/Aceito pelo Resend não significa entregue ou lido/);
 assert.match(ui,/Conferir|Atualizar dados/);
 assert.match(master,/email-automations/);
});
test("Novidades são enviadas só com guias publicados e registradas pelo slug",()=>{
 assert.match(sender,/\.eq\("publicado",true\)/);
 assert.match(sender,/pickGuide/);
 assert.match(sender,/article_slug:guide\?\.slug/);
 assert.match(sender,/consented_at/);
 assert.match(migration,/article_slug/);
});
