import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = file => readFileSync(new URL("../" + file, import.meta.url), "utf8");
const creators = read("supabase/functions/master-list-creators/index.ts");
const inboxes = read("supabase/functions/master-resend-inboxes/index.ts");
const app = read("src/features/master/MasterApp.jsx");

test("Master: consulta contas e papéis administrativos em paralelo", () => {
  assert.match(creators, /const \[authResult, mastersResult, adminsResult\] = await Promise\.allSettled/);
  assert.match(creators, /admin\.from\("master_admins"\)\.select\("user_id"\)/);
  assert.match(creators, /admin\.from\("admins"\)\.select\("user_id"\)/);
  assert.match(creators, /protectedIds/);
  assert.match(creators, /accounts_list_viewed/);
});

test("Resend: cacheia somente ID da caixa, mantendo autorização e total não lido", () => {
  assert.match(inboxes, /const inboxCache = new Map/);
  assert.match(inboxes, /const inboxCacheTtlMs = 10 \* 60 \* 1000/);
  assert.match(inboxes, /auth\.getUser\(token\)/);
  assert.match(inboxes, /from\("master_admins"\)/);
  assert.match(inboxes, /cacheHit \? resend\("\/inboxes\?limit=100"/);
  assert.match(inboxes, /inboxUnread = Number\(item\.unread\) \|\| 0/);
  assert.match(inboxes, /if \(error instanceof ProviderError && error\.status === 404\) inboxCache\.delete\(box\)/);
  assert.doesNotMatch(inboxes, /inboxCache\.set\(box, \{[^}]*messages:/);
});

test("Navegação faz prefetch somente do código do módulo e preserva drafts", () => {
  assert.match(app, /const preloadModules = \{/);
  assert.match(app, /onMouseEnter=\{\(\) => preloadSection\(item\.id\)\}/);
  assert.match(app, /onFocus=\{\(\) => preloadSection\(item\.id\)\}/);
  assert.match(app, /const openSupportDraft = useCallback/);
  assert.match(app, /const onDraftUsed = useCallback/);
  assert.match(app, /initialDraft=\{supportDraft\}/);
});
