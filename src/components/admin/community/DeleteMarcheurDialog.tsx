import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { invokeAdminFunction } from '@/lib/adminFunctionInvoke';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export interface DeletableMarcheur {
  id: string;
  user_id: string;
  prenom: string | null;
  nom: string | null;
}

interface Props {
  marcheur: DeletableMarcheur | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COUNT_LABELS: Record<string, string> = {
  marche_participations: 'Participations aux marches',
  event_invitations: 'Invitations à des événements',
  event_invitations_by_email: 'Invitations reçues par e-mail',
  event_invited_readers: 'Accès lecteurs à des événements',
  exploration_marcheurs: 'Rattachements à des explorations',
  marcheur_medias: 'Photos et médias',
  marcheur_audio: 'Enregistrements sonores',
  marcheur_textes: 'Textes écrits',
  marcheur_observations: 'Observations du vivant',
  marcheur_species_tags: 'Espèces identifiées',
  marcheur_activity_logs: "Traces d'activité",
  community_profiles: 'Profil de marcheur',
  community_affiliate_links: 'Liens de parrainage',
  quiz_responses: 'Réponses aux quiz',
  exploration_convivialite_photos: 'Photos de convivialité',
  event_testimonies: 'Témoignages',
};

const prettyLabel = (key: string) =>
  COUNT_LABELS[key] || key.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

const invokeCascade = (payload: { user_id: string; dry_run: boolean }) =>
  invokeAdminFunction<any>('admin-delete-user-cascade', payload);

/**
 * Suppression définitive d'un marcheur, en deux temps :
 *  1. l'inventaire — on montre tout ce qui va disparaître (aperçu serveur, rien n'est touché) ;
 *  2. la signature — il faut réécrire le nom du marcheur pour armer le bouton.
 */
const DeleteMarcheurDialog: React.FC<Props> = ({ marcheur, open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'inventory' | 'signature'>('inventory');
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState('');

  const expected = (marcheur?.nom || marcheur?.prenom || '').trim();
  const signatureOk =
    expected.length > 0 && signature.trim().toLowerCase() === expected.toLowerCase();

  const fullName = useMemo(
    () => [marcheur?.prenom, marcheur?.nom].filter(Boolean).join(' ') || 'ce marcheur',
    [marcheur],
  );

  useEffect(() => {
    if (!open || !marcheur) return;
    setStep('inventory');
    setCounts(null);
    setEmail(null);
    setError(null);
    setSignature('');
    setLoadingPreview(true);
    invokeCascade({ user_id: marcheur.user_id, dry_run: true })
      .then((res) => {
        setCounts(res?.counts || {});
        setEmail(res?.email || null);
      })
      .catch((e: any) => setError(e?.message || "Aperçu impossible"))
      .finally(() => setLoadingPreview(false));
  }, [open, marcheur]);

  const rows = useMemo(() => {
    if (!counts) return [];
    return Object.entries(counts)
      .filter(([, v]) => Number(v) > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]));
  }, [counts]);

  const totalRecords = rows.reduce((s, [, v]) => s + Number(v), 0);

  const handleDelete = async () => {
    if (!marcheur || !signatureOk) return;
    setDeleting(true);
    setError(null);
    try {
      await invokeCascade({ user_id: marcheur.user_id, dry_run: false });
      toast.success(`${fullName} et toutes ses données ont été supprimés.`);
      [
        'community-profiles-admin',
        'community-admins-set',
        'admin-marche-participations',
        'orphan-invited-readers',
        'orphan-event-invitations',
        'orphan-marche-participations',
        'orphan-activity-logs',
        'orphan-exploration-marcheurs',
      ].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.message || 'Échec de la suppression');
      toast.error(e?.message || 'Échec de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !deleting && onOpenChange(v)}>
      <DialogContent className="max-w-lg">
        {step === 'inventory' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Supprimer {fullName}
              </DialogTitle>
              <DialogDescription>
                Cette suppression est définitive. Voici tout ce qui disparaîtra avec ce marcheur.
                {email ? ` Compte : ${email}.` : ''}
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
              {loadingPreview ? (
                <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Inventaire en cours…
                </div>
              ) : error ? (
                <p className="p-4 text-sm text-destructive">{error}</p>
              ) : rows.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  Aucun enregistrement associé. Seuls le profil et le compte seront supprimés.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {rows.map(([key, value]) => (
                    <li key={key} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="text-muted-foreground">{prettyLabel(key)}</span>
                      <span className="font-mono font-semibold text-foreground">{value}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {!loadingPreview && !error && rows.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {totalRecords} enregistrement{totalRecords > 1 ? 's' : ''} seront effacés, ainsi que
                le profil et le compte de connexion.
              </p>
            )}

            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                disabled={loadingPreview || !!error}
                onClick={() => setStep('signature')}
              >
                Continuer
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-4 w-4" />
                Confirmer la suppression
              </DialogTitle>
              <DialogDescription>
                Dernière étape. Saisissez «&nbsp;{expected}&nbsp;» pour confirmer la suppression
                définitive de {fullName} et de ses {totalRecords} enregistrement
                {totalRecords > 1 ? 's' : ''}.
              </DialogDescription>
            </DialogHeader>

            <div>
              <Label htmlFor="delete-signature" className="text-xs">
                Nom du marcheur
              </Label>
              <Input
                id="delete-signature"
                autoFocus
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder={expected}
                disabled={deleting}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep('inventory')} disabled={deleting}>
                Retour
              </Button>
              <Button variant="destructive" disabled={!signatureOk || deleting} onClick={handleDelete}>
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Suppression…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-1" /> Supprimer définitivement
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DeleteMarcheurDialog;
