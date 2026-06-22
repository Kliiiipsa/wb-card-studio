"use client";
import * as React from "react";
import { Loader2 } from "lucide-react";
import { renderInfographicPreview } from "@/core/infographics/render-card";
import type { InfographicBrief } from "@/core/infographics/types";

/**
 * Result preview.
 *
 * - mode "ai" (default): the model already rendered the full infographic
 *   (title + badges baked in) — show it directly.
 * - mode "overlay": fallback used for the mock provider or if the AI image
 *   fails — compose a canvas overlay over the base image.
 */
export function InfographicCanvas({
  baseSrc,
  brief,
  mode = "ai",
  className,
}: {
  baseSrc?: string | null;
  brief?: InfographicBrief | null;
  mode?: "ai" | "overlay";
  className?: string;
}) {
  const [overlayUrl, setOverlayUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [imgFailed, setImgFailed] = React.useState(false);

  const useOverlay = mode === "overlay" || imgFailed;

  React.useEffect(() => {
    setImgFailed(false);
  }, [baseSrc]);

  React.useEffect(() => {
    let active = true;
    if (!useOverlay || !baseSrc || !brief) {
      setOverlayUrl(null);
      return;
    }
    setLoading(true);
    renderInfographicPreview(baseSrc, brief)
      .then((u) => active && setOverlayUrl(u))
      .catch(() => active && setOverlayUrl(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [useOverlay, baseSrc, brief]);

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

  if (!useOverlay) {
    return (
      <div className={wrapper}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={baseSrc}
          alt="Инфографика"
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={wrapper}>
      {overlayUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={overlayUrl} alt="Инфографика" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          {loading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : "Нет изображения"}
        </div>
      )}
    </div>
  );
}
