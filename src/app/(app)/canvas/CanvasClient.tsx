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
import { SaveWorkflowModal } from "@/components/canvas/SaveWorkflowModal";

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
      return {
        preferredProvider: "gpt-image-2",
        aspectRatio: "1:1",
        status: "idle",
      };
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
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveModalError, setSaveModalError] = useState<string | null>(null);

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

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      const ids = new Set(deleted.map((n) => n.id));
      setEdges((eds) => eds.filter((e) => !ids.has(e.source) && !ids.has(e.target)));
      setSelectedNode((s) => (s && ids.has(s.id) ? null : s));
    },
    [setEdges]
  );

  const onDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNode((s) => (s?.id === nodeId ? null : s));
    },
    [setNodes, setEdges]
  );

  const onNodeDataChange = useCallback(
    (id: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data } : n))
      );
      setSelectedNode((sel) => (sel?.id === id ? { ...sel, data } : sel));
    },
    [setNodes]
  );

  const syncOutputNodesWorkflowId = useCallback(
    (id: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.type === "OutputNode" ? { ...n, data: { ...n.data, workflowId: id } } : n
        )
      );
    },
    [setNodes]
  );

  const openSaveDialog = useCallback(() => {
    if (!rfInstance) return;
    setSaveModalError(null);
    setSaveModalOpen(true);
  }, [rfInstance]);

  const performSave = useCallback(
    async (name: string, description: string) => {
      if (!rfInstance) return;
      setIsSaving(true);
      setSaveModalError(null);
      try {
        const graph = rfInstance.toObject();
        const graphJson = JSON.stringify(graph);
        const body = { name, description, graphJson };

        if (workflowId) {
          const res = await fetch(`/api/workflows/${workflowId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!res.ok) {
            const j = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(j.error ?? `HTTP ${res.status}`);
          }
          setWorkflowName(name);
          setWorkflowDescription(description);
          syncOutputNodesWorkflowId(workflowId);
          setSaveModalOpen(false);
        } else {
          const res = await fetch("/api/workflows", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!res.ok) {
            const j = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(j.error ?? `HTTP ${res.status}`);
          }
          const data = (await res.json()) as { id: string };
          setWorkflowId(data.id);
          setWorkflowName(name);
          setWorkflowDescription(description);
          syncOutputNodesWorkflowId(data.id);
          setSaveModalOpen(false);
        }
      } catch (e) {
        setSaveModalError(e instanceof Error ? e.message : "Não foi possível guardar.");
      } finally {
        setIsSaving(false);
      }
    },
    [rfInstance, workflowId, syncOutputNodesWorkflowId]
  );

  const handleLoad = useCallback(async () => {
    const res = await fetch("/api/workflows");
    if (!res.ok) return;
    const data = await res.json() as {
      workflows: Array<{ id: string; name: string; description?: string; graphJson: string }>;
    };
    if (data.workflows.length === 0) return;

    const first = data.workflows[0];
    const graph = JSON.parse(first.graphJson) as { nodes: Node[]; edges: Edge[] };
    setNodes(graph.nodes ?? []);
    setEdges(graph.edges ?? []);
    setWorkflowId(first.id);
    setWorkflowName(first.name ?? "");
    setWorkflowDescription(first.description ?? "");
  }, [setNodes, setEdges]);

  return (
    <div className="flex flex-col h-full">
      <SaveWorkflowModal
        open={saveModalOpen}
        onOpenChange={setSaveModalOpen}
        initialName={workflowName}
        initialDescription={workflowDescription}
        isSaving={isSaving}
        error={saveModalError}
        onConfirm={performSave}
      />
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
            onNodesDelete={onNodesDelete}
            deleteKeyCode={["Backspace", "Delete"]}
            onInit={setRfInstance}
            fitView
            colorMode="dark"
            className="bg-bg"
          >
            <Background color="rgba(255,255,255,0.06)" gap={20} />
            <Controls className="!border !border-white/10 !bg-surface !shadow-none [&_button]:!text-zinc-300" />
            <MiniMap
              className="!border !border-white/10 !bg-surface !shadow-none"
              maskColor="rgba(9,9,11,0.85)"
              nodeColor="#3f3f46"
            />
          </ReactFlow>
        </div>
        <PropertiesPanel
          node={selectedNode}
          onChange={onNodeDataChange}
          onDeleteNode={onDeleteNode}
        />
      </div>
      <ActionBar
        onSave={openSaveDialog}
        onLoad={handleLoad}
        isSaving={isSaving}
        saveDisabled={!rfInstance}
      />
    </div>
  );
}
