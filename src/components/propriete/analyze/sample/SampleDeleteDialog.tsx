import React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';
import { strataState } from './strataGlyphs';

/**
 * « Scellé rompu » — confirmation de retrait d'un prélèvement, avec rappel
 * explicite des strates renseignées qui seront perdues.
 */
export const SampleDeleteDialog: React.FC<{
  sample: SoilSample | null;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ sample, onCancel, onConfirm }) => {
  const strata = sample ? strataState(sample) : [];
  const filled = strata.filter((s) => s.done);

  return (
    <AlertDialog open={!!sample} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <AlertDialogContent className="border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] flex items-center justify-center font-serif font-bold shadow-sm">
              {sample?.label}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-[hsl(var(--ds-forest))]/70">
                Rompre le scellé
              </div>
              <AlertDialogTitle className="font-serif text-lg text-[hsl(var(--ds-forest-deep))] truncate">
                {sample?.location?.trim() || `Prélèvement ${sample?.label}`}
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogDescription asChild>
          <div className="space-y-3 text-sm text-[hsl(var(--ds-forest-deep))]/80">
            <p>
              Ce prélèvement sera retiré du carnet, ainsi que son repère sur la carte.
            </p>

            {sample?.lat != null && sample?.lng != null && (
              <p className="text-[11px] text-[hsl(var(--ds-forest))]/60">
                Repère : {sample.lat.toFixed(5)}, {sample.lng.toFixed(5)}
              </p>
            )}

            {filled.length > 0 && (
              <div className="rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-forest))]/8 p-3">
                <div className="flex items-center gap-2 text-[hsl(var(--ds-forest-deep))] font-semibold text-xs">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {filled.length} strate{filled.length > 1 ? 's' : ''} sur 4 seront perdues
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {filled.map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium"
                      style={{ borderColor: s.color, color: s.color }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: s.color }}
                      />
                      {s.label}
                      {s.short ? ` · ${s.short}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AlertDialogDescription>

        <AlertDialogFooter>
          <AlertDialogCancel className="border-[hsl(var(--ds-line))]">Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-[#b4603f] text-white hover:bg-[#9c4f33]"
          >
            Retirer le prélèvement {sample?.label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SampleDeleteDialog;
