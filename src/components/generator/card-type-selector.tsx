"use client";
import { CARD_TYPES, type CardTypeId } from "@/core/domain/card-types";
import { cn } from "@/lib/utils";

export function CardTypeSelector({
  value,
  onChange,
}: {
  value: CardTypeId;
  onChange: (v: CardTypeId) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {CARD_TYPES.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "rounded-lg border p-3 text-left transition-all",
              active
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:border-primary/40 hover:bg-accent/40",
            )}
          >
            <div className="text-sm font-medium leading-tight">{t.title}</div>
            <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{t.description}</div>
          </button>
        );
      })}
    </div>
  );
}
