import { test } from "node:test";
import assert from "node:assert/strict";
import { lostBirdMessage, whatsappDigits } from "../src/features/master/lostBirdContactTemplates.js";
import { readFileSync } from "node:fs";

const bluu = { data: { nomeAve: "Bluu", especie: "Ring Neck", cor: "Azul", contatoNome: "Keila", whatsapp: "11 984972095", cidade: "Jandira", uf: "SP", dataPerda: "2026-11-07" } };
const mel = { data: { nomeAve: "Mel", especie: "Calopsita", cor: "Cinza", contatoNome: "Ana Paula", whatsapp: "21912345678", cidade: "Rio de Janeiro", uf: "RJ", dataPerda: "2026-11-01" } };

test("personaliza nomes e datas sem misturar responsáveis",()=>{
  const a = lostBirdMessage(bluu,"possivel_reencontro");
  const b = lostBirdMessage(mel);
  assert.match(a.text,/Olá, Keila!/);
  assert.match(a.text,/Bluu/);
  assert.match(a.text,/Jandira\/SP/);
  assert.match(a.text,/07\/11\/2026/);
  assert.doesNotMatch(a.text,/Ana Paula|Mel/);
  assert.match(b.text,/Olá, Ana!/);
  assert.match(b.text,/Mel/);
  assert.doesNotMatch(b.text,/Bluu|Keila/);
});
test("contato de acompanhamento não presume recuperação e permite confirmar",()=>{
  const a = lostBirdMessage(bluu,"possivel_reencontro");
  assert.match(a.text,/Ainda não temos a confirmação da família/);
  assert.match(a.text,/Você pode nos confirmar/);
  assert.doesNotMatch(a.text,/nosso sistema de inteligência/);
});
test("número brasileiro funciona com ou sem DDI; inválido bloqueado",()=>{
  assert.equal(whatsappDigits("11 984972095"),"5511984972095");
  assert.equal(whatsappDigits("55 11 984972095"),"5511984972095");
  assert.equal(whatsappDigits("12345"),"");
});
test("interface prepara e-mail sem enviar, restrita ao anúncio",()=>{
  const ui = readFileSync(new URL("../src/features/master/LostBirdsModeration.jsx",import.meta.url),"utf8");
  const master = readFileSync(new URL("../src/features/master/MasterApp.jsx",import.meta.url),"utf8");
  const edge = readFileSync(new URL("../supabase/functions/master-lost-birds/index.ts",import.meta.url),"utf8");
  assert.match(ui,/onPrepareEmail\(/);
  assert.match(ui,/Abrir WhatsApp/);
  assert.match(ui,/Copiar mensagem/);
  assert.match(ui,/action: "contact", anuncio_id: ad.id/);
  assert.match(master,/LostBirdsModeration onPrepareEmail=\{openSupportDraft\}/);
  assert.match(edge,/auth\.admin\.getUserById\(ad.user_id\)/);
  assert.match(edge,/email_confirmed_at/);
  assert.doesNotMatch(ui,/api\.resend\.com\/emails/);
});
