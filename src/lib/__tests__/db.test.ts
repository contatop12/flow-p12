import { describe, it, expect } from "vitest";
import { generateId, buildPipelineKey } from "../db";

describe("generateId", () => {
  it("returns a non-empty string", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("returns unique values on each call", () => {
    const ids = Array.from({ length: 10 }, generateId);
    const unique = new Set(ids);
    expect(unique.size).toBe(10);
  });

  it("returns UUID v4 format", () => {
    const id = generateId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });
});

describe("buildPipelineKey", () => {
  it("returns standard for no controlType", () => {
    expect(buildPipelineKey()).toBe("standard");
  });

  it("returns controlnet-canny for canny", () => {
    expect(buildPipelineKey("canny")).toBe("controlnet-canny");
  });

  it("returns controlnet-depth for depth", () => {
    expect(buildPipelineKey("depth")).toBe("controlnet-depth");
  });

  it("covers all four ControlNet types", () => {
    const types = ["canny", "depth", "mlsd", "openpose"] as const;
    types.forEach((t) => {
      expect(buildPipelineKey(t)).toBe(`controlnet-${t}`);
    });
  });
});
