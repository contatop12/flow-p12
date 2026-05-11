import type { Connection, Edge } from "@xyflow/react";
import type { ConnectionType } from "@/types";

const VALID_TYPES = new Set<string>(["text", "image", "brand", "layout", "output"]);

export function getHandleType(handleId: string | null): ConnectionType | null {
  if (!handleId) return null;
  const prefix = handleId.split("-")[0];
  if (VALID_TYPES.has(prefix)) return prefix as ConnectionType;
  return null;
}

// Target handle → which source types it accepts
const TARGET_ACCEPTS: Record<string, ConnectionType[]> = {
  "text-in": ["text"],
  "brand-in": ["brand"],
  "layout-in": ["layout"],
  "image-in": ["image"],
  "src-in": ["image", "layout"],
};

export function isValidConnection(connection: Edge | Connection): boolean {
  const sourceType = getHandleType(connection.sourceHandle ?? null);
  if (!sourceType) return false;
  const accepted = TARGET_ACCEPTS[connection.targetHandle ?? ""] ?? [];
  return accepted.includes(sourceType);
}

export const EDGE_COLORS: Record<ConnectionType, string> = {
  text: "#84cc16",
  image: "#9ca3af",
  brand: "#a855f7",
  layout: "#3b82f6",
  output: "#18181B",
};
