import { supabase } from "../../../supabaseClient";

/**
 * Reduz fotos para JPEG e envia ao Supabase Storage.
 * O banco recebe apenas a URL pública, nunca o conteúdo Base64.
 */
export async function comprimirEEnviarImagemPublica(arquivo, pasta = "aves", limiteBytes = 160 * 1024) {
  if (!arquivo || !arquivo.type?.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem válido.");
  }

  const bitmap = await createImageBitmap(arquivo);
  let blobFinal = null;
  try {
    const maxDim = 720;
    const escala = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const larguraBase = Math.max(1, Math.round(bitmap.width * escala));
    const alturaBase = Math.max(1, Math.round(bitmap.height * escala));

    for (const fator of [1, 0.84, 0.68, 0.52, 0.40]) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(larguraBase * fator));
      canvas.height = Math.max(1, Math.round(alturaBase * fator));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Não foi possível preparar a imagem.");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.72, 0.58, 0.44, 0.32]) {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
        if (blob && blob.size <= limiteBytes) { blobFinal = blob; break; }
      }
      if (blobFinal) break;
    }
  } finally {
    bitmap.close?.();
  }

  if (!blobFinal) throw new Error("Esta imagem não pôde ser reduzida o suficiente. Tente outra foto.");

  const nome = `${pasta}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from("fotos-publicas-aves").upload(nome, blobFinal, {
    contentType: "image/jpeg",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error("Não foi possível salvar a foto. Tente novamente.");

  const { data } = supabase.storage.from("fotos-publicas-aves").getPublicUrl(nome);
  return data.publicUrl;
}
