import React from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { MarcheurPicker } from '@/components/crm/MarcheurPicker';
import type { MarcheurForCrm } from '@/hooks/useMarcheursForCrm';
import { useIotFournisseurs } from '@/hooks/iot/useIot';
import { useAddIotPartner, useIotPartnerRows } from '@/hooks/iot/useIotPartnerAdmin';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Fabricant pré-sélectionné (optionnel). */
  defaultFournisseurId?: string | null;
  /** Marcheur pré-sélectionné : le dialogue démarre alors à l'étape fabricant. */
  presetMarcheur?: { user_id: string; prenom: string; nom: string; avatar_url?: string | null } | null;
}

/**
 * Habilite un marcheur de la communauté comme partenaire d'un fabricant de sondes.
 * Même parcours en deux temps que l'ajout d'un membre CRM.
 */
export const AddIotPartnerDialog: React.FC<Props> = ({
  open, onOpenChange, defaultFournisseurId = null, presetMarcheur = null,
}) => {
  const { data: fournisseurs = [] } = useIotFournisseurs();
  const { data: rows = [] } = useIotPartnerRows();
  const add = useAddIotPartner();

  const [picked, setPicked] = React.useState<{ user_id: string; prenom: string; nom: string; avatar_url?: string | null } | null>(presetMarcheur);
  const [fournisseurId, setFournisseurId] = React.useState<string>(defaultFournisseurId ?? '');
  const [actif, setActif] = React.useState(true);

  React.useEffect(() => {
    if (open) {
      setPicked(presetMarcheur);
      setFournisseurId(defaultFournisseurId ?? '');
      setActif(true);
    }
  }, [open, presetMarcheur, defaultFournisseurId]);

  // Marcheurs déjà habilités pour le fabricant choisi (grisés dans le sélecteur).
  const existing = React.useMemo(
    () => new Set(rows.filter((r) => !fournisseurId || r.fournisseur_id === fournisseurId).map((r) => r.user_id)),
    [rows, fournisseurId],
  );

  const submit = () => {
    if (!picked || !fournisseurId) return;
    add.mutate(
      { user_id: picked.user_id, fournisseur_id: fournisseurId, actif },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Habiliter un partenaire</DialogTitle>
          <DialogDescription>
            Sélectionnez un marcheur de la communauté, puis le fabricant de sondes dont il devient partenaire.
          </DialogDescription>
        </DialogHeader>

        {!picked ? (
          <MarcheurPicker
            existingUserIds={existing}
            onPick={(m: MarcheurForCrm) => setPicked(m)}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
              <Avatar className="h-10 w-10">
                {picked.avatar_url && <AvatarImage src={picked.avatar_url} />}
                <AvatarFallback>{`${picked.prenom?.[0] ?? ''}${picked.nom?.[0] ?? ''}`.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{picked.prenom} {picked.nom}</p>
                <p className="text-xs text-muted-foreground">Compte communauté</p>
              </div>
              {!presetMarcheur && (
                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setPicked(null)}>
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Changer
                </Button>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">Fabricant de sondes</Label>
              <Select value={fournisseurId} onValueChange={setFournisseurId}>
                <SelectTrigger><SelectValue placeholder="Choisir un fabricant…" /></SelectTrigger>
                <SelectContent>
                  {fournisseurs.map((f: any) => (
                    <SelectItem key={f.id} value={f.id}>{f.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Accès actif</p>
                <p className="text-xs text-muted-foreground">Ouvre le poste de contrôle et la carte des sondes.</p>
              </div>
              <Switch checked={actif} onCheckedChange={setActif} />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button onClick={submit} disabled={!fournisseurId || add.isPending}>
                {add.isPending ? 'Enregistrement…' : 'Habiliter'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddIotPartnerDialog;
