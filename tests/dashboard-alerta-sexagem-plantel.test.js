import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const dashboard = readFileSync(new URL("../src/features/dashboard/components/DashboardTab.jsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("alerta sem sexagem considera somente aves sob responsabilidade do criador", () => {
  assert.ok(dashboard.includes("STATUS_PLANTEL.includes(a.status) && !a.sexado"));
  assert.ok(dashboard.includes('goToLista("sem-sexagem")'));
  assert.ok(!dashboard.includes("const semSexagem = aves.filter((a) => !a.sexado).length"));
});
test("clique abre lista filtrada e limpa busca anterior", () => {
  assert.ok(app.includes('if (filter === "sem-sexagem") setSearch("");'));
  assert.ok(app.includes('if (statusFilter === "sem-sexagem") return STATUS_PLANTEL.includes(a.status) && !a.sexado;'));
  assert.ok(app.includes('"sem-sexagem": "Aves do plantel sem sexagem"'));
});
