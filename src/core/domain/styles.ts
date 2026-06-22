export type StyleId =
  | "premium-minimal"
  | "luxury-dark"
  | "clean-marketplace"
  | "soft-lifestyle"
  | "bold-commercial"
  | "beauty-premium"
  | "tech-style"
  | "fashion-editorial"
  | "kids-friendly"
  | "home-cozy"
  | "sport-energetic";

export interface CardStyle {
  id: StyleId;
  title: string;
  description: string;
  /** descriptors injected into the structured prompt (visual style + palette + lighting) */
  visual: string;
  palette: string;
  lighting: string;
}

export const STYLES: CardStyle[] = [
  {
    id: "premium-minimal",
    title: "Premium minimal",
    description: "Дорогой минимализм, много воздуха",
    visual: "expensive minimalism, clean editorial, lots of negative space",
    palette: "white, light grey, graphite, single restrained accent",
    lighting: "soft even studio light, gentle realistic shadows",
  },
  {
    id: "luxury-dark",
    title: "Luxury dark",
    description: "Графитовый фон, премиальный свет",
    visual: "luxury dark catalog look, subtle texture, refined lines",
    palette: "deep graphite, black, white, deep blue or gold accent",
    lighting: "dramatic soft studio light, controlled highlights",
  },
  {
    id: "clean-marketplace",
    title: "Clean marketplace",
    description: "Чистый универсальный маркетплейс-стиль",
    visual: "clean ecommerce marketplace style, product-first, tidy",
    palette: "white, light grey, blue accent",
    lighting: "bright neutral studio light",
  },
  {
    id: "soft-lifestyle",
    title: "Soft lifestyle",
    description: "Мягкий жизненный контекст",
    visual: "soft lifestyle, natural environment, aspirational warmth",
    palette: "warm neutrals, beige, soft pastel accent",
    lighting: "soft natural daylight, gentle shadows",
  },
  {
    id: "bold-commercial",
    title: "Bold commercial",
    description: "Яркая продающая реклама",
    visual: "bold commercial advertising, strong contrast, confident",
    palette: "high-contrast base with one vivid accent",
    lighting: "punchy directional light",
  },
  {
    id: "beauty-premium",
    title: "Beauty premium",
    description: "Косметика и уход, премиум",
    visual: "premium beauty aesthetic, glossy clean surfaces, elegant",
    palette: "soft nude, rose, champagne, white",
    lighting: "soft beauty light, delicate reflections",
  },
  {
    id: "tech-style",
    title: "Tech style",
    description: "Техника и гаджеты",
    visual: "modern tech aesthetic, sleek surfaces, precise geometry",
    palette: "graphite, silver, electric blue accent",
    lighting: "crisp studio light with sharp highlights",
  },
  {
    id: "fashion-editorial",
    title: "Fashion editorial",
    description: "Модный редакторский стиль",
    visual: "fashion editorial, magazine quality, stylish composition",
    palette: "muted sophisticated tones, one statement accent",
    lighting: "editorial directional light, elegant shadows",
  },
  {
    id: "kids-friendly",
    title: "Kids friendly",
    description: "Детские товары, дружелюбно",
    visual: "friendly kids style, playful but clean, safe and tidy",
    palette: "soft bright cheerful pastels",
    lighting: "bright soft light, happy mood",
  },
  {
    id: "home-cozy",
    title: "Home cozy",
    description: "Товары для дома, уют",
    visual: "cozy home interior context, warm and inviting, tidy",
    palette: "warm neutrals, wood tones, soft accent",
    lighting: "warm soft ambient light",
  },
  {
    id: "sport-energetic",
    title: "Sport energetic",
    description: "Спорт и активность, энергия",
    visual: "energetic sport aesthetic, dynamic, motivating",
    palette: "bold dark base with energetic accent",
    lighting: "high-energy contrasty light",
  },
];

export const STYLE_MAP: Record<StyleId, CardStyle> = Object.fromEntries(
  STYLES.map((s) => [s.id, s]),
) as Record<StyleId, CardStyle>;
