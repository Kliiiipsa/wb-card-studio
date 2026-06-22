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
import { exportAndDownload, exportAllVariants } from "@/core/export/canvas-export";
import { toast } from "@/components/ui/toaster";

export function ExportPanel({ src }: { src?: string | null }) {
  const [presetId, setPresetId] = React.useState(EXPORT_PRESETS[0].id);
  const [format, setFormat] = React.useState<ExportFormat>("png");
  const [busy, setBusy] = React.useState(false);

  const preset = EXPORT_PRESETS.find((p) => p.id === presetId) ?? EXPORT_PRESETS[0];

  const single = async () => {
    if (!src) return;
    setBusy(true);
    try {
      await exportAndDownload(src, preset, format);
      toast.success("Карточка скачана");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка экспорта");
    } finally {
      setBusy(false);
    }
  };

  const all = async () => {
    if (!src) return;
    setBusy(true);
    try {
      await exportAllVariants(src, EXPORT_PRESETS, format);
      toast.success("Все варианты скачаны");
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
      <Button onClick={single} disabled={!src || busy} className="w-full" variant="gradient">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Скачать карточку
      </Button>
      <Button onClick={all} disabled={!src || busy} className="w-full" variant="outline">
        <Package className="h-4 w-4" />
        Скачать все варианты
      </Button>
    </div>
  );
}
