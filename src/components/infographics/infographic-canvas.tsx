"use client";
import * as React from "react";
import { Loader2 } from "lucide-react";
import { renderInfographicPreview } from "@/core/infographics/render-card";
import type { InfographicBrief } from "@/core/infographics/types";

/**
 * Final infographic preview = AI-generated clean base + canvas text overlay
 * (title, benefits) drawn with a real font (image models can't render Cyrillic).
 *
 * Resilient: the AI base is shown immediately; once the text overlay finishes
 * rendering it replaces the base. If the overlay render fails (e.g. flaky
 * network while loading the image into canvas), the base image stays visible.
 */
export function InfographicCanvas({
  baseSrc,
  brief,
  textBaked,
  className,
}: {
  baseSrc?: string | null;
  brief?: InfographicBrief | null;
  /** the model already rendered the text into the base — show it as-is */
  textBaked?: boolean;
  className?: string;
}) {
  const [overlayUrl, setOverlayUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    setOverlayUrl(null);
    // text baked into the image (gpt-image) — no canvas overlay needed
    if (!baseSrc || !brief || textBaked) return;
    renderInfographicPreview(baseSrc, brief)
      .then((u) => active && setOverlayUrl(u))
      .catch((e) => {
        // keep the base image visible; overlay is an enhancement
        // eslint-disable-next-line no-console
        console.error("[infographic overlay render failed]", e);
      });
    return () => {
      active = false;
    };
  }, [baseSrc, brief, textBaked]);

  const wrapper =
    "relative aspect-[3/4] overflow-hidden rounded-xl border bg-muted " + (className ?? "");

  if (!baseSrc) {
    return (
      <div className={wrapper}>
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          Нет изображения
        </div>
      </div>
    );
  }

  return (
    <div className={wrapper}>
      {/* base AI image shown immediately (no canvas needed for display) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={baseSrc} alt="Основа" className="absolute inset-0 h-full w-full object-cover" />
      {/* text overlay on top once rendered */}
      {overlayUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={overlayUrl}
          alt="Инфографика"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {!overlayUrl && !textBaked && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-[11px] text-white">
          <Loader2 className="h-3 w-3 animate-spin" />
          Накладываем текст…
        </div>
      )}
    </div>
  );
}
