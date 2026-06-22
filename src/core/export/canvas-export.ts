"use client";
import type { ExportPreset, ExportFormat } from "@/core/domain/export-presets";

function loadImage(src: string): Promise<HTMLImageElement> {
  // route remote images through a same-origin proxy so the canvas isn't tainted
  const resolved = /^https?:\/\//.test(src)
    ? `/api/proxy-image?url=${encodeURIComponent(src)}`
    : src;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Не удалось загрузить изображение для экспорта."));
    img.src = resolved;
  });
}

/** Draw the source image into the target preset size using object-fit: cover. */
async function renderToCanvas(
  src: string,
  preset: ExportPreset,
): Promise<HTMLCanvasElement> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = preset.width;
  canvas.height = preset.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas не поддерживается.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, preset.width, preset.height);

  const scale = Math.max(preset.width / img.width, preset.height / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (preset.width - w) / 2;
  const y = (preset.height - h) / 2;
  ctx.drawImage(img, x, y, w, h);

  return canvas;
}

function mime(format: ExportFormat) {
  return format === "png" ? "image/png" : "image/jpeg";
}

export async function exportImage(
  src: string,
  preset: ExportPreset,
  format: ExportFormat,
): Promise<Blob> {
  const canvas = await renderToCanvas(src, preset);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Не удалось создать файл."))),
      mime(format),
      0.92,
    );
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportAndDownload(
  src: string,
  preset: ExportPreset,
  format: ExportFormat,
  baseName = "wb-card",
) {
  const blob = await exportImage(src, preset, format);
  downloadBlob(blob, `${baseName}-${preset.width}x${preset.height}.${format}`);
}

export async function exportAllVariants(
  src: string,
  presets: ExportPreset[],
  format: ExportFormat,
  baseName = "wb-card",
) {
  for (const preset of presets) {
    // eslint-disable-next-line no-await-in-loop
    await exportAndDownload(src, preset, format, baseName);
  }
}
