import React from 'react';
import { Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  validated: boolean;
  samplesCount: number;
  placedCount: number;
  filled: number;
  total: number;
  savedAt?: string | null;
  onConfirm: () => void;
}

const stamp = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
    : 'aucune écriture pendant cette session';

/**
 * Confirmation explicite de ce qui a été enregistré avant de quitter
 * le mode édition — aucune donnée n'est perdue en sortant.
 */
export const AnalyzeExitRecapDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  validated,
  samplesCount,
  placedCount,
  filled,
  total,
  savedAt,
  onConfirm,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {validated ? 'Étape enregistrée' : 'Vous quittez l’édition'}
        </DialogTitle>
        <DialogDescription>
          {validated
            ? 'Voici ce qui est conservé dans le registre.'
            : 'Rien n’est perdu : tout ce qui suit est déjà enregistré.'}
        </DialogDescription>
      </DialogHeader>

      <ul className="space-y-2 text-sm text-foreground">
        <li className="flex items-center gap-2">
          <Check className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span>
            <strong>{samplesCount}</strong> prélèvement{samplesCount > 1 ? 's' : ''} au registre,
            dont <strong>{placedCount}</strong> géolocalisé{placedCount > 1 ? 's' : ''}
          </span>
        </li>
        <li className="flex items-center gap-2">
          <Check className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span>
            <strong>{filled}</strong> / {total} blocs renseignés
          </span>
        </li>
        <li className="flex items-center gap-2">
          <Check className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span>Dernière écriture : {stamp(savedAt)}</span>
        </li>
      </ul>

      <DialogFooter className="gap-2">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Continuer à saisir
        </Button>
        <Button onClick={onConfirm}>Quitter l’édition</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default AnalyzeExitRecapDialog;
