"use client";
import * as React from "react";
import { Download, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXPORT_PRESETS, type ExportFormat } from "@/core/domain/export-presets";
import { exportInfographicCard } from "@/core/infographics/render-card";
import { exportCard } from "@/core/rendering/export";
import type { InfographicBrief } from "@/core/infographics/types";
import { toast } from "@/components/ui/toaster";

export function InfographicExportPanel({
  baseSrc,
  brief,
  mode = "ai",
}: {
  baseSrc: string;
  brief: InfographicBrief;
  mode?: "ai" | "overlay";
}) {
  const [presetId, setPresetId] = React.useState(EXPORT_PRESETS[0].id);
  const [format, setFormat] = React.useState<ExportFormat>("png");
  const [busy, setBusy] = React.useState(false);
  const preset = EXPORT_PRESETS.find((p) => p.id === presetId) ?? EXPORT_PRESETS[0];

  const run = async (presets: typeof EXPORT_PRESETS) => {
    setBusy(true);
    try {
      for (const p of presets) {
        // AI mode = the model already baked everything in → export image as-is.
        // overlay mode (mock/fallback) = compose canvas overlay.
        // eslint-disable-next-line no-await-in-loop
        if (mode === "overlay") await exportInfographicCard(baseSrc, p, format, brief);
        // eslint-disable-next-line no-await-in-loop
        else await exportCard(baseSrc, p, format, { baseName: "wb-infographic" });
      }
      toast.success(presets.length > 1 ? "Все размеры скачаны" : "Карточка скачана");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка экспорта");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Размер</Label>
          <Select value={presetId} onValueChange={setPresetId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPORT_PRESETS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label} · {p.ratio}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Формат</Label>
          <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="jpg">JPG</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={() => run([preset])} disabled={busy} variant="gradient" className="w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Скачать карточку
      </Button>
      <Button
        onClick={() => run(EXPORT_PRESETS)}
        disabled={busy}
        variant="outline"
        className="w-full"
      >
        <Package className="h-4 w-4" />
        Скачать все размеры
      </Button>
    </div>
  );
}
