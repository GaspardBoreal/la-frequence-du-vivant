import React from 'react';
import { Hourglass, Sparkles, ArrowRight, Leaf, HelpCircle } from 'lucide-react';

interface Props {
  recognizedCount: number;
  pendingCount: number;
  hasInatLogin: boolean;
  isLoading: boolean;
  onOpen: () => void;
}

/**
 * Bande douce « Le Seuil du Vivant » — pédagogie inspirante.
 * Toujours affichée (sauf en chargement initial) — change de ton selon l'état :
 *  - login iNat introuvable → invitation à comprendre
 *  - 0 en chemin → célébration
 *  - N en chemin → invitation à faire avancer
 */
export const EnCheminBanner: React.FC<Props> = ({
  recognizedCount,
  pendingCount,
  hasInatLogin,
  isLoading,
  onOpen,
}) => {
  if (isLoading) {
    return <div className="h-12 rounded-xl bg-muted/30 animate-pulse" />;
  }

  // État 1 — pas de compte iNat résolu
  if (!hasInatLogin) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/20 ring-1 ring-border/50 hover:ring-emerald-500/40 transition-all text-left"
      >
        <div className="shrink-0 w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center">
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground leading-tight">
            Comment vos photos sont-elles reconnues&nbsp;?
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Découvrir le Seuil du Vivant — le chemin de l'observation à l'espèce
          </p>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
      </button>
    );
  }

  // État 2 — login OK mais 0 en attente : célébration
  if (pendingCount === 0) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-500/8 ring-1 ring-emerald-500/25 hover:ring-emerald-500/45 transition-all text-left"
      >
        <div className="relative shrink-0 w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <Sparkles className="w-3 h-3 text-emerald-500 absolute -top-0.5 -right-0.5 opacity-80" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground leading-tight">
            <span className="text-emerald-600 dark:text-emerald-400">
              {recognizedCount > 0 ? `Toutes vos obs ont franchi le seuil ✨` : `Aucune obs en chemin`}
            </span>
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Comprendre le Seuil du Vivant
          </p>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
      </button>
    );
  }

  // État 3 — en chemin
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
          <span className="text-emerald-600 dark:text-emerald-400">
            {recognizedCount} reconnue{recognizedCount > 1 ? 's' : ''}
          </span>
          <span className="text-muted-foreground"> · </span>
          <span className="text-amber-600 dark:text-amber-400">
            {pendingCount} en chemin sur iNat
          </span>
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Comprendre le seuil d'identification
        </p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
  );
};
