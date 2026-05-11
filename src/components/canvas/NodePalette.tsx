// src/components/canvas/NodePalette.tsx
"use client";

const PALETTE_CATEGORIES = [
  {
    label: "Dados",
    items: [
      { type: "TextNode",        icon: "💬", label: "Text" },
      { type: "BrandIDNode",     icon: "🎨", label: "Brand ID" },
      { type: "ImageLayoutNode", icon: "📐", label: "Image-Layout" },
    ],
  },
  {
    label: "Geração",
    items: [
      { type: "GenerateNode", icon: "✨", label: "Generate" },
    ],
  },
  {
    label: "Output",
    items: [
      { type: "OutputNode", icon: "📤", label: "Output" },
    ],
  },
];

export function NodePalette() {
  function onDragStart(e: React.DragEvent, nodeType: string) {
    e.dataTransfer.setData("application/reactflow", nodeType);
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <aside className="w-[200px] shrink-0 border-r bg-white overflow-y-auto flex flex-col">
      <div className="px-3 py-2.5 border-b">
        <p className="text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-widest">Nós</p>
      </div>
      <div className="flex flex-col gap-0 py-2">
        {PALETTE_CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <p className="px-3 py-1.5 text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-widest">
              {cat.label}
            </p>
            {cat.items.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => onDragStart(e, item.type)}
                className="mx-2 mb-0.5 flex items-center gap-2 px-2 py-1.5 rounded cursor-grab hover:bg-[#F5F4F1] active:cursor-grabbing select-none"
              >
                <span className="text-sm">{item.icon}</span>
                <span className="text-xs text-[#52525B]">{item.label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}
