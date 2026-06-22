"use client";
/**
 * Backward-compatible re-exports. The real implementation now lives in
 * `@/core/rendering/export` (image compositing + text overlay).
 */
export {
  renderCardToBlob as exportImage,
  downloadBlob,
  exportCard as exportAndDownload,
  exportAllVariants,
  type ExportVariant,
} from "@/core/rendering/export";
