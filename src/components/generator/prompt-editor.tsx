"use client";
import * as React from "react";
import { Wand2, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function PromptEditor({
  prompt,
  negativePrompt,
  onPromptChange,
  onNegativeChange,
  onImprove,
  improving,
}: {
  prompt: string;
  negativePrompt: string;
  onPromptChange: (v: string) => void;
  onNegativeChange: (v: string) => void;
  onImprove?: () => void;
  improving?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="prompt">Промпт</Label>
          {onImprove && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onImprove}
              disabled={improving}
            >
              {improving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Улучшить промпт
            </Button>
          )}
        </div>
        <Textarea
          id="prompt"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Опишите желаемую карточку: товар, настроение, акценты…"
          className="min-h-[120px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="negative">Negative prompt</Label>
        <Textarea
          id="negative"
          value={negativePrompt}
          onChange={(e) => onNegativeChange(e.target.value)}
          placeholder="Что исключить из генерации…"
          className="min-h-[64px]"
        />
      </div>
    </div>
  );
}
