import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, MousePointerClick } from 'lucide-react';
import type { SegmentCandidate } from './WaypointMarker';

interface Props {
  open: boolean;
  candidates: SegmentCandidate[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
  onHover: (idx: number | null) => void;
  onPickOnMap: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  buildLabel: (c: SegmentCandidate) => string;
}

export function WaypointInsertConfirmDialog({
  open,
  candidates,
  selectedIdx,
  onSelect,
  onHover,
  onPickOnMap,
  onConfirm,
  onCancel,
  buildLabel,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-md max-h-[85vh] !flex !flex-col !grid-cols-none !p-0 overflow-hidden !gap-0 !z-[1200]">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Où insérer ce point ?
          </DialogTitle>
          <DialogDescription>
            Survolez une option pour voir ses 2 voisins clignoter sur la carte.
            Si rien ne correspond, choisissez les 2 points vous-même.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-2 min-h-0">
          {candidates.map((c, i) => {
            const isSelected = i === selectedIdx;
            const isSuggested = i === 0;
            return (
              <button
                key={`${c.after_marche_id}-${c.ordre}`}
                type="button"
                onClick={() => onSelect(i)}
                onMouseEnter={() => onHover(i)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(i)}
                onBlur={() => onHover(null)}
                className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 shadow-sm'
                    : 'border-border hover:border-amber-300 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{buildLabel(c)}</span>
                  {isSuggested && (
                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Suggéré
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Détour : {(c.score * 1000).toFixed(0)} m
                </div>
              </button>
            );
          })}

          <button
            type="button"
            onClick={onPickOnMap}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-cyan-400 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-300 text-sm font-medium hover:bg-cyan-100 dark:hover:bg-cyan-950/40 transition"
          >
            <MousePointerClick className="w-4 h-4" />
            Aucune ne correspond — choisir les 2 points sur la carte
          </button>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-background shrink-0 gap-2 sm:gap-2">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={onConfirm} className="bg-amber-600 hover:bg-amber-700 focus-visible:ring-2 focus-visible:ring-amber-400">
            Confirmer l'insertion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
