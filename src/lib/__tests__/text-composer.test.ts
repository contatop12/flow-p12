import { describe, it, expect } from "vitest";
import { composePrompt } from "../text-composer";
import type { TextPayload, BrandPayload } from "@/types";

const baseText: TextPayload = { mainPrompt: "product on white background" };

describe("composePrompt — text only", () => {
  it("returns mainPrompt when no brand or extras", () => {
    expect(composePrompt(baseText)).toBe("product on white background");
  });
  it("appends headline when provided", () => {
    const result = composePrompt({ ...baseText, headline: "Summer Sale" });
    expect(result).toContain("Summer Sale");
    expect(result).toContain("product on white background");
  });
  it("appends subhead when provided", () => {
    const result = composePrompt({ ...baseText, subhead: "50% off" });
    expect(result).toContain("50% off");
  });
  it("appends CTA when provided", () => {
    const result = composePrompt({ ...baseText, cta: "Buy Now" });
    expect(result).toContain("Buy Now");
  });
});

describe("composePrompt — with brand", () => {
  const brand: BrandPayload = {
    clientId: "c1",
    clientName: "Acme",
    toggles: { applyPalette: true, applyTypography: true, applyBrandTone: true, applyArtRefs: false },
    palette: ["#FF0000", "#00FF00"],
    typography: { primary: "Helvetica", secondary: "Georgia" },
    brandTone: "Bold and confident",
  };

  it("includes brand tone when toggle is on", () => {
    const result = composePrompt(baseText, brand);
    expect(result).toContain("Bold and confident");
  });
  it("includes palette when toggle is on", () => {
    const result = composePrompt(baseText, brand);
    expect(result).toContain("#FF0000");
    expect(result).toContain("#00FF00");
  });
  it("includes typography when toggle is on", () => {
    const result = composePrompt(baseText, brand);
    expect(result).toContain("Helvetica");
  });
  it("skips brand tone when toggle is off", () => {
    const result = composePrompt(baseText, { ...brand, toggles: { ...brand.toggles, applyBrandTone: false } });
    expect(result).not.toContain("Bold and confident");
  });
  it("skips palette when toggle is off", () => {
    const result = composePrompt(baseText, { ...brand, toggles: { ...brand.toggles, applyPalette: false } });
    expect(result).not.toContain("#FF0000");
  });
  it("skips typography when toggle is off", () => {
    const result = composePrompt(baseText, { ...brand, toggles: { ...brand.toggles, applyTypography: false } });
    expect(result).not.toContain("Helvetica");
  });
});
