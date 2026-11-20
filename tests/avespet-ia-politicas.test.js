import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("../docs/sql/avespet-ia-diario-proposta.sql", import.meta.url), "utf8");
const normalized = sql.replace(/--[^\n]*/g, "").replace(/\s+/g, " ").toLowerCase();
const policy = (name) => {
  const start = normalized.indexOf('create policy "' + name + '"');
  assert.notEqual(start, -1, "Política ausente: " + name);
  const next = normalized.indexOf("create policy ", start + 1);
  return normalized.slice(start, next < 0 ? undefined : next);
};
const own = /user_id\s*=\s*\(select auth\.uid\(\)\)/;
const bird = /exists\s*\(\s*select 1 from public\.aves a where a\.id\s*=\s*ave_id and a\.user_id\s*=\s*\(select auth\.uid\(\)\)/;

test("RLS explicitamente ativado na tabela nova", () => {
  assert.match(normalized, /alter table public\.avespet_ia_diario enable row level security/);
});
test("chaves de usuário e ave têm vínculos com tabelas existentes", () => {
  assert.match(normalized, /user_id uuid not null references auth\.users\(id\)/);
  assert.match(normalized, /ave_id uuid not null references public\.aves\(id\)/);
});
for (const [action, name, expected] of [
  ["SELECT", "avespet_ia_diario_select_own", "using"],
  ["INSERT", "avespet_ia_diario_insert_own", "with check"],
  ["UPDATE", "avespet_ia_diario_update_own", "using"],
  ["DELETE", "avespet_ia_diario_delete_own", "using"],
]) {
  test(`política ${action} exige dono e posse da ave`, () => {
    const p = policy(name);
    assert.ok(p.includes("to authenticated"), "Operação deve exigir autenticação");
    assert.ok(p.includes("for " + action.toLowerCase()), "Comando incorreto");
    assert.match(p, own);
    assert.match(p, bird);
    assert.ok(p.includes(expected));
    if (action === "UPDATE") {
      const check = p.substring(p.indexOf("with check"));
      assert.match(check, own, "UPDATE deve impedir transferência de user_id");
      assert.match(check, bird, "UPDATE deve impedir transferência da ave");
    }
  });
}
test("não cria política permissiva pública ou para service_role", () => {
  assert.doesNotMatch(normalized, /create policy .* to (public|anon|service_role)\b/);
});
test("não cria funções SECURITY DEFINER", () => assert.doesNotMatch(normalized, /security definer/));
test("diário exige pelo menos peso ou observação", () => {
  assert.match(normalized, /constraint diario_tem_conteudo check/);
});
