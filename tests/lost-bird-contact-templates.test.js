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


test("campanha Meta é opcional nos dois modelos, sem promessa de reencontro",()=>{
  for (const mode of ["acompanhamento","possivel_reencontro"]) {
    const result=lostBirdMessage(bluu,mode).text;
    assert.match(result,/campanha paga de impulsionamento regional/);
    assert.match(result,/Facebook e Instagram/);
    assert.match(result,/Não há garantia de recuperação/);
    assert.match(result,/apresenta um orçamento/);
    assert.match(result,/Se Bluu ainda estiver desaparecida/);
  }
});
test("link da campanha preserva o ID exato do anúncio sem expor telefone",()=>{
  const id="7f295ad0-c0b6-48ba-b433-515bb753847d";
  const message=lostBirdMessage({...bluu,id}).text;
  assert.match(message,new RegExp("campanha-ave-perdida\\?anuncio="+id));
  assert.doesNotMatch(message,/984972095/);
  assert.match(lostBirdMessage(bluu).text,/https:\/\/www.avespet.com.br\/campanha-ave-perdida/);
});

test("exemplo explica descoberta possível sem prometer rastreamento de pesquisa",()=>{
  for (const mode of ["acompanhamento","possivel_reencontro"]) {
    const text = lostBirdMessage(bluu,mode).text;
    assert.match(text,/alguém encontra uma ave parecida com Bluu/);
    assert.match(text,/procurar informações na internet/);
    assert.match(text,/pesquisa na internet não ativa automaticamente/);
    assert.match(text,/Facebook e Instagram/);
    assert.match(text,/Não há garantia de recuperação/);
  }
});
