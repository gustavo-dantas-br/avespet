import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const backend = readFileSync(new URL("../supabase/functions/master-support-operations/index.ts", import.meta.url), "utf8");
const front = readFileSync(new URL("../src/features/master/SupportOperations.jsx", import.meta.url), "utf8");
const master = readFileSync(new URL("../src/features/master/MasterApp.jsx", import.meta.url), "utf8");
const inbox = readFileSync(new URL("../src/features/master/MasterInboxPanel.jsx", import.meta.url), "utf8");

test("rascunho do suporte é restrito ao Master e não faz envio automático", () => {
  assert.ok(backend.indexOf('if (!master) return reply({ error: "Forbidden"') < backend.indexOf('if (action === "prepare-email")'));
  assert.match(backend, /admin\.auth\.admin\.getUserById\(ad\.user_id\)/);
  assert.match(backend, /owner\?\.user\?\.email_confirmed_at/);
  assert.match(backend, /master_support_email_draft_prepared/);
  assert.match(backend, /return reply\(\{ success: true, draft: \{ box: "suporte"/);
  assert.doesNotMatch(backend.slice(backend.indexOf('if (action === "prepare-email")'), backend.indexOf('if (action === "save")')), /fetch\("https:\/\/api\.resend\.com|\.send\(/);
});
test("solicitar complemento apenas prepara rascunho na Central", () => {
  assert.match(front, /action: "prepare-email"/);
  assert.match(front, /onPrepareEmail\(data\.draft\)/);
  assert.match(master, /<SupportOperations onPrepareEmail=\{openSupportDraft\}/);
  assert.match(inbox, /setComposeTo\(initialDraft\.to/);
  assert.match(inbox, /setComposing\(true\)/);
  assert.match(inbox, /window\.confirm\("Enviar novo e-mail/);
});
