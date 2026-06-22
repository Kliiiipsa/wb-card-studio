import type { CardTypeId } from "@/core/domain/card-types";

/** Per-card-type composition template + a default headline angle. */
export type CardTemplate = {
  goal: string;
  productPlacement: string;
  textZones: string[];
  accentElements: string[];
  /** default Russian message angle when the user provides no headline */
  defaultMessage: (productName: string) => string;
};

const DEFAULT: CardTemplate = {
  goal: "Показать товар выгодно и понятно",
  productPlacement: "product centered, large, occupying ~60% of the frame",
  textZones: ["top-left headline area"],
  accentElements: ["subtle premium glow"],
  defaultMessage: (n) => `${n}: ваш выбор`,
};

export const CARD_TEMPLATES: Partial<Record<CardTypeId, CardTemplate>> = {
  cover: {
    goal: "Зацепить взгляд и донести главное УТП за 2 секунды",
    productPlacement: "hero product centered, large, sharp focus",
    textZones: ["top-left headline area", "small badge zone bottom-left"],
    accentElements: ["soft premium glow", "gentle floor reflection"],
    defaultMessage: (n) => `${n}, который выбирают`,
  },
  benefits: {
    goal: "Показать 3–5 причин купить",
    productPlacement: "product centered with breathing room around it",
    textZones: ["three benefit badge slots along the bottom", "headline top"],
    accentElements: ["clean icon placeholders", "consistent accent color"],
    defaultMessage: () => "Почему стоит выбрать",
  },
  composition: {
    goal: "Закрыть сомнения по качеству материалов",
    productPlacement: "close-up product with visible texture detail",
    textZones: ["callout label zones near materials"],
    accentElements: ["macro texture highlights"],
    defaultMessage: () => "Из чего сделано",
  },
  lifestyle: {
    goal: "Показать товар в реальной жизни и вызвать желание",
    productPlacement: "product naturally placed in a realistic premium scene",
    textZones: ["minimal headline top or bottom"],
    accentElements: ["natural light", "shallow depth of field"],
    defaultMessage: () => "В вашей жизни",
  },
  trust: {
    goal: "Снять страх покупки гарантиями и доказательствами",
    productPlacement: "product with calm, credible surroundings",
    textZones: ["badge row for guarantee/certificates", "headline top"],
    accentElements: ["clean badge placeholders"],
    defaultMessage: () => "Гарантия и доверие",
  },
  premium: {
    goal: "Сделать максимально дорогой визуал",
    productPlacement: "product as a hero on a refined minimal stage",
    textZones: ["single elegant headline zone"],
    accentElements: ["dramatic studio light", "subtle luxury texture"],
    defaultMessage: (n) => `${n} премиум-класса`,
  },
};

export function getTemplate(cardType: string): CardTemplate {
  return CARD_TEMPLATES[cardType as CardTypeId] ?? DEFAULT;
}
