import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const dashboard = read("supabase/functions/master-dashboard-summary/index.ts");
const migration = read("supabase/migrations/20261118_master_dashboard_single_query.sql");
const app = read("src/features/master/MasterApp.jsx");

test("dashboard agregado reduz requisições e preserva auditoria/autorização", () => {
  assert.match(dashboard, /master_admins/);
  assert.match(dashboard, /authClient\.auth\.getUser\(token\)/);
  assert.match(dashboard, /adminClient\.rpc\("master_dashboard_stats"/);
  assert.match(dashboard, /Promise\.allSettled/);
  assert.match(dashboard, /dashboard_summary_viewed/);
  assert.match(dashboard, /auth\.admin\.listUsers/);
  assert.doesNotMatch(dashboard, /adminClient\.from\("anuncios"\)\.select\("\*"/);
});

test("RPC invocadora somente serviço, sem dados pessoais na resposta", () => {
  assert.match(migration, /security invoker/);
  assert.match(migration, /revoke all on function public\.master_dashboard_stats\(date\) from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.master_dashboard_stats\(date\) to service_role/);
  assert.doesNotMatch(migration, /auth\.users/);
  assert.match(migration, /visitas_diarias/);
});

test("seções carregadas sob demanda e conservadas ao navegar", () => {
  assert.match(app, /React\.lazy\(\(\) => import\("\.\/CreatorManagement"\)\)/);
  assert.match(app, /React\.lazy\(\(\) => import\("\.\/MasterInboxPanel"\)\)/);
  assert.match(app, /visitedSections\.filter/);
  assert.match(app, /hidden=\{activeSection !== id\}/);
  assert.match(app, /id === "communications" \? <MasterInboxPanel/);
  assert.match(app, /onPrepareEmail=\{openSupportDraft\}/);
});
