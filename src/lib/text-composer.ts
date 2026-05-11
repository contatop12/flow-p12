import type { TextPayload, BrandPayload } from "@/types";

export function composePrompt(text: TextPayload, brand?: BrandPayload): string {
  const parts: string[] = [text.mainPrompt];

  if (brand?.toggles.applyBrandTone && brand.brandTone) {
    parts.push(`Style: ${brand.brandTone}`);
  }
  if (brand?.toggles.applyPalette && brand.palette?.length) {
    parts.push(`Color palette: ${brand.palette.join(", ")}`);
  }
  if (brand?.toggles.applyTypography && brand.typography) {
    parts.push(`Typography: ${brand.typography.primary} (primary), ${brand.typography.secondary} (secondary)`);
  }
  if (text.headline) parts.push(`Headline: "${text.headline}"`);
  if (text.subhead) parts.push(`Subheadline: "${text.subhead}"`);
  if (text.cta) parts.push(`CTA: "${text.cta}"`);

  return parts.join(". ");
}
