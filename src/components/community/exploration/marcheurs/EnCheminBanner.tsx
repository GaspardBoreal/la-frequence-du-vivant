import React from 'react';
import { Hourglass, Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  recognizedCount: number;
  pendingCount: number;
  isLoading: boolean;
  onOpen: () => void;
}

/**
 * Bande douce « Le Seuil du Vivant » — pédagogie inspirante, sans changer l'ingestion.
 * S'affiche dès qu'au moins une observation iNat du marcheur n'a pas (encore) franchi
 * le seuil d'identification Grade Recherche.
 */
export const EnCheminBanner: React.FC<Props> = ({
  recognizedCount,
  pendingCount,
  isLoading,
  onOpen,
}) => {
  if (isLoading) {
    return (
      <div className="h-12 rounded-xl bg-muted/30 animate-pulse" />
    );
  }
  if (pendingCount === 0) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/8 via-amber-500/8 to-transparent ring-1 ring-emerald-500/20 hover:ring-emerald-500/40 transition-all text-left"
    >
      <div className="relative shrink-0 w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center">
        <Hourglass className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <Sparkles className="w-3 h-3 text-emerald-500 absolute -top-0.5 -right-0.5 opacity-70" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground leading-tight">
          <span className="text-emerald-600 dark:text-emerald-400">{recognizedCount} reconnue{recognizedCount > 1 ? 's' : ''}</span>
          <span className="text-muted-foreground"> · </span>
          <span className="text-amber-600 dark:text-amber-400">{pendingCount} en chemin sur iNat</span>
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Comprendre le seuil d'identification
        </p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
  );
};
