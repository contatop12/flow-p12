import { describe, it, expect } from "vitest";
import { routeRequest } from "../image-router";
import type { GenerationRequest } from "@/types";

const baseReq: GenerationRequest = {
  nodeId: "n1",
  nodeType: "Generate",
  textPayload: { mainPrompt: "test" },
};

describe("routeRequest — standard pipeline", () => {
  it("uses flux/schnell when no layoutPayload", () => {
    const result = routeRequest(baseReq);
    expect(result.pipeline).toBe("standard");
    expect(result.provider).toBe("fal");
    expect(result.model).toBe("fal-ai/flux/schnell");
  });
  it("sets square_hd image size by default", () => {
    const result = routeRequest(baseReq);
    expect(result.params.image_size).toBe("square_hd");
  });
  it("sets num_images to 1", () => {
    const result = routeRequest(baseReq);
    expect(result.params.num_images).toBe(1);
  });
});

describe("routeRequest — ControlNet pipelines", () => {
  it("uses controlnet-canny for canny controlType", () => {
    const req: GenerationRequest = {
      ...baseReq,
      layoutPayload: { image: "r2-key", fidelity: 80, techMode: "auto", controlType: "canny" },
    };
    const result = routeRequest(req);
    expect(result.pipeline).toBe("controlnet-canny");
    expect(result.model).toBe("fal-ai/controlnet-canny");
  });
  it("uses controlnet-depth for depth controlType", () => {
    const req: GenerationRequest = {
      ...baseReq,
      layoutPayload: { image: "r2-key", fidelity: 50, techMode: "auto", controlType: "depth" },
    };
    const result = routeRequest(req);
    expect(result.pipeline).toBe("controlnet-depth");
    expect(result.model).toBe("fal-ai/controlnet-depth");
  });
  it("maps fidelity 80 → guidance_scale 8", () => {
    const req: GenerationRequest = {
      ...baseReq,
      layoutPayload: { image: "r2-key", fidelity: 80, techMode: "auto", controlType: "canny" },
    };
    const result = routeRequest(req);
    expect(result.params.guidance_scale).toBe(8);
  });
  it("maps fidelity 0 → guidance_scale 0", () => {
    const req: GenerationRequest = {
      ...baseReq,
      layoutPayload: { image: "r2-key", fidelity: 0, techMode: "auto", controlType: "canny" },
    };
    const result = routeRequest(req);
    expect(result.params.guidance_scale).toBe(0);
  });
});
