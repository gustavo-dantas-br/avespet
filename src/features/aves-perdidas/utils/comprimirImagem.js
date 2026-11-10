/**
 * Normaliza fotos enviadas pelo público antes de persistir no banco.
 * Saída: JPEG em Data URL, preferencialmente abaixo de 160 KB.
 */
export async function comprimirImagemPublica(arquivo, limiteBytes = 160 * 1024) {
  if (!arquivo || !arquivo.type?.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem válido.");
  }

  const bitmap = await createImageBitmap(arquivo);
  try {
    const contextoMaximo = 720;
    const escala = Math.min(1, contextoMaximo / Math.max(bitmap.width, bitmap.height));
    const larguraOriginal = Math.max(1, Math.round(bitmap.width * escala));
    const alturaOriginal = Math.max(1, Math.round(bitmap.height * escala));

    for (const fator of [1, 0.84, 0.68, 0.52, 0.40]) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(larguraOriginal * fator));
      canvas.height = Math.max(1, Math.round(alturaOriginal * fator));
      const contexto = canvas.getContext("2d");
      if (!contexto) throw new Error("Não foi possível preparar a imagem.");

      // JPEG não preserva transparência: usa fundo branco para evitar áreas pretas.
      contexto.fillStyle = "#fff";
      contexto.fillRect(0, 0, canvas.width, canvas.height);
      contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const qualidade of [0.72, 0.58, 0.44, 0.32]) {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", qualidade));
        if (blob && blob.size <= limiteBytes) {
          return await new Promise((resolve, reject) => {
            const leitor = new FileReader();
            leitor.onload = () => resolve(leitor.result);
            leitor.onerror = () => reject(new Error("Falha ao ler a imagem comprimida."));
            leitor.readAsDataURL(blob);
          });
        }
      }
    }
    throw new Error("Esta imagem não pôde ser reduzida o suficiente. Tente outra foto.");
  } finally {
    bitmap.close?.();
  }
}
