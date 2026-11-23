import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/features/aves-perdidas/pages/AvesPerdidas.jsx", import.meta.url), "utf8");

test("anúncios de aves perdidas preservam a foto inteira", () => {
  assert.ok(source.includes("max-h-full max-w-full object-contain object-center"));
  assert.ok(source.includes("h-[280px]"));
  assert.ok(source.includes("sm:h-[320px]"));
  assert.ok(!source.includes('className="aspect-[16/10] w-full object-cover"'));
});
