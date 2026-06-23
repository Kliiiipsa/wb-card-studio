"use client";

/**
 * Downscale + re-encode an uploaded image in the browser BEFORE it's sent to the
 * API. Phone photos are 3–8 MB; as base64 they blow past Vercel's 4.5 MB request
 * body limit (→ 413) and slow everything down. Compressing to ~1600px / JPEG
 * keeps requests small (usually <1.5 MB) and generation fast, with no quality
 * loss that matters for a 900–1080px marketplace card.
 */
const MAX_DIM = 1600;
const JPEG_QUALITY = 0.82;

export async function compressImage(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas не поддерживается.");
    // white backdrop so transparent PNGs don't turn black when flattened to JPEG
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Не удалось обработать изображение."));
    img.src = src;
  });
}
