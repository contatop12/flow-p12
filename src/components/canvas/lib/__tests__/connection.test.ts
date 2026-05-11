import { describe, it, expect } from "vitest";
import { getHandleType, isValidConnection, EDGE_COLORS } from "../connection";

describe("getHandleType", () => {
  it("extracts text from text-out", () => {
    expect(getHandleType("text-out")).toBe("text");
  });
  it("extracts brand from brand-out", () => {
    expect(getHandleType("brand-out")).toBe("brand");
  });
  it("extracts layout from layout-out", () => {
    expect(getHandleType("layout-out")).toBe("layout");
  });
  it("extracts image from image-out", () => {
    expect(getHandleType("image-out")).toBe("image");
  });
  it("returns null for null input", () => {
    expect(getHandleType(null)).toBeNull();
  });
  it("returns null for unknown prefix", () => {
    expect(getHandleType("unknown-out")).toBeNull();
  });
});

describe("isValidConnection", () => {
  it("allows text-out → text-in", () => {
    expect(isValidConnection({ source: "a", sourceHandle: "text-out", target: "b", targetHandle: "text-in" })).toBe(true);
  });
  it("allows brand-out → brand-in", () => {
    expect(isValidConnection({ source: "a", sourceHandle: "brand-out", target: "b", targetHandle: "brand-in" })).toBe(true);
  });
  it("allows layout-out → layout-in", () => {
    expect(isValidConnection({ source: "a", sourceHandle: "layout-out", target: "b", targetHandle: "layout-in" })).toBe(true);
  });
  it("allows image-out → image-in", () => {
    expect(isValidConnection({ source: "a", sourceHandle: "image-out", target: "b", targetHandle: "image-in" })).toBe(true);
  });
  it("allows image-out → src-in (Edit source input accepts image or layout)", () => {
    expect(isValidConnection({ source: "a", sourceHandle: "image-out", target: "b", targetHandle: "src-in" })).toBe(true);
  });
  it("allows layout-out → src-in", () => {
    expect(isValidConnection({ source: "a", sourceHandle: "layout-out", target: "b", targetHandle: "src-in" })).toBe(true);
  });
  it("blocks brand-out → text-in", () => {
    expect(isValidConnection({ source: "a", sourceHandle: "brand-out", target: "b", targetHandle: "text-in" })).toBe(false);
  });
  it("blocks text-out → brand-in", () => {
    expect(isValidConnection({ source: "a", sourceHandle: "text-out", target: "b", targetHandle: "brand-in" })).toBe(false);
  });
  it("blocks text-out → src-in (src only accepts image/layout)", () => {
    expect(isValidConnection({ source: "a", sourceHandle: "text-out", target: "b", targetHandle: "src-in" })).toBe(false);
  });
  it("blocks when sourceHandle is null", () => {
    expect(isValidConnection({ source: "a", sourceHandle: null, target: "b", targetHandle: "text-in" })).toBe(false);
  });
});

describe("EDGE_COLORS", () => {
  it("has correct color for text", () => {
    expect(EDGE_COLORS.text).toBe("#84cc16");
  });
  it("has correct color for brand", () => {
    expect(EDGE_COLORS.brand).toBe("#a855f7");
  });
  it("has correct color for layout", () => {
    expect(EDGE_COLORS.layout).toBe("#3b82f6");
  });
  it("has correct color for image", () => {
    expect(EDGE_COLORS.image).toBe("#9ca3af");
  });
});
