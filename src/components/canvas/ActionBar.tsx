"use client";

import { FolderOpen, Save } from "lucide-react";

type ActionBarProps = {
  onSave: () => void;
  onLoad: () => void;
  isSaving: boolean;
};

export function ActionBar({ onSave, onLoad, isSaving }: ActionBarProps) {
  return (
    <div className="h-11 border-t border-white/10 bg-surface flex items-center px-4 gap-2 shrink-0">
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-900 hover:bg-white disabled:opacity-50 transition-colors"
      >
        <Save className="size-3.5" aria-hidden />
        {isSaving ? "Salvando…" : "Salvar"}
      </button>
      <button
        type="button"
        onClick={onLoad}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-white/15 text-muted hover:text-ink hover:bg-surface-2 transition-colors"
      >
        <FolderOpen className="size-3.5" aria-hidden />
        Carregar
      </button>
      <div className="flex-1" />
      <p className="text-[10px] text-subtle">Arraste nós da paleta para o canvas</p>
    </div>
  );
}
