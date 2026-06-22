"use client";
import { Loader2 } from "lucide-react";
import type { GenStatus } from "@/store/generator-store";

const LABELS: Record<GenStatus, string> = {
  idle: "",
  building: "Собираем структурный промпт…",
  generating: "Генерируем варианты карточки…",
  scoring: "Оцениваем результат…",
  done: "Готово",
  error: "Ошибка",
};

export function LoadingGenerationState({ status }: { status: GenStatus }) {
  return (
    <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-4 rounded-xl border bg-card/60">
      <div className="relative">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-blue-500 opacity-20 blur-xl" />
        <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-primary" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{LABELS[status]}</p>
      <div className="h-1.5 w-48 overflow-hidden rounded-full bg-secondary">
        <div className="h-full w-1/3 animate-[shimmer_1.5s_infinite] rounded-full bg-gradient-to-r from-primary to-blue-500" />
      </div>
    </div>
  );
}
