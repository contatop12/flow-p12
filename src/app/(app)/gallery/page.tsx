import { GalleryClient } from "./GalleryClient";

export default function GalleryPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#18181B] tracking-tight">Galeria</h1>
        <p className="mt-0.5 text-sm text-[#71717A]">Imagens geradas pelo canvas.</p>
      </div>
      <GalleryClient />
    </div>
  );
}
