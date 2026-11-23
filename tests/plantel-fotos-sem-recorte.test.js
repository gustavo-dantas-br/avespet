import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const cadastro = readFileSync(new URL("../src/features/plantel/FormTab.jsx", import.meta.url), "utf8");
const cartao = readFileSync(new URL("../src/features/plantel/components/AveCard.jsx", import.meta.url), "utf8");
const compressor = readFileSync(new URL("../src/features/plantel/utils/comprimirFoto.js", import.meta.url), "utf8");

test("prévias e cartões do plantel exibem fotos inteiras", () => {
  assert.ok(cadastro.includes('className="w-full h-full object-contain"'));
  assert.ok(cartao.includes('className="absolute inset-0 h-full w-full object-contain"'));
  assert.ok(!cadastro.includes('className="w-full h-full object-cover"'));
  assert.ok(!cartao.includes('className="absolute inset-0 h-full w-full object-cover"'));
});

test("compressão mantém proporção e limite existentes", () => {
  assert.ok(compressor.includes("const maxDim = 480"));
  assert.ok(compressor.includes("(height * maxDim) / width"));
  assert.ok(compressor.includes("(width * maxDim) / height"));
  assert.ok(compressor.includes("ctx.drawImage(img, 0, 0, width, height)"));
});
