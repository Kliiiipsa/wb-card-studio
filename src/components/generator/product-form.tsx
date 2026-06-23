"use client";
import * as React from "react";
import type { ProductInfo } from "@/core/domain/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/**
 * Multiline list field. Keeps its own raw text in local state so the user can
 * freely press Enter (empty lines included) — the parent only receives the
 * cleaned array. Without this, filtering empties on every keystroke made it
 * impossible to start a new line.
 */
export function ListField({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string[];
  onChange: (list: string[]) => void;
}) {
  const [text, setText] = React.useState(value.join("\n"));

  // re-sync when the product is replaced externally (e.g. switching project)
  const joined = value.join("\n");
  React.useEffect(() => {
    setText((prev) => (prev.trim() === joined.trim() ? prev : joined));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined]);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(
            e.target.value
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
          );
        }}
        placeholder={placeholder}
        className="min-h-[88px]"
      />
    </div>
  );
}

export function ProductForm({
  product,
  onChange,
}: {
  product: ProductInfo;
  onChange: (patch: Partial<ProductInfo>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Название товара</Label>
        <Input
          id="name"
          value={product.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Например: Мужской деловой костюм"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category">Категория</Label>
        <Input
          id="category"
          value={product.category}
          onChange={(e) => onChange({ category: e.target.value })}
          placeholder="Одежда"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="audience">Целевая аудитория</Label>
        <Input
          id="audience"
          value={product.audience}
          onChange={(e) => onChange({ audience: e.target.value })}
          placeholder="Мужчины 25–40, офис"
        />
      </div>

      <ListField
        id="benefits"
        label="Преимущества (по одному на строку)"
        placeholder={"Не мнётся\nДышащая ткань\nСидит по фигуре"}
        value={product.benefits}
        onChange={(benefits) => onChange({ benefits })}
      />

      <ListField
        id="pains"
        label="Боли клиента (по одной на строку)"
        placeholder={"Костюмы быстро мнутся\nТрудно подобрать размер"}
        value={product.pains}
        onChange={(pains) => onChange({ pains })}
      />
    </div>
  );
}
