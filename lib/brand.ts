export const BRAND = {
  navy: "#0F1F3D",
  orange: "#E87722",
  white: "#FFFFFF",
  wordmark: "BRJ",
} as const;

export type Platform = "instagram" | "facebook" | "linkedin";

export const PLATFORMS: Platform[] = ["instagram", "facebook", "linkedin"];

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
};

export const SIZE: Record<Platform, { width: number; height: number }> = {
  instagram: { width: 1080, height: 1080 },
  facebook: { width: 1080, height: 1080 },
  linkedin: { width: 1080, height: 1350 },
};

export type Treatment = "hero" | "quote" | "stat" | "cta";

export interface Slide {
  headline: string;
  body: string;
  treatment: Treatment;
}

export interface PlatformOutput {
  caption: string;
  hashtags: string[];
  slides: Slide[];
}

export interface Generation {
  id: string;
  url: string;
  title: string;
  author: string | null;
  heroImage: string | null;
  heroImageAlt: string | null;
  excerpt: string | null;
  text: string;
  createdAt: number;
  platforms: Partial<Record<Platform, PlatformOutput>>;
}
