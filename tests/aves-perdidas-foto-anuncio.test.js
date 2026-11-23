import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/features/aves-perdidas/pages/AvesPerdidas.jsx", import.meta.url), "utf8");

test("anúncios de aves perdidas preservam a foto inteira", () => {
  assert.match(source, /max-h-full max-w-full object-contain object-center/);
  assert.match(source, /h-\\[280px\\]/);
  assert.match(source, /sm:h-\\[320px\\]/);
  assert.doesNotMatch(source, /aspect-\\[16\\/10\\] w-full object-cover/);
});
