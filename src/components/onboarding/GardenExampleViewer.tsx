/**
 * Visionneuse plein écran d'un exemple de jardin.
 *
 * Mobile first : l'image occupe l'écran, légende en surimpression,
 * navigation précédent / suivant en bas, fermeture en haut à droite.
 */
import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { GardenExample } from '@/hooks/onboarding/useOnboardingConfig';

interface Props {
  examples: GardenExample[];
  index: number | null;
  onNavigate: (index: number) => void;
  onClose: () => void;
  /** Libellé du type de jardin, affiché en surtitre. */
  typeLabel?: string;
}

export default function GardenExampleViewer({ examples, index, onNavigate, onClose, typeLabel }: Props) {
  const open = index !== null;
  const current = open ? examples[index] : null;
  const total = examples.length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && index! > 0) onNavigate(index! - 1);
      if (e.key === 'ArrowRight' && index! < total - 1) onNavigate(index! + 1);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, index, total, onNavigate, onClose]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="h-[100dvh] w-screen max-w-none gap-0 overflow-hidden border-0 bg-black/95 p-0 sm:h-[92dvh] sm:max-w-4xl sm:rounded-2xl">
        <DialogTitle className="sr-only">
          {current ? `${current.titre} — exemple de jardin` : 'Exemple de jardin'}
        </DialogTitle>

        {current && (
          <div className="relative flex h-full flex-col">
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex min-h-0 flex-1 items-center justify-center p-2">
              <img
                src={current.image_url ?? ''}
                alt={current.image_alt ?? current.titre}
                className="max-h-full max-w-full rounded-lg object-contain"
              />
            </div>

            <div className="shrink-0 space-y-2 bg-gradient-to-t from-black/90 to-black/40 px-4 pb-4 pt-6">
              {typeLabel && (
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-300/80">
                  {typeLabel}
                </p>
              )}
              <h3 className="text-lg font-semibold text-white">{current.titre}</h3>
              {current.sous_titre && <p className="text-sm text-white/70">{current.sous_titre}</p>}
              {current.user_intent && (
                <p className="border-l-2 border-emerald-400/50 pl-3 text-sm italic text-emerald-100/80">
                  « {current.user_intent} »
                </p>
              )}
              {current.image_alt && (
                <p className="text-[11px] leading-relaxed text-white/50">{current.image_alt}</p>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => index! > 0 && onNavigate(index! - 1)}
                  disabled={index === 0}
                  aria-label="Exemple précédent"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10 disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-xs tabular-nums text-white/60">
                  {index! + 1} / {total}
                </span>
                <button
                  onClick={() => index! < total - 1 && onNavigate(index! + 1)}
                  disabled={index === total - 1}
                  aria-label="Exemple suivant"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10 disabled:opacity-30"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
