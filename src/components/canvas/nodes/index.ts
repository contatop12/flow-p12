import { TextNode } from "./TextNode";
import { BrandIDNode } from "./BrandIDNode";
import { ImageLayoutNode } from "./ImageLayoutNode";
import { GenerateNode } from "./GenerateNode";
import { OutputNode } from "./OutputNode";

export const nodeTypes: Record<string, React.ComponentType<any>> = {
  TextNode,
  BrandIDNode,
  ImageLayoutNode,
  GenerateNode,
  OutputNode,
};
