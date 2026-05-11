import { TextNode } from "./TextNode";
import { BrandIDNode } from "./BrandIDNode";
import { ImageLayoutNode } from "./ImageLayoutNode";

export const nodeTypes: Record<string, React.ComponentType<any>> = {
  TextNode,
  BrandIDNode,
  ImageLayoutNode,
};
