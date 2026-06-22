import type { ExportPreset } from "@/core/domain/export-presets";

/** A single element drawn on top of the generated image. */
export type RenderElement = {
  id: string;
  type: "headline" | "subtitle" | "badge" | "benefit" | "shape";
  text?: string;
  /** absolute coordinates in the target preset's pixel space */
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontWeight?: number;
  align?: "left" | "center" | "right";
  color?: string;
  background?: string;
};

/** Everything needed to compose the final card on top of the base image. */
export type CardOverlay = {
  headline?: string;
  subtitle?: string;
  benefits?: string[];
  /** accent color for plates/badges */
  accent?: string;
  /** when true, paint a soft bottom gradient for text legibility */
  scrim?: boolean;
};

/**
 * Build a sensible default set of render elements from a high-level overlay,
 * positioned relative to the target preset. Kept deliberately simple for the
 * MVP: a headline, optional subtitle, and up to 3 benefit badges.
 */
export function buildDefaultElements(overlay: CardOverlay, preset: ExportPreset): RenderElement[] {
  const { width: W, height: H } = preset;
  const pad = Math.round(W * 0.07);
  const accent = overlay.accent ?? "#6d28d9";
  const els: RenderElement[] = [];

  if (overlay.headline) {
    els.push({
      id: "headline",
      type: "headline",
      text: overlay.headline,
      x: pad,
      y: Math.round(H * 0.06),
      width: W - pad * 2,
      height: Math.round(H * 0.14),
      fontSize: Math.round(W * 0.075),
      fontWeight: 800,
      align: "left",
      color: "#ffffff",
    });
  }

  if (overlay.subtitle) {
    els.push({
      id: "subtitle",
      type: "subtitle",
      text: overlay.subtitle,
      x: pad,
      y: Math.round(H * 0.2),
      width: W - pad * 2,
      height: Math.round(H * 0.06),
      fontSize: Math.round(W * 0.035),
      fontWeight: 500,
      align: "left",
      color: "#f1f5f9",
    });
  }

  const benefits = (overlay.benefits ?? []).slice(0, 3);
  benefits.forEach((b, i) => {
    const bh = Math.round(H * 0.07);
    const gap = Math.round(H * 0.02);
    els.push({
      id: `benefit-${i}`,
      type: "benefit",
      text: b,
      x: pad,
      y: H - pad - (benefits.length - i) * (bh + gap),
      width: Math.min(W - pad * 2, Math.round(W * 0.7)),
      height: bh,
      fontSize: Math.round(W * 0.034),
      fontWeight: 600,
      align: "left",
      color: "#ffffff",
      background: accent,
    });
  });

  return els;
}
