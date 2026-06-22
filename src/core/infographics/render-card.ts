"use client";
import type { ExportPreset, ExportFormat } from "@/core/domain/export-presets";
import { downloadBlob } from "@/core/rendering/export";
import type { InfographicBrief } from "./types";
import { analyzeComposition } from "./composition";
import { buildTokens, hexToRgba, type BackgroundMode } from "./design-tokens";

const REF_W = 900;

function loadImage(src: string): Promise<HTMLImageElement> {
  const resolved = /^https?:\/\//.test(src)
    ? `/api/proxy-image?url=${encodeURIComponent(src)}`
    : src;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Не удалось загрузить изображение."));
    img.src = resolved;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** Wrap text into up to maxLines lines that fit maxWidth; returns the lines. */
function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else {
      line = test;
    }
  }
  let last = line;
  if (ctx.measureText(last).width > maxWidth) {
    while (last.length > 1 && ctx.measureText(last + "…").width > maxWidth)
      last = last.slice(0, -1);
    last += "…";
  }
  if (last) lines.push(last);
  return lines.slice(0, maxLines);
}

/** Scrim gradient at a band for legibility, coloured for the band's mode. */
function drawBandScrim(
  ctx: CanvasRenderingContext2D,
  band: "top" | "bottom",
  mode: BackgroundMode,
  width: number,
  height: number,
) {
  const c = mode === "light" ? "255,255,255" : "0,0,0";
  const a = mode === "light" ? 0.34 : 0.46;
  const h = height * 0.42;
  const grad =
    band === "top"
      ? ctx.createLinearGradient(0, 0, 0, h)
      : ctx.createLinearGradient(0, height, 0, height - h);
  grad.addColorStop(0, `rgba(${c},${a})`);
  grad.addColorStop(1, `rgba(${c},0)`);
  ctx.fillStyle = grad;
  if (band === "top") ctx.fillRect(0, 0, width, h);
  else ctx.fillRect(0, height - h, width, h);
}

function modeFor(lum: number): BackgroundMode {
  return lum > 0.55 ? "light" : "dark";
}

