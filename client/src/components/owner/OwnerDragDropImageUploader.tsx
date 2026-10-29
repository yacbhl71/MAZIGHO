import { useState, useRef } from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Star,
  GripVertical,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Plus,
  Link as LinkIcon,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export interface OwnerDragDropImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  onUploadFile: (file: File) => Promise<string | void>;
  isUploading?: boolean;
  maxFiles?: number;
  label?: string;
  description?: string;
}

export default function OwnerDragDropImageUploader({
  images,
  onChange,
  onUploadFile,
  isUploading = false,
  maxFiles = 10,
  label = "Images du produit",
  description = "Glissez-déposez vos fichiers images directement ici, ou parcourez votre ordinateur. Réordonnez-les ensuite par glisser-déposer (la première image sera la couverture).",
}: OwnerDragDropImageUploaderProps) {
  const [isDragOverDropzone, setIsDragOverDropzone] = useState(false);
  const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);
  const [dragOverCardIndex, setDragOverCardIndex] = useState<number | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [uploadQueueCount, setUploadQueueCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle files dropped into the main upload zone
  const handleFiles = async (files: FileList | File[]) => {
    const validImageFiles = Array.from(files).filter(file => ["image/png", "image/jpeg", "image/webp"].includes(file.type));
    if (validImageFiles.length === 0) {
      toast.error("Veuillez sélectionner des fichiers image valides (PNG, JPG ou WEBP).");
      return;
    }

    if (images.length + validImageFiles.length > maxFiles) {
      toast.warning(`Limite maximale de ${maxFiles} images atteinte. Seules les premières ont été prises en compte.`);
    }

    const filesToUpload = validImageFiles.slice(0, Math.max(0, maxFiles - images.length));
    setUploadQueueCount(filesToUpload.length);

    let successCount = 0;
    let nextImages = [...images];
    for (const file of filesToUpload) {
      try {
        const uploadedUrl = await onUploadFile(file);
        if (uploadedUrl && typeof uploadedUrl === "string") {
          nextImages = [...nextImages, uploadedUrl];
          onChange(nextImages);
        }
        successCount++;
      } catch (err: any) {
        toast.error(`Erreur lors du téléversement de « ${file.name} » : ${err?.message || "Échec"}`);
      } finally {
        setUploadQueueCount(prev => Math.max(0, prev - 1));
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} image${successCount > 1 ? "s" : ""} ajoutée${successCount > 1 ? "s" : ""} avec succès !`);
    }
  };

  const handleDropzoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverDropzone(true);
  };

  const handleDropzoneDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverDropzone(false);
  };

  const handleDropzoneDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverDropzone(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  // Reorder thumbnails via Drag & Drop (Shopify style)
  const handleCardDragStart = (index: number) => {
    setDraggedCardIndex(index);
  };

  const handleCardDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedCardIndex === null || draggedCardIndex === index) return;
    setDragOverCardIndex(index);
  };

  const handleCardDrop = (index: number) => {
    if (draggedCardIndex === null || draggedCardIndex === index) {
      setDraggedCardIndex(null);
      setDragOverCardIndex(null);
      return;
    }
    const updated = [...images];
    const [moved] = updated.splice(draggedCardIndex, 1);
    updated.splice(index, 0, moved!);
    onChange(updated);
    setDraggedCardIndex(null);
    setDragOverCardIndex(null);
    toast.info(index === 0 ? "Cette photo est devenue l’image de couverture principale !" : `Image déplacée en position ${index + 1}.`);
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= images.length) return;
    const updated = [...images];
    const [moved] = updated.splice(index, 1);
    updated.splice(nextIndex, 0, moved!);
    onChange(updated);
  };

  const setAsCover = (index: number) => {
    if (index === 0) return;
    const updated = [...images];
    const [selected] = updated.splice(index, 1);
    updated.unshift(selected!);
    onChange(updated);
    toast.success("Image définie comme couverture principale !");
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
    toast.info("Image retirée de la galerie.");
  };

  const handleAddUrl = () => {
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("https://")) {
      toast.error("Veuillez saisir une URL d'image valide commençant par https://");
      return;
    }
    onChange([...images, trimmed]);
    setUrlDraft("");
    setShowUrlInput(false);
    toast.success("Image ajoutée depuis l'URL !");
  };

  return (
    <section className="space-y-4 rounded-2xl border border-teal-200 bg-teal-50/40 p-5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-teal-950">
            <ImageIcon className="h-5 w-5 text-teal-700" /> {label}
          </h3>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-teal-900">{description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="border-teal-300 bg-white text-teal-800 font-semibold text-xs">
            {images.length} / {maxFiles} images
          </Badge>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-xs text-teal-800 hover:bg-teal-100"
          >
            <LinkIcon className="mr-1 h-3.5 w-3.5" />
            {showUrlInput ? "Masquer l’URL" : "Ajouter par URL"}
          </Button>
        </div>
      </div>

      {/* URL Input Form (Optional fallback) */}
      {showUrlInput && (
        <div className="flex gap-2 rounded-xl border border-teal-200 bg-white p-3">
          <input
            type="url"
            value={urlDraft}
            onChange={e => setUrlDraft(e.target.value)}
            placeholder="https://images.example.com/photo.jpg"
            className="flex-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <Button type="button" size="sm" onClick={handleAddUrl} className="bg-teal-700 hover:bg-teal-800 text-xs">
            <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter l’URL
          </Button>
        </div>
      )}

      {/* SHOPIFY-STYLE DRAG & DROP FILE ZONE */}
      <div
        onDragOver={handleDropzoneDragOver}
        onDragLeave={handleDropzoneDragLeave}
        onDrop={handleDropzoneDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 text-center transition cursor-pointer ${
          isDragOverDropzone
            ? "border-teal-600 bg-teal-100/70 ring-4 ring-teal-400/40 scale-[0.99]"
            : "border-teal-300 bg-white/80 hover:border-teal-500 hover:bg-white"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={async e => {
            if (e.target.files && e.target.files.length > 0) {
              await handleFiles(e.target.files);
            }
            e.target.value = "";
          }}
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-800 transition group-hover:scale-110 group-hover:bg-teal-700 group-hover:text-white">
          {isUploading || uploadQueueCount > 0 ? (
            <Loader2 className="h-6 w-6 animate-spin text-teal-700" />
          ) : (
            <UploadCloud className="h-6 w-6" />
          )}
        </div>

        <p className="mt-3 text-sm font-bold text-slate-900">
          {isUploading || uploadQueueCount > 0
            ? `Téléversement en cours (${uploadQueueCount} image${uploadQueueCount > 1 ? "s" : ""} restante${uploadQueueCount > 1 ? "s" : ""})…`
            : "Glissez-déposez vos images ici (PNG, JPG, WEBP, AVIF)"}
        </p>
        <p className="mt-1 text-xs text-slate-500">ou cliquez n’importe où pour sélectionner des fichiers sur votre appareil</p>
      </div>

      {/* DRAGGABLE & REORDERABLE IMAGE GALLERY (SHOPIFY STYLE) */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 px-1">
            <span className="font-semibold text-slate-900">Galerie de photos (glissez pour réorganiser) :</span>
            <span className="text-[11px] text-teal-800">
              💡 La 1ère photo à gauche sera affichée en tant qu’<strong>image principale</strong>.
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {images.map((imageUrl, index) => {
              const isCover = index === 0;
              const isCardDragging = draggedCardIndex === index;
              const isCardOver = dragOverCardIndex === index;

              return (
                <div
                  key={`${imageUrl}-${index}`}
                  draggable
                  onDragStart={() => handleCardDragStart(index)}
                  onDragOver={e => handleCardDragOver(e, index)}
                  onDrop={() => handleCardDrop(index)}
                  className={`group relative overflow-hidden rounded-xl border bg-white shadow-sm transition cursor-grab active:cursor-grabbing ${
                    isCardDragging
                      ? "opacity-40 scale-95 border-teal-500"
                      : isCardOver
                      ? "border-teal-600 bg-teal-50 ring-2 ring-teal-500"
                      : isCover
                      ? "border-amber-400 ring-2 ring-amber-300/60"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Grip Icon */}
                  <div className="absolute top-2 left-2 z-10 rounded-md bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition shadow">
                    <GripVertical className="h-3.5 w-3.5" />
                  </div>

                  {/* Cover Badge */}
                  {isCover && (
                    <Badge className="absolute top-2 right-2 z-10 border-0 bg-amber-500 text-slate-950 font-bold text-[10px] shadow">
                      <Star className="mr-1 h-3 w-3 fill-current" /> Couverture
                    </Badge>
                  )}

                  {/* Thumbnail Image */}
                  <div className="aspect-square bg-slate-100 overflow-hidden relative">
                    <img
                      src={imageUrl}
                      alt={`Photo ${index + 1}`}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Card Controls Footer */}
                  <div className="flex items-center justify-between p-2 bg-white text-xs border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500">#{index + 1}</span>

                    <div className="flex items-center gap-1">
                      {/* Move buttons for mobile / accessibility */}
                      <button
                        type="button"
                        onClick={() => moveImage(index, -1)}
                        disabled={index === 0}
                        title="Déplacer vers la gauche"
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(index, 1)}
                        disabled={index === images.length - 1}
                        title="Déplacer vers la droite"
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>

                      {/* Set as cover action */}
                      {!isCover && (
                        <button
                          type="button"
                          onClick={() => setAsCover(index)}
                          title="Définir comme couverture principale"
                          className="rounded p-1 text-amber-600 hover:bg-amber-50 font-medium text-[11px]"
                        >
                          <Star className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Remove action */}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        title="Retirer cette image"
                        className="rounded p-1 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
