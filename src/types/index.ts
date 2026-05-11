export type ConnectionType = "text" | "image" | "brand" | "layout" | "output";

export type ControlType = "canny" | "depth" | "mlsd" | "openpose";

export type TechMode = "auto" | "force_inspiration" | "force_strict";

export type Pipeline =
  | "standard"
  | "controlnet-canny"
  | "controlnet-depth"
  | "controlnet-mlsd"
  | "controlnet-openpose";

export type NodeType =
  | "Text"
  | "ImageInput"
  | "BrandID"
  | "ImageLayout"
  | "Generate"
  | "Edit"
  | "StyleTransfer"
  | "ConsistencyPack"
  | "Upscale"
  | "PromptAgent"
  | "Output";

export type UserRole = "super_admin" | "admin" | "member";

export type PreferredProvider = "gpt-image-2" | "nano-banana-2" | "luma";

export interface BrandPayload {
  clientId: string;
  clientName: string;
  toggles: {
    applyPalette: boolean;
    applyTypography: boolean;
    applyBrandTone: boolean;
    applyArtRefs: boolean;
  };
  palette?: string[];
  typography?: { primary: string; secondary: string };
  brandTone?: string;
  artRefs?: string[];
}

export interface LayoutPayload {
  image: string;
  /** 0–100 percent fidelity to the reference layout, in steps of 10 */
  fidelity: number;
  techMode: TechMode;
  controlType: ControlType;
}

export interface TextPayload {
  mainPrompt: string;
  headline?: string;
  subhead?: string;
  cta?: string;
  disclaimer?: string;
  composedPrompt?: string;
}

export interface InjectionRequest {
  nodeId: string;
  originalPrompt: string;
  brandPayload?: BrandPayload;
  layoutPayload?: LayoutPayload;
  textPayload: TextPayload;
  nodeType: Extract<NodeType, "Generate" | "Edit" | "StyleTransfer" | "ConsistencyPack" | "Upscale" | "PromptAgent">;
}

export interface RoutingDecision {
  pipeline: Pipeline;
  provider: string;
  model: string;
  params: Record<string, unknown>;
  notes?: string;
}

export interface GenerationRequest {
  nodeId: string;
  nodeType: Extract<
    NodeType,
    "Generate" | "Output" | "Edit" | "StyleTransfer" | "ConsistencyPack" | "Upscale"
  >;
  textPayload: TextPayload;
  brandPayload?: BrandPayload;
  layoutPayload?: LayoutPayload;
  preferredProvider?: PreferredProvider;
  workflowId?: string;
}

export interface Client {
  id: string;
  orgId: string;
  name: string;
  logoR2Key?: string;
  palette?: string[];
  typography?: { primary: string; secondary: string };
  brandTone?: string;
  artRefs?: string[];
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface Workflow {
  id: string;
  orgId: string;
  name: string;
  graphJson: string;
  migratedToV4: boolean;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface GeneratedImage {
  id: string;
  orgId: string;
  workflowId?: string;
  r2Key: string;
  pipeline?: Pipeline;
  textPayloadJson?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  createdBy: string;
}

export interface StructureCacheEntry {
  id: string;
  imageHash: string;
  controlType: ControlType;
  r2Key: string;
  orgId?: string;
  createdAt: number;
  lastUsedAt: number;
}