/** Render the full cohesive infographic into a canvas. */
async function renderToCanvas(
  baseSrc: string,
  width: number,
  height: number,
  brief: InfographicBrief,
): Promise<HTMLCanvasElement> {
  const img = await loadImage(baseSrc);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas не поддерживается.");

  // base image, cover-fit
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  const scaleImg = Math.max(width / img.width, height / img.height);
  const iw = img.width * scaleImg;
  const ih = img.height * scaleImg;
  ctx.drawImage(img, (width - iw) / 2, (height - ih) / 2, iw, ih);

  const comp = analyzeComposition(img);
  const s = width / REF_W;

  // a transferred style (library or reference) overrides accent, card shape,
  // headline position and density; band placement + contrast still adapt to the
  // actual product photo for legibility.
  const profile = brief.styleProfile;
  const accentOverride = profile?.palette.accent ?? comp.accent;
  const headlineBand = profile?.headlinePosition ?? comp.headlineBand;
  const benefitsBand: "top" | "bottom" = headlineBand === "top" ? "bottom" : "top";
  const headlineMode = modeFor(headlineBand === "top" ? comp.topLuminance : comp.bottomLuminance);
  const benefitsMode = modeFor(benefitsBand === "top" ? comp.topLuminance : comp.bottomLuminance);
  const tHead = buildTokens(brief.style as never, headlineMode, accentOverride);
  const tBen = buildTokens(brief.style as never, benefitsMode, accentOverride);
  const cardRadius = profile?.radius ?? tBen.radius.card;
  const cardKind = profile?.cardStyle ?? "integrated-soft";

  drawBandScrim(ctx, headlineBand, headlineMode, width, height);
  if (brief.blocks.length) drawBandScrim(ctx, benefitsBand, benefitsMode, width, height);

  const pad = tHead.spacing.pagePadding * s;
  const maxTextW = width - pad * 2;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  /* ---------------- headline + subheadline ---------------- */
  const hSize = tHead.typography.headlineSize * s;
  ctx.font = `${tHead.typography.fontWeight} ${hSize}px ${tHead.typography.fontFamily}`;
  const hLines = wrapLines(ctx, brief.headline, maxTextW, 2);
  const hLineH = hSize * 1.12;
  const subSize = tHead.typography.subheadlineSize * s;
  const subLineH = brief.subheadline ? subSize * 1.3 : 0;
  const accentLineH = 6 * s;
  const headBlockH =
    hLines.length * hLineH + (brief.subheadline ? subLineH + 8 * s : 0) + accentLineH + 14 * s;

  let hy = headlineBand === "top" ? pad : height - pad - headBlockH;

  // accent underline above headline
  ctx.fillStyle = tHead.palette.accent;
  roundRect(ctx, pad, hy, 64 * s, accentLineH, accentLineH / 2);
  ctx.fill();
  hy += accentLineH + 14 * s;

  ctx.font = `${tHead.typography.fontWeight} ${hSize}px ${tHead.typography.fontFamily}`;
  ctx.fillStyle = tHead.palette.textPrimary;
  ctx.save();
  ctx.shadowColor = headlineMode === "light" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 8 * s;
  for (const line of hLines) {
    ctx.fillText(line, pad, hy);
    hy += hLineH;
  }
  ctx.restore();

  if (brief.subheadline) {
    hy += 8 * s;
    ctx.font = `500 ${subSize}px ${tHead.typography.fontFamily}`;
    ctx.fillStyle = tHead.palette.textSecondary;
    const subLine = wrapLines(ctx, brief.subheadline, maxTextW, 1)[0] ?? "";
    ctx.fillText(subLine, pad, hy);
  }

  /* ---------------- benefit cards (uniform grid) ---------------- */
  const items = brief.blocks
    .map((b) => b.title)
    .filter(Boolean)
    .slice(0, 5);
  if (items.length) {
    const editorial = cardKind === "premium-editorial";
    const cardH = (editorial ? 78 : 92) * s;
    const gap = tBen.spacing.blockGap * s;
    const cardW = width - pad * 2;
    const totalH = items.length * cardH + (items.length - 1) * gap;
    let cy = benefitsBand === "bottom" ? height - pad - totalH : pad;

    const titleSize = tBen.typography.blockTitleSize * s;
    const padX = tBen.spacing.blockPadding * s;
    for (const title of items) {
      const dotY = cy + cardH / 2;

      if (editorial) {
        // editorial: no plate — a thin accent bar + text (premium, airy)
        ctx.fillStyle = tBen.palette.accent;
        roundRect(ctx, pad, dotY - 18 * s, 5 * s, 36 * s, 3 * s);
        ctx.fill();
      } else {
        // frosted/clean card surface + soft shadow
        ctx.save();
        ctx.shadowColor = tBen.shadow.medium;
        ctx.shadowBlur = 22 * s;
        ctx.shadowOffsetY = 6 * s;
        ctx.fillStyle = tBen.palette.surface;
        roundRect(ctx, pad, cy, cardW, cardH, cardRadius * s);
        ctx.fill();
        if (cardKind === "marketplace-clean") {
          // a touch more solidity for the clean look
          ctx.fillStyle = tBen.palette.surface;
          ctx.fill();
        }
        ctx.restore();

        // accent chip + dot
        ctx.fillStyle = hexToRgba(tBen.palette.accent, 0.18);
        roundRect(ctx, pad + padX - 4 * s, dotY - 22 * s, 44 * s, 44 * s, 12 * s);
        ctx.fill();
        ctx.fillStyle = tBen.palette.accent;
        ctx.beginPath();
        ctx.arc(pad + padX + 18 * s, dotY, 9 * s, 0, Math.PI * 2);
        ctx.fill();
      }

      // title
      ctx.font = `600 ${titleSize}px ${tBen.typography.fontFamily}`;
      ctx.fillStyle = tBen.palette.textPrimary;
      ctx.textBaseline = "middle";
      const textX = editorial ? pad + 22 * s : pad + padX + 64 * s;
      const maxW = cardW - (textX - pad) - padX;
      const line = wrapLines(ctx, title, maxW, 2);
      if (line.length === 1) {
        ctx.fillText(line[0], textX, dotY);
      } else {
        ctx.fillText(line[0], textX, dotY - titleSize * 0.62);
        ctx.fillText(line[1], textX, dotY + titleSize * 0.62);
      }
      ctx.textBaseline = "top";

      cy += cardH + gap;
    }
  }

  return canvas;
}

/** Small preview data URL for the live canvas. */
export async function renderInfographicPreview(
  baseSrc: string,
  brief: InfographicBrief,
  previewWidth = 480,
): Promise<string> {
  const height = Math.round(previewWidth * (1200 / 900));
  const canvas = await renderToCanvas(baseSrc, previewWidth, height, brief);
  return canvas.toDataURL("image/png");
}

export async function exportInfographicCard(
  baseSrc: string,
  preset: ExportPreset,
  format: ExportFormat,
  brief: InfographicBrief,
  baseName = "wb-infographic",
) {
  const canvas = await renderToCanvas(baseSrc, preset.width, preset.height, brief);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Не удалось создать файл."))),
      format === "png" ? "image/png" : "image/jpeg",
      0.92,
    ),
  );
  downloadBlob(blob, `${baseName}-${preset.width}x${preset.height}.${format}`);
}
