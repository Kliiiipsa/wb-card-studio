/**
 * Wildberries-specific rules used when planning a card. Centralised so the
 * strategy can stay consistent and easy to tune.
 */

/** A short, universal WB quality checklist (shown to the user too). */
export const WB_CHECKLIST: string[] = [
  "Суть товара понятна за 2 секунды",
  "Есть одно главное УТП на первом экране",
  "Заголовок читается на мобильном (крупный, контрастный)",
  "Карточка не перегружена — максимум 1 акцент",
  "Товар крупный и в центре внимания",
  "Единый акцентный цвет для всей серии",
  "Есть элементы доверия (гарантия, состав, сертификаты)",
  "Фон чистый, не отвлекает от товара",
];

/** Max words for a headline depending on the desired text density. */
export const MAX_HEADLINE_WORDS = 5;

/** Reusable WB-safe composition zones (described for the image model). */
export const SAFE_ZONES = {
  topLeftHeadline: "top-left area kept clean for a short headline",
  bottomBadges: "bottom strip kept clean for benefit badges",
  centerProduct: "center reserved for the product, never covered by text",
};

/** Negative-prompt fragments that protect WB card quality. */
export const BASE_NEGATIVE: string[] = [
  "low quality",
  "blurry",
  "cheap design",
  "distorted product",
  "deformed",
  "random text",
  "gibberish text",
  "watermark",
  "extra objects",
  "cluttered background",
  "oversaturated",
];
