"use client";

/** Safe-zone description of the base image (heuristic; swap for vision later). */
export type ImageComposition = {
  productZone: { x: number; y: number; width: number; height: number };
  freeZones: Array<{ x: number; y: number; width: number; height: number; score: number }>;
  dominantBackground: "light" | "dark" | "mixed";
  /** where the headline best fits */
  headlineBand: "top" | "bottom";
  /** where benefit cards best fit */
  benefitsBand: "top" | "bottom";
  topLuminance: number;
  bottomLuminance: number;
  /** muted accent sampled from the image, or null if near-neutral */
  accent: string | null;
};

const GRID_W = 36;
const GRID_H = 48;

/**
 * Lightweight pixel heuristic: sample the image on a small grid, measure
 * per-band luminance + variance to find the calmest bands for text, estimate
 * the product zone (center) and extract a muted accent colour.
 */
export function analyzeComposition(img: HTMLImageElement): ImageComposition {
  const canvas = document.createElement("canvas");
  canvas.width = GRID_W;
  canvas.height = GRID_H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  // safe defaults if pixel access fails (e.g. taint)
  let lum: number[][] = [];
  let rSum = 0,
    gSum = 0,
    bSum = 0,
    n = 0;
  try {
    if (!ctx) throw new Error("no ctx");
    const scale = Math.max(GRID_W / img.width, GRID_H / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (GRID_W - w) / 2, (GRID_H - h) / 2, w, h);
    const data = ctx.getImageData(0, 0, GRID_W, GRID_H).data;
    for (let y = 0; y < GRID_H; y++) {
      lum[y] = [];
      for (let x = 0; x < GRID_W; x++) {
        const i = (y * GRID_W + x) * 4;
        const r = data[i],
          g = data[i + 1],
          b = data[i + 2];
        lum[y][x] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        rSum += r;
        gSum += g;
        bSum += b;
        n++;
      }
    }
  } catch {
    lum = [];
  }

  if (!lum.length) {
    return {
      productZone: { x: 0.22, y: 0.24, width: 0.56, height: 0.54 },
      freeZones: [],
      dominantBackground: "mixed",
      headlineBand: "top",
      benefitsBand: "bottom",
      topLuminance: 0.5,
      bottomLuminance: 0.5,
      accent: null,
    };
  }

  const bandStats = (y0: number, y1: number) => {
    const vals: number[] = [];
    for (let y = y0; y < y1; y++) for (let x = 0; x < GRID_W; x++) vals.push(lum[y][x]);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + (b - avg) ** 2, 0) / vals.length;
    return { avg, variance };
  };

  const top = bandStats(0, Math.floor(GRID_H * 0.3));
  const bottom = bandStats(Math.floor(GRID_H * 0.68), GRID_H);
  const overall = bandStats(0, GRID_H);

  const dominantBackground: "light" | "dark" | "mixed" =
    overall.avg > 0.62 ? "light" : overall.avg < 0.36 ? "dark" : "mixed";

  // calmer (lower variance) band hosts the headline; the other hosts benefits
  const headlineBand: "top" | "bottom" = top.variance <= bottom.variance ? "top" : "bottom";
  const benefitsBand: "top" | "bottom" = headlineBand === "top" ? "bottom" : "top";

  const freeZones = [
    { x: 0.06, y: 0.04, width: 0.88, height: 0.24, score: 1 - top.variance },
    { x: 0.06, y: 0.72, width: 0.88, height: 0.24, score: 1 - bottom.variance },
  ];

  // muted accent from average colour (skip if near-neutral / greyscale)
  let accent: string | null = null;
  if (n > 0) {
    const r = rSum / n,
      g = gSum / n,
      b = bSum / n;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    if (max - min > 28) {
      // mute it: blend toward mid-grey for a tasteful, native accent
      const mix = (c: number) => Math.round(c * 0.6 + 110 * 0.4);
      accent = `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
    }
  }

  return {
    productZone: { x: 0.2, y: 0.24, width: 0.6, height: 0.52 },
    freeZones,
    dominantBackground,
    headlineBand,
    benefitsBand,
    topLuminance: top.avg,
    bottomLuminance: bottom.avg,
    accent,
  };
}
