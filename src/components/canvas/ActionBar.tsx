"use client";

type ActionBarProps = {
  onSave: () => void;
  onLoad: () => void;
  isSaving: boolean;
};

export function ActionBar({ onSave, onLoad, isSaving }: ActionBarProps) {
  return (
    <div className="h-11 border-t bg-white flex items-center px-4 gap-2 shrink-0">
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="px-3 py-1.5 rounded text-xs font-medium bg-[#18181B] text-white hover:bg-[#27272A] disabled:opacity-50 transition-colors"
      >
        {isSaving ? "Salvando…" : "💾 Salvar"}
      </button>
      <button
        type="button"
        onClick={onLoad}
        className="px-3 py-1.5 rounded text-xs font-medium border border-[#E5E2DB] text-[#52525B] hover:bg-[#F5F4F1] transition-colors"
      >
        📂 Carregar
      </button>
      <div className="flex-1" />
      <p className="text-[10px] text-[#A1A1AA]">Arraste nós da paleta para o canvas</p>
    </div>
  );
}
