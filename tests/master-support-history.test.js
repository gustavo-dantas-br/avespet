import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
const get = p => readFileSync(new URL("../"+p,import.meta.url),"utf8");
const sql=get("supabase/migrations/20261117_master_support_events_lost_birds.sql");
const support=get("supabase/functions/master-support-operations/index.ts");
const mail=get("supabase/functions/master-resend-inboxes/index.ts");
const ui=get("src/features/master/SupportOperations.jsx");
test("histórico privado, com trigger de alterações",()=>{
 assert.match(sql,/master_support_events/);
 assert.match(sql,/enable row level security/);
 assert.match(sql,/trg_lost_bird_support_event/);
 assert.doesNotMatch(sql,/NEW\.data\s*[,)]/);
});
test("Master lê linha do tempo mas não inventa envio",()=>{
 assert.match(support,/action === "timeline"/);
 assert.match(support,/master_support_email_draft_prepared/);
 assert.match(ui,/Histórico do atendimento/);
 assert.match(ui,/Somente envios confirmados/);
});
test("envio vinculado exige titular confirmado e confirmação do provedor",()=>{
 assert.match(mail,/body\.source_id/);
 assert.match(mail,/admin\.auth\.admin\.getUserById/);
 assert.match(mail,/account\.user\.email\?\.trim\(\)\.toLowerCase\(\) !== recipient/);
 assert.ok(mail.indexOf('const sent = await resend') < mail.indexOf('event_type:"email_sent"'));
});
