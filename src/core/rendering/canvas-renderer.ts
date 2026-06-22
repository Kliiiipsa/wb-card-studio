"use client";
import type { RenderElement, CardOverlay } from "./types";

const FONT_STACK =
  '"Segoe UI", -apple-system, system-ui, Roboto, "Helvetica Neue", Arial, sans-serif';

/** Draw a single overlay element onto the canvas context. */
function drawElement(ctx: CanvasRenderingContext2D, el: RenderElement) {
  if (el.type === "shape") {
    if (el.background) {
      ctx.fillStyle = el.background;
      roundRect(ctx, el.x, el.y, el.width, el.height, Math.min(el.height / 2, 16));
      ctx.fill();
    }
    return;
  }

  const fontSize = el.fontSize ?? 32;
  const weight = el.fontWeight ?? 600;
  ctx.font = `${weight} ${fontSize}px ${FONT_STACK}`;
  ctx.textBaseline = "top";
  ctx.textAlign = el.align ?? "left";

  // badge / benefit: draw a rounded plate behind the text
  if ((el.type === "benefit" || el.type === "badge") && el.background) {
    const padX = Math.round(fontSize * 0.6);
    const padY = Math.round(fontSize * 0.45);
    const textW = Math.min(ctx.measureText(el.text ?? "").width, el.width - padX * 2);
    const plateW = textW + padX * 2;
    const plateH = fontSize + padY * 2;
    ctx.fillStyle = el.background;
    roundRect(ctx, el.x, el.y, plateW, plateH, Math.round(plateH / 2));
    ctx.fill();
    ctx.fillStyle = el.color ?? "#ffffff";
    drawText(ctx, el.text ?? "", el.x + padX, el.y + padY, el.width - padX * 2, fontSize);
    return;
  }

  // headline / subtitle: soft shadow for legibility on any background
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = Math.round(fontSize * 0.4);
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = el.color ?? "#ffffff";
  drawWrapped(ctx, el.text ?? "", el.x, el.y, el.width, fontSize, Math.round(fontSize * 1.15));
  ctx.restore();
}

/** Draw a raw list of elements (used by the infographics overlay plan). */
export function drawElements(ctx: CanvasRenderingContext2D, elements: RenderElement[]) {
  for (const el of elements) drawElement(ctx, el);
}

/** Render all overlay elements over the already-drawn base image. */
export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  elements: RenderElement[],
  overlay: CardOverlay,
  width: number,
  height: number,
) {
  if (overlay.scrim && (overlay.headline || (overlay.benefits?.length ?? 0) > 0)) {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "rgba(0,0,0,0.35)");
    grad.addColorStop(0.3, "rgba(0,0,0,0)");
    grad.addColorStop(0.7, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.4)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }
  for (const el of elements) drawElement(ctx, el);
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
) {
  // single line, ellipsize if needed
  let t = text;
  if (ctx.measureText(t).width > maxWidth) {
    while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) t = t.slice(0, -1);
    t += "…";
  }
  ctx.fillText(t, x, y);
  void fontSize;
}

function drawWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  let line = "";
  let cursorY = y;
  let lines = 0;
  const maxLines = 3;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
      lines += 1;
      if (lines >= maxLines - 1) break;
    } else {
      line = test;
    }
  }
  // last line (ellipsize if still too wide)
  let last = line;
  if (ctx.measureText(last).width > maxWidth) {
    while (last.length > 1 && ctx.measureText(last + "…").width > maxWidth)
      last = last.slice(0, -1);
    last += "…";
  }
  ctx.fillText(last, x, cursorY);
  void fontSize;
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
