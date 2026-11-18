import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";
const read=(p)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const sql=read("supabase/migrations/20261117_email_reengagement_5days.sql");
const scheduler=read("supabase/functions/reengage-creators/index.ts");
const unsubscribe=read("supabase/functions/reengagement-unsubscribe/index.ts");
const profile=read("src/features/perfil/PerfilTab.jsx");
const app=read("src/App.jsx");
test("Sem opt-in prévio; preferência exige clique no perfil",()=>{
 assert.match(sql,/opted_in boolean not null default false/);
 assert.match(sql,/consented_at/);
 assert.match(profile,/Salvar preferência de e-mails/);
 assert.match(profile,/set_email_news_opt_in/);
});
test("Critérios conservadores e auditoria de envio",()=>{
 assert.match(scheduler,/email_confirmed_at/);
 assert.match(scheduler,/min_inactive_days/);
 assert.match(scheduler,/cooldown_days/);
 assert.match(scheduler,/email_reengagement_delivery/);
 assert.match(scheduler,/Idempotency-Key/);
 assert.match(scheduler,/if\s*\(!config\.enabled\)/);
 assert.match(scheduler,/latest.data\?\.opted_in/);
});
test("Descadastro de um clique não acontece via GET",()=>{
 assert.match(unsubscribe,/if\(req.method==="GET"\)return page/);
 assert.match(unsubscribe,/method="POST"/);
 assert.match(unsubscribe,/unsubscribe_token/);
 assert.match(scheduler,/List-Unsubscribe-Post/);
});
test("Visita é registrada somente com sessão e opt-out não afeta senha",()=>{
 assert.match(app,/supabase.rpc\("mark_app_visit"\)/);
 assert.doesNotMatch(sql,/update auth.users/);
 assert.match(sql,/enable row level security/g);
});
