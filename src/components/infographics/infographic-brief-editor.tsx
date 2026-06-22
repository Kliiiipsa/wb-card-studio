"use client";
import * as React from "react";
import { Plus, X, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { uid } from "@/lib/utils";
import type { InfographicBrief, InfographicBlock } from "@/core/infographics/types";

export type BriefEdit = {
  headline: string;
  subheadline?: string;
  blocks: InfographicBlock[];
};

/** Editable preview of the AI brief: headline, subheadline and benefit blocks. */
export function InfographicBriefEditor({
  brief,
  onChange,
}: {
  brief: InfographicBrief;
  onChange: (edit: BriefEdit) => void;
}) {
  const emit = (patch: Partial<BriefEdit>) =>
    onChange({
      headline: brief.headline,
      subheadline: brief.subheadline,
      blocks: brief.blocks,
      ...patch,
    });

  const setBlock = (id: string, title: string) =>
    emit({ blocks: brief.blocks.map((b) => (b.id === id ? { ...b, title } : b)) });

  const removeBlock = (id: string) => emit({ blocks: brief.blocks.filter((b) => b.id !== id) });

  const addBlock = () =>
    emit({ blocks: [...brief.blocks, { id: uid("blk"), title: "", priority: "primary" }] });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Заголовок</Label>
        <Input value={brief.headline} onChange={(e) => emit({ headline: e.target.value })} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Подзаголовок</Label>
        <Input
          value={brief.subheadline ?? ""}
          onChange={(e) => emit({ subheadline: e.target.value })}
          placeholder="Необязательно"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Блоки преимуществ</Label>
        {brief.blocks.map((b) => (
          <div key={b.id} className="flex items-center gap-2">
            <Input
              value={b.title}
              onChange={(e) => setBlock(b.id, e.target.value)}
              placeholder="Короткое преимущество"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeBlock(b.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {brief.blocks.length < 5 && (
          <Button variant="outline" size="sm" onClick={addBlock}>
            <Plus className="h-4 w-4" />
            Добавить блок
          </Button>
        )}
      </div>

      {brief.warnings.length > 0 && (
        <div className="space-y-1 rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-xs text-amber-700">
          {brief.warnings.map((w, i) => (
            <div key={i} className="flex gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {w}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
