import type { RenderElement } from "@/core/rendering/types";
import type { InfographicBlock, InfographicOverlayPlan } from "./types";
import { PLAN_W, PLAN_H, type LayoutPreset } from "./layout-presets";
import { uid } from "@/lib/utils";

/**
 * Build the canvas overlay plan (headline, subheadline, benefit cards) in the
 * fixed PLAN_W×PLAN_H space. The renderer scales it to the export size.
 *
 * palette = [accent, plateBg, headlineColor, benefitTextColor]
 */
export function buildOverlayPlan(args: {
  headline: string;
  subheadline?: string;
  blocks: InfographicBlock[];
  palette: string[];
  preset: LayoutPreset;
}): InfographicOverlayPlan {
  const { headline, subheadline, blocks, palette, preset } = args;
  const accent = palette[0] ?? "#6d28d9";
  const plateBg = palette[1] ?? "rgba(15,23,42,0.55)";
  const headlineColor = palette[2] ?? "#ffffff";
  const benefitText = palette[3] ?? "#ffffff";

  const pad = 63;
  const elements: RenderElement[] = [];

  // ----- headline plate + text (top) -----
  const plateW = PLAN_W - pad * 2;
  const plateH = subheadline ? 210 : 150;
  elements.push({
    id: uid("sh"),
    type: "shape",
    x: pad,
    y: 54,
    width: plateW,
    height: plateH,
    background: plateBg,
  });
  elements.push({
    id: uid("hl"),
    type: "headline",
    text: headline,
    x: pad + 28,
    y: 86,
    width: plateW - 56,
    height: 130,
    fontSize: 60,
    fontWeight: 800,
    align: "left",
    color: headlineColor,
  });
  if (subheadline) {
    elements.push({
      id: uid("sub"),
      type: "subtitle",
      text: subheadline,
      x: pad + 28,
      y: 54 + plateH - 56,
      width: plateW - 56,
      height: 44,
      fontSize: 30,
      fontWeight: 500,
      align: "left",
      color: headlineColor,
    });
  }

  // ----- benefit cards -----
  const items = blocks.slice(0, preset.maxBlocks);
  const bh = 92;
  const gap = 20;

  if (preset.blocksPlacement === "right") {
    const colW = 320;
    const x = PLAN_W - pad - colW;
    const totalH = items.length * bh + (items.length - 1) * gap;
    let y = (PLAN_H - totalH) / 2 + 120;
    for (const b of items) {
      elements.push(benefitEl(b.title, x, y, colW, bh, accent, benefitText));
      y += bh + gap;
    }
  } else {
    // bottom (default)
    const colW = Math.min(620, PLAN_W - pad * 2);
    let y = PLAN_H - pad - items.length * (bh + gap) + gap;
    for (const b of items) {
      elements.push(benefitEl(b.title, pad, y, colW, bh, accent, benefitText));
      y += bh + gap;
    }
  }

  return { width: PLAN_W, height: PLAN_H, elements };
}

function benefitEl(
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  background: string,
  color: string,
): RenderElement {
  return {
    id: uid("bf"),
    type: "benefit",
    text,
    x,
    y,
    width,
    height,
    fontSize: 34,
    fontWeight: 600,
    align: "left",
    color,
    background,
  };
}
