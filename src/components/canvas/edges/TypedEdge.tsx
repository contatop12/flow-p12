"use client";
import { BaseEdge, getSmoothStepPath, type EdgeProps } from "@xyflow/react";
import type { ConnectionType } from "@/types";
import { EDGE_COLORS } from "../lib/connection";

type TypedEdgeData = { connectionType?: ConnectionType };

export function TypedEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const d = (data ?? {}) as TypedEdgeData;
  const color = EDGE_COLORS[d.connectionType ?? "image"];

  return (
    <BaseEdge
      path={edgePath}
      style={{
        stroke: color,
        strokeWidth: selected ? 2.5 : 1.5,
        opacity: selected ? 1 : 0.75,
      }}
    />
  );
}
