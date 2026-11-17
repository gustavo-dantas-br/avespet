import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("../supabase/migrations/20261117_aves_perdidas_detalhes_publicos.sql", import.meta.url), "utf8");
const form = readFileSync(new URL("../src/features/aves-perdidas/pages/PerdiUmaAve.jsx", import.meta.url), "utf8");
const publicPage = readFileSync(new URL("../src/features/aves-perdidas/pages/AvesPerdidas.jsx", import.meta.url), "utf8");

test("RPC publica só os campos permitidos de identificação", () => {
  for (const campo of ["nomeAve", "especie", "cor", "caracteristicas", "bairro", "sexo", "idadeAproximada", "foto", "descricao"]) {
    assert.match(sql, new RegExp("'"+campo+"'\\s*,\\s*a\\.data\\s*->\\s*'"+campo+"'"));
  }
  for (const privado of ["whatsapp", "anilha", "contatoNome", "email", "telefone", "user_id"]) {
    assert.doesNotMatch(sql, new RegExp("a\\.data\\s*->\\s*'"+privado+"'"));
  }
});
test("edição identifica características sem publicar anilha", () => {
  assert.match(form, /Características para reconhecer a ave/);
  assert.match(form, /não será público/);
  assert.match(form, /Editar anúncio/);
  assert.match(publicPage, /data\.caracteristicas/);
  assert.doesNotMatch(publicPage, /data\.anilha|data\.whatsapp|data\.contatoNome/);
});
