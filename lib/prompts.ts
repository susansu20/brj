import type { Platform } from "./brand";

export interface PromptInput {
  title: string;
  text: string;
  heroImageDescription: string;
}

interface BuiltPrompt {
  system: string;
  user: string;
}

const SCHEMA_NOTE = `
Output ONLY a single JSON object — no markdown fences, no commentary before or after.
Schema:
{
  "caption": string,
  "hashtags": string[],
  "slides": [
    { "headline": string, "body": string, "treatment": "hero" | "quote" | "stat" | "cta" }
  ]
}
Rules for slides:
- Exactly 6 items.
- Slide 1: treatment "hero" — a bold one-line hook.
- Slides 2–5: cover the article's key insights. Vary treatments. Use "quote" for a direct or paraphrased quote, "stat" when the headline is a number or short data point, "hero" for a section heading.
- Slide 6: treatment "cta" — invite the reader to read the full piece or act.
- headline: max ~80 chars, no quotation marks around it.
- body: max ~200 chars, supporting text.
`.trim();

function shared(input: PromptInput): string {
  return [
    `ARTICLE TITLE: ${input.title}`,
    input.heroImageDescription ? `HERO IMAGE: ${input.heroImageDescription}` : "",
    "",
    "ARTICLE BODY:",
    input.text,
  ]
    .filter(Boolean)
    .join("\n");
}

function instagram(input: PromptInput): BuiltPrompt {
  return {
    system: `You are a social editor for BRJ (Building Review Journal), a publication covering commercial construction and real-estate development in the U.S.
You write tight, scroll-stopping Instagram copy for industry pros.
${SCHEMA_NOTE}
Instagram-specific rules:
- caption: ~150 words. First line is a hook. Conversational but credible. End with a question or soft CTA.
- hashtags: exactly 6, relevant and industry-specific (no leading # symbol).`,
    user: shared(input),
  };
}

function facebook(input: PromptInput): BuiltPrompt {
  return {
    system: `You are a social editor for BRJ (Building Review Journal).
You write Facebook posts that work for an audience of contractors, owners, and AEC professionals.
${SCHEMA_NOTE}
Facebook-specific rules:
- caption: ~200 words. Slightly more context than Instagram. Friendly but professional.
- hashtags: exactly 3, no leading # symbol.`,
    user: shared(input),
  };
}

function linkedin(input: PromptInput): BuiltPrompt {
  return {
    system: `You are a B2B editor for BRJ (Building Review Journal) writing for a LinkedIn audience of executives, developers, and AEC professionals.
${SCHEMA_NOTE}
LinkedIn-specific rules:
- caption: 1,200–1,800 characters. NO emoji. Open with a sharp lede, develop 2–3 short paragraphs of insight, close with a takeaway question.
- hashtags: exactly 3, no leading # symbol.`,
    user: shared(input),
  };
}

export function buildPrompt(platform: Platform, input: PromptInput): BuiltPrompt {
  switch (platform) {
    case "instagram":
      return instagram(input);
    case "facebook":
      return facebook(input);
    case "linkedin":
      return linkedin(input);
  }
}
