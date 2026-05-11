"use client";

import { useEffect, useId, useRef, useState } from "react";

export type SaveWorkflowModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  initialDescription: string;
  isSaving: boolean;
  error: string | null;
  onConfirm: (name: string, description: string) => void;
};

export function SaveWorkflowModal({
  open,
  onOpenChange,
  initialName,
  initialDescription,
  isSaving,
  error,
  onConfirm,
}: SaveWorkflowModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      setName(initialName);
      setDescription(initialDescription);
    }
    if (!open && el.open) el.close();
  }, [open, initialName, initialDescription]);

  function close() {
    onOpenChange(false);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="fixed inset-0 m-auto w-[min(100vw-1.5rem,26rem)] max-h-[min(90vh,22rem)] rounded-2xl bg-[#18181b] p-0 text-zinc-100 shadow-none ring-1 ring-inset ring-white/[0.08] [&::backdrop]:bg-black/65"
      onClose={() => onOpenChange(false)}
    >
      <form
        method="dialog"
        className="flex flex-col gap-0"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = name.trim();
          if (!trimmed || isSaving) return;
          onConfirm(trimmed, description.trim());
        }}
      >
        <div className="border-b border-white/5 px-4 py-3.5">
          <h2 id={titleId} className="text-sm font-semibold tracking-tight text-zinc-50">
            Guardar workflow
          </h2>
          <p className="mt-1 text-[11px] leading-snug text-zinc-500">
            O grafo fica associado à tua organização na conta em sessão.
          </p>
        </div>

        <div className="space-y-3 px-4 py-4">
          <div className="space-y-1.5">
            <label htmlFor="wf-name" className="text-[11px] font-medium text-zinc-400">
              Nome
            </label>
            <input
              id="wf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              placeholder="Ex.: Campanha verão"
              className="w-full rounded-xl bg-black/35 px-3 py-2.5 text-[13px] text-zinc-100 placeholder:text-zinc-600 outline-none ring-1 ring-inset ring-white/[0.07] focus:ring-white/18"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="wf-desc" className="text-[11px] font-medium text-zinc-400">
              Descrição
            </label>
            <textarea
              id="wf-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Opcional — notas sobre o fluxo"
              className="w-full resize-none rounded-xl bg-black/35 px-3 py-2.5 text-[13px] text-zinc-100 placeholder:text-zinc-600 outline-none ring-1 ring-inset ring-white/[0.07] focus:ring-white/18"
            />
          </div>
          {error && (
            <p className="text-[11px] text-red-400/95" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-white/5 px-4 py-3">
          <button
            type="button"
            onClick={close}
            disabled={isSaving}
            className="rounded-xl px-3 py-2 text-[12px] font-medium text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving || !name.trim()}
            className="rounded-xl bg-zinc-100 px-3.5 py-2 text-[12px] font-medium text-zinc-900 hover:bg-white disabled:opacity-40"
          >
            {isSaving ? "A guardar…" : "Guardar"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
