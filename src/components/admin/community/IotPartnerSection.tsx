import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Radio, Plus, Trash2 } from 'lucide-react';
import {
  useIotPartnerRows, useRemoveIotPartner, useToggleIotPartner,
} from '@/hooks/iot/useIotPartnerAdmin';
import AddIotPartnerDialog from '@/components/iot/AddIotPartnerDialog';

interface Props {
  userId: string;
  prenom?: string | null;
  nom?: string | null;
  avatarUrl?: string | null;
}

/** Habilitations partenaires IoT d'un marcheur, gérées depuis sa fiche communauté. */
export const IotPartnerSection: React.FC<Props> = ({ userId, prenom, nom, avatarUrl }) => {
  const { data: rows = [] } = useIotPartnerRows();
  const toggle = useToggleIotPartner();
  const remove = useRemoveIotPartner();
  const [open, setOpen] = React.useState(false);

  const mine = rows.filter((r) => r.user_id === userId);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Radio className="h-4 w-4 text-emerald-600" />
        <Label className="text-sm font-semibold">Accès partenaire IoT</Label>
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Habiliter
        </Button>
      </div>

      {mine.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Aucune habilitation : ce marcheur n’a pas accès aux consoles fabricants.
        </p>
      ) : (
        <ul className="space-y-2">
          {mine.map((r) => (
            <li key={r.id} className="space-y-2 rounded-lg border border-border p-2.5">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.fournisseur_nom}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.actif ? 'Console ouverte' : 'Accès suspendu'}
                  </p>
                </div>
                <Switch checked={r.actif} onCheckedChange={(v) => toggle.mutate({ id: r.id, actif: v })} />
                <Button variant="ghost" size="sm" onClick={() => remove.mutate(r.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
              <AiCreditControl row={r} />
            </li>
          ))}
        </ul>
      )}

      <AddIotPartnerDialog
        open={open}
        onOpenChange={setOpen}
        presetMarcheur={{
          user_id: userId,
          prenom: prenom ?? '',
          nom: nom ?? '',
          avatar_url: avatarUrl ?? null,
        }}
      />
    </div>
  );
};

export default IotPartnerSection;
