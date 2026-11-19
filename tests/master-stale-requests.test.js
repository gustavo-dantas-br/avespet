import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const modules = [
  "CreatorManagement",
  "BirdsManagement",
  "LostBirdsModeration",
  "SupportOperations",
  "MasterInboxPanel",
];

for (const module of modules) {
  test(module + ": resposta de filtros antigos não sobrescreve dados atuais", () => {
    const code = readFileSync(new URL("../src/features/master/" + module + ".jsx", import.meta.url), "utf8");
    const requestRef = module === "MasterInboxPanel" ? "threadsRequestId" : "listRequestId";
    assert.match(code, new RegExp("useRef\\(0\\)"));
    assert.ok(code.includes("++" + requestRef + ".current"));
    assert.ok(code.includes("requestId === " + requestRef + ".current"));
    assert.ok(code.includes("return () => { " + requestRef + ".current += 1; };"));
  });
}
