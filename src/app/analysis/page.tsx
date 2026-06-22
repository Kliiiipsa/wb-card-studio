"use client";
import * as React from "react";
import { ScanSearch, Loader2, Wand2, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "@/components/media/image-uploader";
import { ImagePreview } from "@/components/media/image-preview";
import { GeneratedImageGrid } from "@/components/generator/generated-image-grid";
import { ExportPanel } from "@/components/generator/export-panel";
import { AnalysisReportView } from "@/components/ai/analysis-report";
import { EmptyState } from "@/components/project/empty-state";
import { api } from "@/lib/client-api";
import { toast } from "@/components/ui/toaster";
import { uid } from "@/lib/utils";
import type { AnalysisReport } from "@/core/domain/types";
import type { GeneratedVariant } from "@/store/generator-store";

export default function AnalysisPage() {
  const [image, setImage] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [report, setReport] = React.useState<AnalysisReport | null>(null);

  const [improving, setImproving] = React.useState(false);
  const [variants, setVariants] = React.useState<GeneratedVariant[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const selected = variants.find((v) => v.id === selectedId);

  const analyze = async () => {
    if (!image) {
      toast.error("Загрузите карточку для анализа.");
      return;
    }
    setLoading(true);
    setReport(null);
    setVariants([]);
    try {
      const result = await api.analyze(image, { name, category });
      setReport(result);
      toast.success("Анализ готов");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка анализа");
    } finally {
      setLoading(false);
    }
  };

  const improve = async () => {
    if (!image || !report) return;
    setImproving(true);
    try {
      // build a Russian improvement instruction from the AI's own advice
      const advice = [...report.fixFirst, ...report.visualTips].slice(0, 6).join("; ");
      const prompt = `Улучши эту карточку товара для Wildberries, сохранив сам товар без искажений. ${advice}. Премиальный чистый фон, мягкий студийный свет, аккуратная композиция, место под заголовок.`;
      const cardText = (report.newCardIdeas[0]?.headline || name || "").trim().slice(0, 60) || undefined;

      const result = await api.generateImage({
        prompt,
        referenceImageDataUrl: image,
        strength: 0.45,
        aspectRatio: "3:4",
        count: 1,
        cardText,
      });
      const vs: GeneratedVariant[] = result.images.map((img) => ({
        id: uid("var"),
        url: img.url,
        width: img.width,
        height: img.height,
      }));
      setVariants(vs);
      setSelectedId(vs[0]?.id ?? null);
      toast.success("Улучшенная карточка готова");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка улучшения");
    } finally {
      setImproving(false);
    }
  };

  return (
    <AppShell title="Анализ и улучшение карточки">
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        {/* Input */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Текущая карточка</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUploader
                value={image}
                onChange={setImage}
                label="Загрузите карточку или фото товара"
                hint="Скриншот карточки из выдачи WB или фото товара"
              />
              <div className="space-y-1.5">
                <Label htmlFor="aname">Название товара (необязательно)</Label>
                <Input id="aname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Мужской костюм" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="acat">Категория (необязательно)</Label>
                <Input id="acat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Одежда" />
              </div>
              <Button onClick={analyze} disabled={loading || !image} variant="gradient" className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                Проанализировать
              </Button>

              {report && (
                <Button onClick={improve} disabled={improving} variant="outline" className="w-full">
                  {improving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  Улучшить карточку по советам ИИ
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Improved result */}
          {(improving || variants.length > 0) && (
            <Card>
              <CardHeader className="flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm">Улучшенная карточка</CardTitle>
                {variants.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={improve} disabled={improving}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {improving && variants.length === 0 ? (
                  <div className="flex aspect-[3/4] items-center justify-center rounded-xl border bg-card/60 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
                    ИИ улучшает карточку…
                  </div>
                ) : (
                  <ImagePreview src={selected?.url} />
                )}
                {variants.length > 1 && (
                  <GeneratedImageGrid variants={variants} selectedId={selectedId} onSelect={setSelectedId} />
                )}
                {selected && <ExportPanel src={selected.url} />}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Report */}
        <div>
          {loading ? (
            <div className="flex h-96 flex-col items-center justify-center gap-3 rounded-xl border bg-card/60 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm">ИИ анализирует карточку как маркетплейс-дизайнер…</p>
            </div>
          ) : report ? (
            <AnalysisReportView report={report} />
          ) : (
            <EmptyState
              icon={<ScanSearch className="h-6 w-6" />}
              title="Загрузите карточку для анализа"
              description="ИИ оценит обложку, текст, композицию и доверие, найдёт что мешает покупке и даст конкретный план улучшений. После анализа можно одной кнопкой сгенерировать улучшенную карточку."
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
