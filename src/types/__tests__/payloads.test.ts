import { describe, it, expect } from "vitest";
import type {
  BrandPayload,
  LayoutPayload,
  TextPayload,
  ConnectionType,
  NodeType,
  Pipeline,
  ControlType,
  TechMode,
  InjectionRequest,
  RoutingDecision,
  GenerationRequest,
} from "../index";

describe("BrandPayload", () => {
  it("accepts full payload with all toggles and resolved data", () => {
    const payload: BrandPayload = {
      clientId: "client-123",
      clientName: "Padaria do Bairro",
      toggles: {
        applyPalette: true,
        applyTypography: true,
        applyBrandTone: true,
        applyArtRefs: false,
      },
      palette: ["#8B4513", "#F4D03F"],
      typography: { primary: "Bree Serif", secondary: "Inter" },
      brandTone: "rústico e artesanal",
    };
    expect(payload.clientId).toBe("client-123");
    expect(payload.toggles.applyPalette).toBe(true);
    expect(payload.toggles.applyArtRefs).toBe(false);
    expect(payload.palette).toHaveLength(2);
  });

  it("accepts minimal payload without resolved data (pre-execution state)", () => {
    const payload: BrandPayload = {
      clientId: "client-456",
      clientName: "Test Brand",
      toggles: {
        applyPalette: false,
        applyTypography: false,
        applyBrandTone: false,
        applyArtRefs: false,
      },
    };
    expect(payload.palette).toBeUndefined();
    expect(payload.artRefs).toBeUndefined();
  });
});

describe("LayoutPayload", () => {
  it("accepts all valid techMode values", () => {
    const modes: TechMode[] = ["auto", "force_inspiration", "force_strict"];
    const payloads: LayoutPayload[] = modes.map((techMode) => ({
      image: "https://example.com/layout.jpg",
      fidelity: 70,
      techMode,
      controlType: "depth",
    }));
    expect(payloads).toHaveLength(3);
    expect(payloads[0].techMode).toBe("auto");
  });

  it("accepts all valid controlType values", () => {
    const types: ControlType[] = ["canny", "depth", "mlsd", "openpose"];
    expect(types).toHaveLength(4);
  });
});

describe("TextPayload", () => {
  it("accepts full structured copy payload", () => {
    const payload: TextPayload = {
      mainPrompt: "Banner promocional de pizza",
      headline: "Promoção Insana",
      subhead: "Toda pizza pela metade do preço",
      cta: "Peça já no WhatsApp",
      disclaimer: "Válido até 15/05",
    };
    expect(payload.headline).toBe("Promoção Insana");
    expect(payload.composedPrompt).toBeUndefined();
  });

  it("accepts minimal payload with only mainPrompt", () => {
    const payload: TextPayload = { mainPrompt: "Simple banner" };
    expect(payload.cta).toBeUndefined();
    expect(payload.disclaimer).toBeUndefined();
  });
});

describe("ConnectionType", () => {
  it("covers all 5 edge color types", () => {
    const types: ConnectionType[] = ["text", "image", "brand", "layout", "output"];
    expect(types).toHaveLength(5);
  });
});

describe("NodeType", () => {
  it("covers all 11 node types for MVP", () => {
    const types: NodeType[] = [
      "Text", "ImageInput", "BrandID", "ImageLayout",
      "Generate", "Edit", "StyleTransfer", "ConsistencyPack",
      "Upscale", "PromptAgent", "Output",
    ];
    expect(types).toHaveLength(11);
  });
});

describe("Pipeline", () => {
  it("covers standard + all 4 ControlNet variants", () => {
    const pipelines: Pipeline[] = [
      "standard",
      "controlnet-canny",
      "controlnet-depth",
      "controlnet-mlsd",
      "controlnet-openpose",
    ];
    expect(pipelines).toHaveLength(5);
  });
});
