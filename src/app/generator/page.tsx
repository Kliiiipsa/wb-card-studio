"use client";
import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Wand2, Loader2, RefreshCw, Image as ImageIcon, Type } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductForm } from "@/components/generator/product-form";
import { CardTypeSelector } from "@/components/generator/card-type-selector";
import { StyleSelector } from "@/components/generator/style-selector";
import { PromptEditor } from "@/components/generator/prompt-editor";
import { GeneratedImageGrid } from "@/components/generator/generated-image-grid";
import { LoadingGenerationState } from "@/components/generator/loading-generation-state";
import { ExportPanel } from "@/components/generator/export-panel";
import { ImageUploader } from "@/components/media/image-uploader";
import { ImagePreview } from "@/components/media/image-preview";
import { AIRecommendations, type QuickAction } from "@/components/ai/ai-recommendations";
import { ScoreCard } from "@/components/ai/score-card";
import { useGeneratorStore } from "@/store/generator-store";
import { useProjectStore } from "@/store/project-store";
import { useCardGeneration } from "@/hooks/use-card-generation";
import { ASPECT_RATIOS } from "@/core/domain/export-presets";
import { uid } from "@/lib/utils";
import type { CardTypeId } from "@/core/domain/card-types";

function GeneratorInner() {
  const params = useSearchParams();
  const s = useGeneratorStore();
  const project = useProjectStore();
  const { generate, improvePrompt } = useCardGeneration();
  const [improving, setImproving] = React.useState(false);

  // hydrate from query params (e.g. ?type=benefits)
  React.useEffect(() => {
    const type = params.get("type");
    if (type) s.setField("cardType", type as CardTypeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // pull product from active project if present
  React.useEffect(() => {
    if (project.current) s.setProduct(project.current.product);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.current?.id]);

  const busy = s.status === "building" || s.status === "generating" || s.status === "scoring";
  const selected = s.variants.find((v) => v.id === s.selectedVariantId);

  const handleImprove = async () => {
    setImproving(true);
    await improvePrompt();
    setImproving(false);
  };

  const handleGenerate = () => generate({ buildPrompt: !!s.product.name });

  const handleQuickAction = async (action: QuickAction) => {
    const base = s.finalPrompt || s.userPrompt;
    await generate({ promptOverride: `${base}, ${action.modifier}` });
  };

  // latest score lives on the most recent generation in the project store
  const latestScore = project.generations[0]?.score;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card/60 px-4 py-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Как это работает:</span> слева заполните данные товара и
        выберите тип/стиль → в центре напишите пожелание или загрузите фото товара → нажмите «Сгенерировать».
        Текст можно писать по-русски, мы сами переведём его для модели.
      </div>
      <div className="grid gap-5 xl:grid-cols-[340px_1fr_320px]">
      {/* LEFT: inputs */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Данные товара</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm product={s.product} onChange={(p) => s.setProduct(p)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Тип карточки</CardTitle>
          </CardHeader>
          <CardContent>
            <CardTypeSelector value={s.cardType} onChange={(v) => s.setField("cardType", v)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Стиль</CardTitle>
          </CardHeader>
          <CardContent>
            <StyleSelector value={s.style} onChange={(v) => s.setField("style", v)} />
          </CardContent>
        </Card>
      </div>

      {/* CENTER: preview + prompt */}
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <Tabs defaultValue="t2i">
              <TabsList className="mb-4">
                <TabsTrigger value="t2i">
                  <Type className="mr-1.5 h-4 w-4" />
                  По промпту
                </TabsTrigger>
                <TabsTrigger value="i2i">
                  <ImageIcon className="mr-1.5 h-4 w-4" />
                  По фото товара
                </TabsTrigger>
              </TabsList>

              <TabsContent value="t2i" className="mt-0 space-y-4">
                <PromptEditor
                  prompt={s.userPrompt}
                  negativePrompt={s.negativePrompt}
                  onPromptChange={(v) => s.setField("userPrompt", v)}
                  onNegativeChange={(v) => s.setField("negativePrompt", v)}
                  onImprove={handleImprove}
                  improving={improving}
                />
              </TabsContent>

              <TabsContent value="i2i" className="mt-0 space-y-4">
                <ImageUploader
                  value={s.reference?.dataUrl}
                  onChange={(dataUrl) =>
                    s.setReference(
                      dataUrl ? { id: uid("ref"), dataUrl, createdAt: Date.now() } : null,
                    )
                  }
                  label="Загрузите фото товара"
                  hint="Товар сохранится, изменим только фон, свет и композицию"
                />
                {s.reference && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Сохранять товар</Label>
                      <span className="text-xs text-muted-foreground">
                        {Math.round((1 - s.referenceStrength) * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={s.referenceStrength}
                      onValueChange={(v) => s.setField("referenceStrength", v)}
                      min={0.2}
                      max={0.8}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Левее — товар почти не меняется. Правее — больше свободы у ИИ.
                    </p>
                  </div>
                )}
                <PromptEditor
                  prompt={s.userPrompt}
                  negativePrompt={s.negativePrompt}
                  onPromptChange={(v) => s.setField("userPrompt", v)}
                  onNegativeChange={(v) => s.setField("negativePrompt", v)}
                  onImprove={handleImprove}
                  improving={improving}
                />
              </TabsContent>
            </Tabs>

            <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Соотношение сторон</Label>
                <Select value={s.aspectRatio} onValueChange={(v) => s.setField("aspectRatio", v as typeof s.aspectRatio)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleGenerate} disabled={busy} variant="gradient" size="lg">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  Сгенерировать
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview area */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm">Превью карточки</CardTitle>
            {s.variants.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={busy}>
                <RefreshCw className="h-4 w-4" />
                Перегенерировать
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {busy ? (
              <LoadingGenerationState status={s.status} />
            ) : selected ? (
              <ImagePreview src={selected.url} className="mx-auto max-w-sm" />
            ) : (
              <div className="flex aspect-[3/4] max-w-sm mx-auto items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                Здесь появится сгенерированная карточка
              </div>
            )}

            {s.variants.length > 1 && (
              <div className="mx-auto max-w-sm">
                <GeneratedImageGrid
                  variants={s.variants}
                  selectedId={s.selectedVariantId}
                  onSelect={(id) => s.selectVariant(id)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {selected && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Экспорт</CardTitle>
            </CardHeader>
            <CardContent>
              <ExportPanel src={selected.url} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* RIGHT: recommendations + score */}
      <div className="space-y-4">
        <AIRecommendations onQuickAction={handleQuickAction} disabled={busy || s.variants.length === 0} />
        {latestScore && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Оценка карточки</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreCard score={latestScore} />
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </div>
  );
}

export default function GeneratorPage() {
  return (
    <AppShell title="Генератор карточек">
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Загрузка…</div>}>
        <GeneratorInner />
      </Suspense>
    </AppShell>
  );
}
