import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { buildCreatorActions } from "../src/features/dashboard/utils/proximasAcoes.js";

const STATUS_PLANTEL = ["No plantel", "A venda", "Reservada"];

test("próximas ações contam somente aves do plantel sem sexagem", () => {
  const aves = [
    {status: "No plantel", sexado: false},
    {status: "A venda", sexado: false},
    {status: "Reservada", sexado: false},
    {status: "No plantel", sexado: true},
    {status: "Vendida", sexado: false},
    {status: "Falecida", sexado: false},
    {status: "Perdida", sexado: false},
  ];
  const actions = buildCreatorActions({aves, STATUS_PLANTEL});
  const sexing = actions.find(a => a.id === "sexing");
  assert.ok(sexing);
  assert.match(sexing.title, /^3 ave\\(s\\) sem sexagem/);
  assert.equal(sexing.filter, "sem-sexagem");
});

test("sem alerta de sexagem quando todas as aves do plantel têm laudo", () => {
  const actions = buildCreatorActions({
    aves: [{status: "No plantel", sexado: true}, {status: "Vendida", sexado: false}],
    STATUS_PLANTEL,
  });
  assert.equal(actions.some(a => a.id === "sexing"), false);
});

test("clique em próximas ações usa filtro de sexagem", () => {
  const s = readFileSync(new URL("../src/features/dashboard/components/DashboardTab.jsx", import.meta.url), "utf8");
  assert.ok(s.includes("a.filter ? goToLista(a.filter) : setTab(a.tab)"));
  assert.ok(s.includes("STATUS_PLANTEL"));
});
