"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";

interface ImageRow {
  id: string;
  workflow_id: string | null;
  r2_key: string;
  pipeline: string | null;
  text_payload_json: string | null;
  created_at: number;
}

interface ApiResponse {
  images: ImageRow[];
  nextCursor: string | null;
}

export function GalleryClient() {
  const [images, setImages] = useState<ImageRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const fetchImages = useCallback(async (cursor?: string) => {
    const url = cursor ? `/api/images?cursor=${cursor}` : "/api/images";
    const res = await fetch(url);
    if (!res.ok) return;
    const data: ApiResponse = await res.json();
    return data;
  }, []);

  useEffect(() => {
    fetchImages().then((data) => {
      if (!data) return;
      setImages(data.images);
      setNextCursor(data.nextCursor);
      setLoading(false);
    });
  }, [fetchImages]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const data = await fetchImages(nextCursor);
    if (data) {
      setImages((prev) => [...prev, ...data.images]);
      setNextCursor(data.nextCursor);
    }
    setLoadingMore(false);
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square bg-surface-2 rounded-xl animate-pulse border border-white/5" />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-dashed border-white/15 p-12 text-center">
        <p className="text-sm text-subtle">Nenhuma imagem gerada ainda.</p>
        <p className="mt-1 text-xs text-subtle">Use o canvas no nó Output para gerar imagens.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img) => {
          const prompt = img.text_payload_json
            ? (JSON.parse(img.text_payload_json) as { mainPrompt?: string }).mainPrompt ?? ""
            : "";
          return (
            <button
              key={img.id}
              type="button"
              onClick={() => setLightbox(img.id)}
              className="group relative aspect-square bg-surface-2 rounded-xl overflow-hidden border border-white/10 hover:ring-2 hover:ring-accent/50 transition-all"
              title={prompt}
            >
              <img
                src={`/api/images/${img.id}/serve`}
                alt={prompt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              {img.pipeline && img.pipeline !== "standard" && (
                <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">
                  {img.pipeline.replace("controlnet-", "")}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {nextCursor && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 text-sm font-medium bg-zinc-100 text-zinc-900 rounded-lg hover:bg-white disabled:opacity-50 transition-colors"
          >
            {loadingMore ? "Carregando..." : "Carregar mais"}
          </button>
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={`/api/images/${lightbox}/serve`}
              alt="Imagem gerada"
              className="max-w-full max-h-[85vh] rounded-xl object-contain border border-white/10"
            />
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 w-9 h-9 bg-surface border border-white/15 rounded-full flex items-center justify-center text-ink hover:bg-surface-2 shadow-md"
              aria-label="Fechar"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
