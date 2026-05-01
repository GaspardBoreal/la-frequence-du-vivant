import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Plus, Upload, X, Loader2 } from 'lucide-react';
import { useUploadConvivialitePhotos } from '@/hooks/useConvivialitePhotos';
import { useHeicPreviews } from '@/hooks/useHeicPreviews';

interface Props {
  explorationId: string | undefined;
  userId: string | undefined;
  canUpload: boolean;
}

const stageLabel = (stage: string) => {
  switch (stage) {
    case 'detecting': return 'Analyse…';
    case 'converting-heic': return 'Conversion photo iPhone (HEIC)…';
    case 'compressing': return 'Optimisation…';
    case 'uploading': return 'Envoi…';
    default: return 'Traitement…';
  }
};

const ConvivialiteUploadFAB: React.FC<Props> = ({ explorationId, userId, canUpload }) => {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<{ index: number; total: number; name: string; stage: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { getPreview } = useHeicPreviews(files);
  const { mutate: upload, isPending } = useUploadConvivialitePhotos(
    explorationId,
    userId,
    (p) => setProgress({ index: p.fileIndex + 1, total: p.total, name: p.fileName, stage: p.stage }),
  );

  if (!canUpload) {
    return (
      <div className="fixed bottom-6 right-6 z-[1110] max-w-[260px] text-right pointer-events-none">
        <div className="inline-block px-3 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] text-white/70 italic">
          Réservé aux Ambassadeurs, Sentinelles et organisateurs
        </div>
      </div>
    );
  }

  const onPick = (list: FileList | null) => {
    if (!list) return;
    // Accepte: tout image/* + extensions .heic/.heif (iOS partage parfois en application/octet-stream)
    const arr = Array.from(list).filter((f) => {
      if (f.type.startsWith('image/')) return true;
      const n = f.name.toLowerCase();
      return n.endsWith('.heic') || n.endsWith('.heif');
    });
    setFiles((prev) => [...prev, ...arr].slice(0, 20));
  };

  const handleSubmit = () => {
    if (files.length === 0) return;
    upload(files, {
      onSuccess: () => {
        setFiles([]);
        setProgress(null);
        setOpen(false);
      },
      onSettled: () => setProgress(null),
    });
  };


  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[1110] px-5 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-amber-500 text-white shadow-2xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition flex items-center gap-2 font-medium"
      >
        <Plus className="w-5 h-5" />
        Ajouter un instant
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[1200] flex">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in-0"
            onClick={() => setOpen(false)}
          />
          <div className="relative ml-auto h-full w-full sm:max-w-md bg-background shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-background border-b">
              <h3 className="text-lg font-semibold text-foreground">Partager des instants conviviaux</h3>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-foreground"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-4">
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => { e.preventDefault(); onPick(e.dataTransfer.files); }}
                className="border-2 border-dashed border-emerald-500/30 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500/60 hover:bg-emerald-500/5 transition"
              >
                <Upload className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p className="text-sm text-foreground">Déposez vos photos ici ou cliquez pour parcourir</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  JPG, PNG, WebP, HEIC (iPhone) — jusqu'à 20 photos
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*,.heic,.heif,.HEIC,.HEIF"
                  multiple
                  hidden
                  onChange={(e) => onPick(e.target.files)}
                />
              </div>

              {files.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {files.map((f, i) => {
                    const preview = getPreview(f);
                    const isConverting = preview.status === 'pending' || preview.status === 'converting';
                    const showImage = preview.status === 'ready' && preview.url;
                    const showError = preview.status === 'error';
                    return (
                      <div
                        key={i}
                        className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                      >
                        {showImage && (
                          <img
                            src={preview.url!}
                            alt={f.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {isConverting && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-500/10 animate-pulse">
                            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin mb-1" />
                            <span className="text-[9px] text-emerald-700 dark:text-emerald-300 font-medium">
                              {preview.status === 'converting' ? 'Conversion HEIC…' : 'Préparation…'}
                            </span>
                          </div>
                        )}
                        {showError && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] text-muted-foreground p-1 text-center bg-emerald-500/5">
                            <span className="font-semibold text-emerald-600">HEIC</span>
                            <span className="opacity-70">iPhone</span>
                          </div>
                        )}
                        {preview.isHeic && showImage && (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[8px] font-medium tracking-wide">
                            HEIC
                          </span>
                        )}
                        <button
                          onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                          disabled={isPending}
                          aria-label="Retirer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="text-[11px] text-muted-foreground italic">
                En partageant ces photos, vous attestez avoir l'accord des personnes visibles.
                Les photos iPhone (HEIC) sont converties automatiquement.
              </p>

              {isPending && progress && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-[12px] text-emerald-700 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span className="font-medium">{stageLabel(progress.stage)}</span>
                    <span className="ml-auto opacity-70">{progress.index}/{progress.total}</span>
                  </div>
                  <div className="text-[10px] opacity-70 truncate mt-0.5">{progress.name}</div>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={files.length === 0 || isPending}
                className="w-full"
              >
                {isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traitement en cours…</>
                ) : (
                  <>Publier {files.length > 0 ? `(${files.length})` : ''}</>
                )}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ConvivialiteUploadFAB;
