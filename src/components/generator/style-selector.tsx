"use client";
import { STYLES, type StyleId } from "@/core/domain/styles";
import { cn } from "@/lib/utils";

export function StyleSelector({
  value,
  onChange,
}: {
  value: StyleId;
  onChange: (v: StyleId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {STYLES.map((s) => {
        const active = s.id === value;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            title={s.description}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:border-primary/40 hover:bg-accent/40",
            )}
          >
            {s.title}
          </button>
        );
      })}
    </div>
  );
}
