import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { emailAddress, normalizeSubject, findVerifiedReplies } from "../supabase/functions/master-support-operations/replyMatching.mjs";
const source=readFileSync(new URL("../supabase/functions/master-support-operations/index.ts",import.meta.url),"utf8");
const sql=readFileSync(new URL("../supabase/migrations/20261117_master_support_incoming_replies.sql",import.meta.url),"utf8");
const owner="keila@example.com";
const support="suporte@avespet.com.br";
const subject="Avespet | Complete as informações da ave Bluu";
const sent={id:"9c203554-842a-44eb-bde4-d63e6f3a5001",direction:"outbound",from:"Avespet <"+support+">",to:[owner],subject,received_at:"2026-11-17T19:50:00Z"};
const reply={id:"ba39b811-835d-47bf-bcda-16064b462ef7",direction:"inbound",from:"Keila <"+owner+">",to:[support],subject:"Re: "+subject,received_at:"2026-11-18T10:00:00Z"};
const base={messages:[sent,reply],ownerEmail:owner,supportEmail:support,expectedSubject:subject,linkedSentIds:[sent.id]};
test("normaliza endereços e assuntos",()=>{
  assert.equal(emailAddress("Keila <Keila@Example.com>"),owner);
  assert.equal(normalizeSubject("Re: RES: "+subject),normalizeSubject(subject));
});
test("relaciona resposta ao envio confirmado da mesma conversa",()=>{
  assert.deepEqual(findVerifiedReplies(base),[{providerEmailId:reply.id,receivedAt:reply.received_at}]);
});
test("não relaciona remetente diferente, resposta anterior ou conversa sem envio",()=>{
  assert.deepEqual(findVerifiedReplies({...base,messages:[sent,{...reply,from:"outra@empresa.com"}]}),[]);
  assert.deepEqual(findVerifiedReplies({...base,messages:[sent,{...reply,received_at:"2026-11-17T19:40:00Z"}]}),[]);
  assert.deepEqual(findVerifiedReplies({...base,messages:[reply]}),[]);
});
test("mensagem antiga só relaciona com assunto exato, preparação anterior e confirmação de unicidade",()=>{
  const legacy={...base,linkedSentIds:[],allowLegacy:true,preparedAt:"2026-11-17T19:47:00Z"};
  assert.equal(findVerifiedReplies(legacy).length,1);
  assert.deepEqual(findVerifiedReplies({...legacy,allowLegacy:false}),[]);
  assert.deepEqual(findVerifiedReplies({...legacy,expectedSubject:"Outro anúncio"}),[]);
  assert.deepEqual(findVerifiedReplies({...legacy,preparedAt:"2026-11-18T11:00:00Z"}),[]);
});
test("inbox do financeiro e destinatário alheio nunca correspondem",()=>{
  assert.deepEqual(findVerifiedReplies({...base,supportEmail:"financeiro@avespet.com.br"}),[]);
  assert.deepEqual(findVerifiedReplies({...base,messages:[{...sent,to:["outro@example.com"]},reply]}),[]);
});
test("sem envio automático, proteção de duplicidade e autenticação Master",()=>{
  assert.match(source,/if \(!master\) return reply/);
  assert.match(source,/syncLostBirdReplies/);
  assert.match(source,/action === "timeline"/);
  assert.match(source,/master_support_events"\)\.insert/);
  assert.match(sql,/where event_type = 'email_received'/);
  assert.match(sql,/unique index/);
});
