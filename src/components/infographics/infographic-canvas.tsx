"use client";
import * as React from "react";
import { Loader2 } from "lucide-react";
import { renderInfographicPreview } from "@/core/infographics/render-card";
import type { InfographicBrief } from "@/core/infographics/types";

/**
 * Live preview of the final infographic: base image + cohesive canvas overlay
 * (composition-aware headline + benefit cards). Re-renders whenever the brief
 * changes, so editing updates the preview instantly.
 */
export function InfographicCanvas({
  baseSrc,
  brief,
  className,
}: {
  baseSrc?: string | null;
  brief?: InfographicBrief | null;
  className?: string;
}) {
  const [url, setUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    if (!baseSrc || !brief) {
      setUrl(null);
      return;
    }
    setLoading(true);
    renderInfographicPreview(baseSrc, brief)
      .then((u) => active && setUrl(u))
      .catch(() => active && setUrl(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [baseSrc, brief]);

  return (
    <div
      className={
        "relative aspect-[3/4] overflow-hidden rounded-xl border bg-muted " + (className ?? "")
      }
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Инфографика" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          {loading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : "Нет изображения"}
        </div>
      )}
    </div>
  );
}
