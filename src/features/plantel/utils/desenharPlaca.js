// Funções de desenho da placa de identificação da ave usando Canvas.

function drawWood(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#8a5a34");
  grad.addColorStop(0.5, "#6b4225");
  grad.addColorStop(1, "#4a2c18");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(30,16,6,0.55)";
  ctx.lineWidth = 2;
  const plankH = h / 5;
  for (let y = 0; y < h; y += plankH) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  const rg = ctx.createRadialGradient(w * 0.5, h * 0.5, h * 0.2, w * 0.5, h * 0.5, w * 0.75);
  rg.addColorStop(0, "rgba(0,0,0,0)");
  rg.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, w, h);
}

function drawRibbon(ctx, x, y, w, h, text, fill, outline, textColor) {
  const notch = h * 0.32;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - notch, y + h / 2);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + notch, y + h / 2);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = textColor;
  ctx.font = "bold 30px 'IBM Plex Mono', monospace";
  ctx.textBaseline = "middle";
  const tw = ctx.measureText(text).width;
  ctx.fillText(text, x + (w - tw) / 2, y + h / 2 + 2);
}

function fieldBox(ctx, x, y, w, h, value, big) {
  ctx.fillStyle = "#faf8f0";
  ctx.strokeStyle = "#1e1006";
  ctx.lineWidth = 2;
  roundRectPath(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#1c1712";
  ctx.font = (big ? "bold 42px" : "bold 30px") + " 'Fraunces', serif";
  ctx.textBaseline = "middle";
  const tw = ctx.measureText(value).width;
  ctx.fillText(value, x + (w - tw) / 2, y + h / 2 + 2);
}

function label(ctx, x, y, text) {
  ctx.fillStyle = "#e8c46a";
  ctx.font = "bold 22px 'IBM Plex Mono', monospace";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, y);
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPlaque(canvas, ave, photoImg) {
  const W = 1888, H = 1180;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  drawWood(ctx, W, H);

  const photoW = Math.round(W * 0.37);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  const seg = 6;
  for (let i = 0; i <= seg; i++) {
    const y = (H * i) / seg;
    const x = photoW - 14 - (i % 2 === 0 ? 10 : -5);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.clip();
  if (photoImg) {
    const scale = Math.max(photoW / photoImg.width, H / photoImg.height);
    const dw = photoImg.width * scale;
    const dh = photoImg.height * scale;
    ctx.drawImage(photoImg, (photoW - dw) / 2, H * 0.32 - dh * 0.32, dw, dh);
  } else {
    ctx.fillStyle = "#3a2a1c";
    ctx.fillRect(0, 0, photoW, H);
    ctx.fillStyle = "#8a7a63";
    ctx.font = "24px 'Fraunces', serif";
    ctx.fillText("sem foto", 20, H / 2);
  }
  ctx.restore();

  const PX = photoW + 18;
  const PW = W - PX - 14;
  const half = (PW - 14) / 2;
  let y = 22;
  const rowGap = 34;

  label(ctx, PX, y, "NOME");
  fieldBox(ctx, PX, y + 30, PW, 78, ave.nome || "-", true);
  y += 30 + 78 + rowGap;

  label(ctx, PX, y, "SEXO");
  label(ctx, PX + half + 14, y, "ANILHA");
  fieldBox(ctx, PX, y + 30, half, 66, ave.sexo || "-");
  fieldBox(ctx, PX + half + 14, y + 30, half, 66, ave.anilha || "-");
  y += 30 + 66 + rowGap;

  label(ctx, PX, y, "NASCIMENTO");
  label(ctx, PX + half + 14, y, "CASAL / SEXAGEM");
  fieldBox(ctx, PX, y + 30, half, 66, ave.nascimento || "-");
  const casalSex = (ave.casalLabel ? ave.casalLabel + " - " : "") + (ave.sexado ? "SEXADO" : "S/ SEXAGEM");
  fieldBox(ctx, PX + half + 14, y + 30, half, 66, casalSex);
  y += 30 + 66 + rowGap;

  label(ctx, PX, y, "CRIADOR");
  fieldBox(ctx, PX, y + 30, PW, 66, ave.criador || "-");

  const ribbonH = 46;
  const rx = 14, ry = H - ribbonH - 12;
  drawRibbon(ctx, rx, ry, 220, ribbonH, (ave.especie || "AVE").toUpperCase(), "#a6402b", "#6e2417", "#f7dfb0");
  if (ave.corMutacao) {
    drawRibbon(ctx, rx + 220 + 14, ry, 200, ribbonH, ave.corMutacao.toUpperCase(), "#d2a014", "#826008", "#3c2300");
  }

  ctx.fillStyle = "rgba(235,220,190,0.9)";
  ctx.font = "italic 18px 'Fraunces', serif";
  const footer = `Criatorio ${ave.criador || "-"}  \u2022  CTF: ${ave.ctf || "-"}`;
  const fw = ctx.measureText(footer).width;
  ctx.fillText(footer, W - fw - 16, H - 20);
}

export { drawPlaque };
