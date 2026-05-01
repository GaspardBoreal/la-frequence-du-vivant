import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Plus, Upload, X, Loader2 } from 'lucide-react';
import { useUploadConvivialitePhotos } from '@/hooks/useConvivialitePhotos';

interface Props {
  explorationId: string | undefined;
  userId: string | undefined;
  canUpload: boolean;
}

const ConvivialiteUploadFAB: React.FC<Props> = ({ explorationId, userId, canUpload }) => {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate: upload, isPending } = useUploadConvivialitePhotos(explorationId, userId);

  if (!canUpload) {
    return (
      <div className="fixed bottom-6 right-6 z-50 max-w-[260px] text-right pointer-events-none">
        <div className="inline-block px-3 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] text-white/70 italic">
          Réservé aux Ambassadeurs, Sentinelles et organisateurs
        </div>
      </div>
    );
  }

  const onPick = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).filter(f => f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...arr].slice(0, 20));
  };

  const handleSubmit = () => {
    if (files.length === 0) return;
    upload(files, {
      onSuccess: () => {
        setFiles([]);
        setOpen(false);
      },
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-amber-500 text-white shadow-2xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition flex items-center gap-2 font-medium"
      >
        <Plus className="w-5 h-5" />
        Ajouter un instant
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[120] flex">
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
                <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG, WebP — jusqu'à 20 photos</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => onPick(e.target.files)}
                />
              </div>

              {files.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {files.map((f, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-muted-foreground italic">
                En partageant ces photos, vous attestez avoir l'accord des personnes visibles.
              </p>

              <Button
                onClick={handleSubmit}
                disabled={files.length === 0 || isPending}
                className="w-full"
              >
                {isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi en cours…</>
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
