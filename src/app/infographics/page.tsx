"use client";
import * as React from "react";
import { Loader2, Wand2, Sparkles, ScanLine, RefreshCw, ImagePlus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductForm } from "@/components/generator/product-form";
import { ImageUploader } from "@/components/media/image-uploader";
import { EmptyState } from "@/components/project/empty-state";
import { InfographicCanvas } from "@/components/infographics/infographic-canvas";
import {
  InfographicBriefEditor,
  type BriefEdit,
} from "@/components/infographics/infographic-brief-editor";
import { InfographicExportPanel } from "@/components/infographics/infographic-export-panel";
import { InfographicReferencePicker } from "@/components/infographics/infographic-reference-picker";
import { api } from "@/lib/client-api";
import { toast } from "@/components/ui/toaster";
import { EMPTY_PRODUCT, type ProductInfo } from "@/core/domain/types";
import {
  INFOGRAPHIC_TYPES,
  INFOGRAPHIC_STYLES,
  type InfographicType,
  type InfographicStyle,
  type InfographicInput,
  type InfographicBrief,
  type StyleProfile,
} from "@/core/infographics/types";
import { assembleBrief } from "@/core/infographics/brief-builder";
import { DEFAULT_STYLE_PROFILE } from "@/core/infographics/style-library";

export default function InfographicsPage() {
  const [product, setProduct] = React.useState<ProductInfo>({ ...EMPTY_PRODUCT });
  const [reference, setReference] = React.useState<string | null>(null);
  const [userNote, setUserNote] = React.useState("");
  const [type, setType] = React.useState<InfographicType>("benefits");
  const [style, setStyle] = React.useState<InfographicStyle>("auto");
  const [styleProfile, setStyleProfile] = React.useState<StyleProfile | null>(
    DEFAULT_STYLE_PROFILE,
  );

  const [brief, setBrief] = React.useState<InfographicBrief | null>(null);
  const [baseImageUrl, setBaseImageUrl] = React.useState<string | null>(null);

  const [autofilling, setAutofilling] = React.useState(false);
  const [briefing, setBriefing] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);

  // AI mode shows the model-rendered infographic directly; mock falls back to
  // the canvas overlay so the demo still produces something usable.
  const [imageProvider, setImageProvider] = React.useState<string>("mock");
  React.useEffect(() => {
    api
      .status()
      .then((s) => setImageProvider(s.image))
      .catch(() => {});
  }, []);
  const resultMode: "ai" | "overlay" = imageProvider === "mock" ? "overlay" : "ai";

  const buildInput = (): InfographicInput => ({
    productName: product.name,
    category: product.category,
    targetAudience: product.audience,
    benefits: product.benefits,
    painPoints: product.pains,
    userNote,
    referenceImage: reference ?? undefined,
    type,
    style,
    marketplace: "wildberries",
    aspectRatio: "3:4",
  });

  const handleAutofill = async () => {
    if (!reference) {
      toast.error("Сначала загрузите фото товара.");
      return;
    }
    setAutofilling(true);
    try {
      const r = await api.infographic.autofill({
        imageDataUrl: reference,
        productName: product.name || undefined,
        category: product.category || undefined,
      });
      setProduct((p) => ({
        ...p,
        name: p.name || r.detectedProduct,
        category: p.category || r.suggestedCategory,
        benefits: p.benefits.length ? p.benefits : r.suggestedBenefits,
        pains: p.pains.length ? p.pains : r.suggestedPainPoints,
      }));
      if (r.warnings.length) toast.info(r.warnings[0]);
      else toast.success("Данные заполнены по фото");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось распознать фото");
    } finally {
      setAutofilling(false);
    }
  };

  const handleBrief = async () => {
    if (!product.name.trim()) {
      toast.error("Укажите название товара.");
      return;
    }
    setBriefing(true);
    setBaseImageUrl(null);
    try {
      const b = await api.infographic.brief(buildInput(), styleProfile ?? undefined);
      setBrief(b);
      toast.success("Инфографика собрана — проверьте текст");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось собрать инфографику");
    } finally {
      setBriefing(false);
    }
  };

  // edits rebuild the overlay plan instantly on the client (no tokens)
  const handleBriefEdit = (edit: BriefEdit) => {
    setBrief(assembleBrief(buildInput(), edit, styleProfile ?? undefined));
  };

  const handleGenerate = async () => {
    if (!brief) return;
    setGenerating(true);
    try {
      const r = await api.infographic.generate({
        brief,
        referenceImage: reference ?? undefined,
        aspectRatio: "3:4",
      });
      setBaseImageUrl(r.baseImageUrl);
      setBrief(r.brief);
      toast.success("Изображение готово");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppShell title="Инфографика">
      <div className="grid gap-5 lg:grid-cols-3">
        {/* LEFT — data */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">1. Фото и данные товара</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImageUploader
              value={reference}
              onChange={setReference}
              label="Загрузите фото товара"
              hint="ИИ распознает товар и предложит данные"
            />
            <Button
              onClick={handleAutofill}
              disabled={autofilling || !reference}
              variant="outline"
              className="w-full"
            >
              {autofilling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ScanLine className="h-4 w-4" />
              )}
              Заполнить по фото
            </Button>

            <ProductForm product={product} onChange={(p) => setProduct((s) => ({ ...s, ...p }))} />

            <div className="space-y-1.5">
              <Label htmlFor="note">Дополнительный комментарий</Label>
              <Textarea
                id="note"
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="Необязательно"
                className="min-h-[56px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* CENTER — type/style + brief */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">2. Инфографика</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Что нужно сделать?</Label>
                <Select value={type} onValueChange={(v) => setType(v as InfographicType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INFOGRAPHIC_TYPES.map((t) => (
                      <SelectItem key={t.id} value={t.id} disabled={!t.enabled}>
                        {t.label}
                        {!t.enabled ? " (скоро)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Визуальный стиль</Label>
                <Select value={style} onValueChange={(v) => setStyle(v as InfographicStyle)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INFOGRAPHIC_STYLES.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Стиль референса</Label>
              <InfographicReferencePicker value={styleProfile} onChange={setStyleProfile} />
            </div>

            <Button onClick={handleBrief} disabled={briefing} variant="gradient" className="w-full">
              {briefing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Собрать инфографику
            </Button>

            {brief ? (
              <>
                <InfographicBriefEditor brief={brief} onChange={handleBriefEdit} />
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  variant="gradient"
                  size="lg"
                  className="w-full"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  Сгенерировать изображение
                </Button>
              </>
            ) : (
              <p className="text-center text-xs text-muted-foreground">
                Заполните данные и нажмите «Собрать инфографику» — ИИ предложит заголовок и блоки.
              </p>
            )}
          </CardContent>
        </Card>

        {/* RIGHT — result */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm">3. Результат</CardTitle>
            {baseImageUrl && (
              <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={generating}>
                <RefreshCw className="h-4 w-4" />
                Перегенерировать основу
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {generating ? (
              <div className="flex aspect-[3/4] items-center justify-center rounded-xl border bg-card/60 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
                Генерируем основу…
              </div>
            ) : baseImageUrl && brief ? (
              <InfographicCanvas baseSrc={baseImageUrl} brief={brief} mode={resultMode} />
            ) : (
              <EmptyState
                icon={<ImagePlus className="h-6 w-6" />}
                title="Здесь появится карточка"
                description="Соберите инфографику и нажмите «Сгенерировать изображение»."
              />
            )}

            {baseImageUrl && brief && (
              <InfographicExportPanel baseSrc={baseImageUrl} brief={brief} mode={resultMode} />
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
