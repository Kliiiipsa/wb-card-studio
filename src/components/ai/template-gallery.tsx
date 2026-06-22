"use client";
import { FileText, Trash2 } from "lucide-react";
import type { PromptTemplate } from "@/core/storage/repository";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/project/empty-state";

export function TemplateGallery({
  templates,
  onUse,
  onDelete,
}: {
  templates: PromptTemplate[];
  onUse: (t: PromptTemplate) => void;
  onDelete: (id: string) => void;
}) {
  if (!templates.length) {
    return (
      <EmptyState
        icon={<FileText className="h-6 w-6" />}
        title="Пока нет сохранённых промптов"
        description="Сохраните удачный промпт как шаблон — он появится здесь."
      />
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {templates.map((t) => (
        <Card key={t.id} className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="font-medium">{t.title}</div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(t.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.prompt}</p>
          <div className="mt-3 flex items-center gap-2">
            {t.style && <Badge variant="secondary" className="text-[10px]">{t.style}</Badge>}
            {t.cardType && <Badge variant="secondary" className="text-[10px]">{t.cardType}</Badge>}
            <Button size="sm" variant="outline" className="ml-auto" onClick={() => onUse(t)}>
              Использовать
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
