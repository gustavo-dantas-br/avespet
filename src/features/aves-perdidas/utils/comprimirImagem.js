import { supabase } from "../../../supabaseClient";

/**
 * Reduz fotos no próprio navegador antes do upload.
 * Prioriza WebP (menor arquivo com boa qualidade), com fallback para JPEG.
 * O banco recebe somente a URL pública, nunca o conteúdo Base64.
 */
export async function comprimirEEnviarImagemPublica(arquivo, pasta = "aves", limiteBytes = 350 * 1024) {
  if (!arquivo || !arquivo.type?.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem válido.");
  }
  if (arquivo.size > 15 * 1024 * 1024) {
    throw new Error("A foto deve ter no máximo 15 MB antes da compressão.");
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(arquivo);
  } catch {
    throw new Error("Não foi possível abrir essa imagem. Tente enviar uma foto em JPG, PNG ou WebP.");
  }

  let blobFinal = null;
  let tipoFinal = "image/webp";
  try {
    const maxDim = 1280;
    const escala = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const larguraBase = Math.max(1, Math.round(bitmap.width * escala));
    const alturaBase = Math.max(1, Math.round(bitmap.height * escala));
    const formatos = ["image/webp", "image/jpeg"];

    for (const formato of formatos) {
      for (const fator of [1, 0.9, 0.8, 0.7]) {
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(larguraBase * fator));
        canvas.height = Math.max(1, Math.round(alturaBase * fator));
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Não foi possível preparar a imagem.");
        if (formato === "image/jpeg") {
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        for (const qualidade of [0.84, 0.76, 0.68, 0.60, 0.52]) {
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, formato, qualidade));
          if (blob && blob.size <= limiteBytes && blob.type === formato) {
            blobFinal = blob;
            tipoFinal = formato;
            break;
          }
        }
        if (blobFinal) break;
      }
      if (blobFinal) break;
    }
  } finally {
    bitmap.close?.();
  }

  if (!blobFinal) {
    throw new Error("Não foi possível reduzir essa foto mantendo boa qualidade. Tente uma imagem menor.");
  }

  const extensao = tipoFinal === "image/webp" ? "webp" : "jpg";
  const nome = `${pasta}/${crypto.randomUUID()}.${extensao}`;
  const { error } = await supabase.storage.from("fotos-publicas-aves").upload(nome, blobFinal, {
    contentType: tipoFinal,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error("Não foi possível salvar a foto. Tente novamente.");

  const { data } = supabase.storage.from("fotos-publicas-aves").getPublicUrl(nome);
  return data.publicUrl;
}
