import type { StyleProfile } from "./types";

/** A library entry = a ready style profile + a gradient preview for the picker. */
export type StyleLibraryItem = StyleProfile & {
  description: string;
  preview: { from: string; to: string; accent: string };
};

/**
 * Built-in reference styles. These act as ready references the user can apply
 * without uploading anything — each captures a distinct marketplace visual
 * language (composition rhythm, palette, card treatment).
 */
export const STYLE_LIBRARY: StyleLibraryItem[] = [
  {
    id: "marketplace-clean",
    name: "Чистый маркетплейс",
    source: "library",
    description: "Светлый фон, читаемые карточки, чёткая структура",
    visualLanguage: "clean modern marketplace look, tidy product-first composition",
    background: "soft light neutral background, subtle gradient",
    lighting: "bright even studio light",
    mode: "light",
    palette: {
      background: "#f4f5f7",
      surface: "rgba(255,255,255,0.9)",
      textPrimary: "#14181f",
      textSecondary: "#566072",
      accent: "#2563eb",
    },
    cardStyle: "marketplace-clean",
    density: "medium",
    radius: 20,
    headlinePosition: "top",
    accentElements: ["clean accent line", "consistent benefit cards"],
    preview: { from: "#eef2f7", to: "#dde5f0", accent: "#2563eb" },
  },
  {
    id: "premium-dark",
    name: "Премиум тёмный",
    source: "library",
    description: "Графитовый фон, дорогой минимализм, тонкие акценты",
    visualLanguage: "premium dark editorial look, expensive minimalism, refined",
    background: "deep graphite gradient background, subtle luxury texture",
    lighting: "dramatic soft studio light, controlled highlights",
    mode: "dark",
    palette: {
      background: "#0e1116",
      surface: "rgba(20,24,32,0.5)",
      textPrimary: "#ffffff",
      textSecondary: "rgba(255,255,255,0.78)",
      accent: "#c9a35c",
    },
    cardStyle: "premium-editorial",
    density: "low",
    radius: 18,
    headlinePosition: "top",
    accentElements: ["thin gold accent line", "lots of negative space"],
    preview: { from: "#1b2030", to: "#0c0f15", accent: "#c9a35c" },
  },
  {
    id: "bright-accent",
    name: "Яркий акцент",
    source: "library",
    description: "Светлый фон, сочный акцент, заметные плашки",
    visualLanguage: "bold vivid commercial look, energetic and confident",
    background: "clean bright background with a vivid accent zone",
    lighting: "punchy directional light",
    mode: "light",
    palette: {
      background: "#fff7f3",
      surface: "rgba(255,255,255,0.92)",
      textPrimary: "#1a1410",
      textSecondary: "#6b5a50",
      accent: "#e1483b",
    },
    cardStyle: "marketplace-clean",
    density: "high",
    radius: 24,
    headlinePosition: "top",
    accentElements: ["vivid accent chips", "strong contrast"],
    preview: { from: "#fff1ea", to: "#ffd9cc", accent: "#e1483b" },
  },
  {
    id: "soft-lifestyle",
    name: "Мягкий лайфстайл",
    source: "library",
    description: "Нежная палитра, мягкие карточки, спокойный ритм",
    visualLanguage: "soft lifestyle aesthetic, gentle and aspirational",
    background: "soft warm pastel neutral background",
    lighting: "soft natural diffused light",
    mode: "light",
    palette: {
      background: "#f6f1ee",
      surface: "rgba(255,255,255,0.8)",
      textPrimary: "#23201d",
      textSecondary: "#6d635c",
      accent: "#bd7e8e",
    },
    cardStyle: "integrated-soft",
    density: "medium",
    radius: 26,
    headlinePosition: "bottom",
    accentElements: ["soft rounded cards", "calm rhythm"],
    preview: { from: "#f3ece8", to: "#e7d8d4", accent: "#bd7e8e" },
  },
];

export function getLibraryStyle(id: string): StyleProfile | null {
  const item = STYLE_LIBRARY.find((s) => s.id === id);
  if (!item) return null;
  // strip preview/description -> plain StyleProfile
  const { preview, description, ...profile } = item;
  void preview;
  void description;
  return profile;
}

export const DEFAULT_STYLE_PROFILE: StyleProfile = getLibraryStyle("marketplace-clean")!;
