import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Loader2, RadioTower } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propriete: { id: string; nom: string } | null;
  onConfirm: () => void;
  deleting: boolean;
}

interface LiaisonCounts {
  marcheurs: number;
  entreprises: number;
  evenements: number;
  sondes: number;
}

const countOf = async (table: string, col: string, id: string): Promise<number> => {
  const { count } = await (supabase.from as any)(table)
    .select('*', { count: 'exact', head: true })
    .eq(col, id);
  return count ?? 0;
};

/**
 * Suppression à double confirmation : inventaire des liaisons affiché,
 * puis saisie du nom exact pour armer le bouton.
 */
const DeleteProprieteDialog: React.FC<Props> = ({ open, onOpenChange, propriete, onConfirm, deleting }) => {
  const [typed, setTyped] = useState('');

  const { data: counts, isLoading } = useQuery<LiaisonCounts>({
    queryKey: ['propriete-delete-counts', propriete?.id],
    enabled: open && !!propriete?.id,
    queryFn: async () => {
      const id = propriete!.id;
      const [marcheurs, entreprises, evenements, sondes] = await Promise.all([
        countOf('propriete_marcheurs', 'propriete_id', id),
        countOf('propriete_companies', 'propriete_id', id),
        countOf('propriete_marche_events', 'propriete_id', id),
        countOf('iot_capteurs', 'propriete_id', id),
      ]);
      return { marcheurs, entreprises, evenements, sondes };
    },
  });

  const armed = !!propriete && typed.trim() === propriete.nom;

  const close = (v: boolean) => {
    if (!v) setTyped('');
    onOpenChange(v);
  };

  return (
    <AlertDialog open={open} onOpenChange={close}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Supprimer « {propriete?.nom} » ?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>Cette action est définitive. La propriété et ses rattachements seront supprimés.</p>

              {isLoading ? (
                <p className="flex items-center gap-2 text-xs">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Inventaire des liaisons…
                </p>
              ) : counts ? (
                <ul className="rounded-lg border border-border bg-muted/40 p-3 text-xs space-y-1">
                  <li>{counts.marcheurs} marcheur{counts.marcheurs > 1 ? 's' : ''} rattaché{counts.marcheurs > 1 ? 's' : ''}</li>
                  <li>{counts.entreprises} entreprise{counts.entreprises > 1 ? 's' : ''} rattachée{counts.entreprises > 1 ? 's' : ''}</li>
                  <li>{counts.evenements} événement{counts.evenements > 1 ? 's' : ''} Marches du Vivant lié{counts.evenements > 1 ? 's' : ''}</li>
                  <li>{counts.sondes} sonde{counts.sondes > 1 ? 's' : ''} IoT rattachée{counts.sondes > 1 ? 's' : ''}</li>
                </ul>
              ) : null}

              {!!counts && counts.sondes > 0 && (
                <p className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                  <RadioTower className="mt-0.5 h-4 w-4 shrink-0" />
                  Des sondes IoT sont rattachées à cette propriété. Détachez-les d'abord depuis la
                  console IoT, sinon elles perdront leur ancrage terrain.
                </p>
              )}

              <div>
                <label className="text-xs font-medium" htmlFor="delete-confirm-name">
                  Pour confirmer, retapez le nom exact : <strong>{propriete?.nom}</strong>
                </label>
                <Input
                  id="delete-confirm-name"
                  className="mt-1.5"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={propriete?.nom}
                  autoComplete="off"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
          <Button variant="destructive" disabled={!armed || deleting} onClick={onConfirm}>
            {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Supprimer définitivement
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteProprieteDialog;
