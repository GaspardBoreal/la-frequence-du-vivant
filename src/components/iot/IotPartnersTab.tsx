import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ShieldCheck } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useIotFournisseurs } from '@/hooks/iot/useIot';
import {
  useIotPartnerRows, useRemoveIotPartner, useToggleIotPartner, type IotPartnerRow,
} from '@/hooks/iot/useIotPartnerAdmin';
import AddIotPartnerDialog from './AddIotPartnerDialog';

const ROLE_LABELS: Record<string, string> = {
  marcheur_en_devenir: 'En devenir',
  marcheur: 'Marcheur',
  eclaireur: 'Éclaireur',
  ambassadeur: 'Ambassadeur',
  sentinelle: 'Sentinelle',
};

/** Onglet « Partenaires » : habilitations IoT adossées à la communauté des marcheurs. */
export const IotPartnersTab: React.FC = () => {
  const { data: rows = [], isLoading } = useIotPartnerRows();
  const { data: fournisseurs = [] } = useIotFournisseurs();
  const toggle = useToggleIotPartner();
  const remove = useRemoveIotPartner();

  const [addOpen, setAddOpen] = React.useState(false);
  const [fFilter, setFFilter] = React.useState('all');
  const [sFilter, setSFilter] = React.useState<'all' | 'actif' | 'inactif'>('all');
  const [confirm, setConfirm] = React.useState<IotPartnerRow | null>(null);

  const filtered = rows.filter((r) => {
    if (fFilter !== 'all' && r.fournisseur_id !== fFilter) return false;
    if (sFilter === 'actif' && !r.actif) return false;
    if (sFilter === 'inactif' && r.actif) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <h2 className="text-lg font-semibold">Partenaires · {rows.length}</h2>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select value={fFilter} onValueChange={setFFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les fabricants</SelectItem>
              {fournisseurs.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.nom}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sFilter} onValueChange={(v) => setSFilter(v as typeof sFilter)}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les états</SelectItem>
              <SelectItem value="actif">Actifs</SelectItem>
              <SelectItem value="inactif">Inactifs</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Habiliter un marcheur
          </Button>
        </div>
      </header>

      <p className="text-sm text-muted-foreground">
        Les comptes partenaires sont des marcheurs de la communauté : aucun compte séparé, seule
        l’habilitation au fabricant ouvre le poste de contrôle et la carte des sondes.
      </p>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Chargement…</p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Aucune habilitation partenaire.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Marcheur</th>
                <th className="px-3 py-2 text-left">Fabricant</th>
                <th className="px-3 py-2 text-left">Ajouté le</th>
                <th className="px-3 py-2 text-left">Accès actif</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border/60">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {r.avatar_url && <AvatarImage src={r.avatar_url} />}
                        <AvatarFallback>{`${r.prenom?.[0] ?? '?'}${r.nom?.[0] ?? ''}`.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {r.prenom || r.nom ? `${r.prenom ?? ''} ${r.nom ?? ''}`.trim() : 'Compte sans profil'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[r.ville, ROLE_LABELS[r.role ?? ''] ?? null].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant="outline">{r.fournisseur_nom}</Badge>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <Switch
                      checked={r.actif}
                      onCheckedChange={(v) => toggle.mutate({ id: r.id, actif: v })}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setConfirm(r)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddIotPartnerDialog open={addOpen} onOpenChange={setAddOpen} />

      <AlertDialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer l’habilitation ?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm ? `${confirm.prenom ?? ''} ${confirm.nom ?? ''}`.trim() : ''} perdra l’accès à la
              console {confirm?.fournisseur_nom}. Son compte marcheur reste intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (confirm) remove.mutate(confirm.id); setConfirm(null); }}
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default IotPartnersTab;
