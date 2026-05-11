import type { CSSProperties } from "react";

/** Estilo alinhado às refs: círculo escuro + anel na cor da ligação. */

const BG = "#161616";

export function handleProps(
  color: string,
  side: "left" | "right",
  top?: string
): CSSProperties {
  const pos =
    top !== undefined
      ? { top, transform: "translateY(-50%)" as const }
      : { top: "50%", transform: "translateY(-50%)" as const };

  return {
    width: 20,
    height: 20,
    background: BG,
    border: `2px solid ${color}`,
    ...(side === "left" ? { left: -9 } : { right: -9 }),
    ...pos,
  };
}

export const HANDLE_COLORS = {
  text: "#84cc16",
  brand: "#a855f7",
  layout: "#3b82f6",
  image: "#71717a",
} as const;
