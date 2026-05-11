import type { GenerationRequest, RoutingDecision, Pipeline } from "@/types";
import { buildPipelineKey } from "./db";

export function routeRequest(request: GenerationRequest): RoutingDecision {
  const pipeline: Pipeline = request.layoutPayload
    ? buildPipelineKey(request.layoutPayload.controlType)
    : "standard";

  if (pipeline === "standard") {
    return {
      pipeline,
      provider: "fal",
      model: "fal-ai/flux/schnell",
      params: { image_size: "square_hd", num_images: 1 },
    };
  }

  const controlType = request.layoutPayload!.controlType;
  const guidanceScale = Math.round(request.layoutPayload!.fidelity / 10);
  return {
    pipeline,
    provider: "fal",
    model: `fal-ai/controlnet-${controlType}`,
    params: { image_size: "square_hd", num_images: 1, guidance_scale: guidanceScale },
  };
}
