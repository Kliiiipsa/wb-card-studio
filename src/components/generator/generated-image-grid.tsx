"use client";
import { cn } from "@/lib/utils";
import type { GeneratedVariant } from "@/store/generator-store";

export function GeneratedImageGrid({
  variants,
  selectedId,
  onSelect,
}: {
  variants: GeneratedVariant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (!variants.length) return null;
  return (
    <div className="grid grid-cols-4 gap-2">
      {variants.map((v) => (
        <button
          key={v.id}
          onClick={() => onSelect(v.id)}
          className={cn(
            "overflow-hidden rounded-lg border transition-all",
            v.id === selectedId
              ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
              : "opacity-80 hover:opacity-100",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={v.url} alt="Вариант" className="aspect-[3/4] w-full object-cover" />
        </button>
      ))}
    </div>
  );
}
