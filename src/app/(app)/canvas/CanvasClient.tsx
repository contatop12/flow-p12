"use client";
import { useCallback, useState } from "react";
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "@/components/canvas/nodes";
import { edgeTypes } from "@/components/canvas/edges";
import { isValidConnection, getHandleType } from "@/components/canvas/lib/connection";
import { NodePalette } from "@/components/canvas/NodePalette";
import { PropertiesPanel } from "@/components/canvas/PropertiesPanel";
import { ActionBar } from "@/components/canvas/ActionBar";

const DEFAULT_NODES: Node[] = [];
const DEFAULT_EDGES: Edge[] = [];

function makeDefaultData(type: string): Record<string, unknown> {
  switch (type) {
    case "TextNode":
      return { mainPrompt: "" };
    case "BrandIDNode":
      return { applyPalette: true, applyTypography: true, applyBrandTone: true, applyArtRefs: false };
    case "ImageLayoutNode":
      return { fidelity: 70, techMode: "auto", controlType: "depth" };
    case "GenerateNode":
      return { preferredProvider: "gpt-image-2", aspectRatio: "1:1", status: "idle" };
    case "OutputNode":
      return {};
    default:
      return {};
  }
}

export function CanvasClient() {
  const [nodes, setNodes, onNodesChange] = useNodesState(DEFAULT_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(DEFAULT_EDGES);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const onConnect = useCallback(
    (params: Connection) => {
      const sourceType = getHandleType(params.sourceHandle ?? null);
      const edge: Edge = {
        ...params,
        type: "typed",
        data: { connectionType: sourceType ?? "image" },
        id: `${params.source}-${params.sourceHandle}-${params.target}-${params.targetHandle}`,
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type =
        e.dataTransfer.getData("application/reactflow") ||
        e.dataTransfer.getData("text/plain");
      if (!type || !rfInstance) return;

      // screenToFlowPosition espera coordenadas de tela (clientX/clientY), não relativas ao wrapper.
      // Ver: https://reactflow.dev/examples/interaction/drag-and-drop
      const position = rfInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: makeDefaultData(type),
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [rfInstance, setNodes]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onNodeDataChange = useCallback(
    (id: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data } : n))
      );
      setSelectedNode((sel) => (sel?.id === id ? { ...sel, data } : sel));
    },
    [setNodes]
  );

  const handleSave = useCallback(async () => {
    if (!rfInstance) return;
    setIsSaving(true);
    try {
      const graph = rfInstance.toObject();
      const body = { name: "Workflow", graphJson: JSON.stringify(graph) };

      if (workflowId) {
        await fetch(`/api/workflows/${workflowId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        const res = await fetch("/api/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const data = await res.json() as { id: string };
          setWorkflowId(data.id);
        }
      }
    } finally {
      setIsSaving(false);
    }
  }, [rfInstance, workflowId]);

  const handleLoad = useCallback(async () => {
    const res = await fetch("/api/workflows");
    if (!res.ok) return;
    const data = await res.json() as { workflows: Array<{ id: string; name: string; graphJson: string }> };
    if (data.workflows.length === 0) return;

    const first = data.workflows[0];
    const graph = JSON.parse(first.graphJson) as { nodes: Node[]; edges: Edge[] };
    setNodes(graph.nodes ?? []);
    setEdges(graph.edges ?? []);
    setWorkflowId(first.id);
  }, [setNodes, setEdges]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 min-h-0">
        <NodePalette />
        <div className="flex-1 relative min-h-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onInit={setRfInstance}
            fitView
            className="bg-[#F5F4F1]"
          >
            <Background color="#E5E2DB" gap={20} />
            <Controls className="!border !border-[#E5E2DB] !shadow-none" />
            <MiniMap className="!border !border-[#E5E2DB] !shadow-none" nodeColor="#E5E2DB" />
          </ReactFlow>
        </div>
        <PropertiesPanel node={selectedNode} onChange={onNodeDataChange} />
      </div>
      <ActionBar onSave={handleSave} onLoad={handleLoad} isSaving={isSaving} />
    </div>
  );
}
