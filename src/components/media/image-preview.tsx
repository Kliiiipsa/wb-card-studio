"use client";
import { cn } from "@/lib/utils";

export function ImagePreview({
  src,
  alt = "Превью карточки",
  className,
  ratio = "aspect-[3/4]",
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  ratio?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border bg-muted", ratio, className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          Нет изображения
        </div>
      )}
    </div>
  );
}
