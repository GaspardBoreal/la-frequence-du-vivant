import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { ShieldCheck, ShieldOff, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/** Adresse du compte fondateur, seul habilité à nommer ou retirer un administrateur. */
export const FOUNDER_EMAIL = 'gaspard.boreal@gmail.com';

export interface AdminTarget {
  user_id: string;
  prenom: string | null;
  nom: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: AdminTarget | null;
  mode: 'grant' | 'revoke';
  onDone: () => void;
}

const GrantAdminDialog: React.FC<Props> = ({ open, onOpenChange, target, mode, onDone }) => {
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setConfirmText('');
      setBusy(false);
    }
  }, [open, target?.user_id, mode]);

  if (!target) return null;

  const fullName = [target.prenom, target.nom].filter(Boolean).join(' ') || 'ce marcheur';
  const expected = (target.nom || '').trim().toLowerCase();
  const matches = expected.length > 0 && confirmText.trim().toLowerCase() === expected;
  const isGrant = mode === 'grant';

  const run = async () => {
    setBusy(true);
    try {
      const { data, error } = await (supabase as any).rpc(
        isGrant ? 'grant_admin_access' : 'revoke_admin_access',
        { _user_id: target.user_id },
      );
      if (error) throw error;
      const result = data as { ok?: boolean; message?: string } | null;
      if (!result?.ok) {
        toast.error(result?.message || "L'opération a été refusée.");
        setBusy(false);
        return;
      }
      toast.success(result.message || 'Opération effectuée.');
      onDone();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "L'opération a échoué.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isGrant ? <ShieldCheck className="h-5 w-5 text-primary" /> : <ShieldOff className="h-5 w-5 text-destructive" />}
            {isGrant ? 'Nommer administratrice · administrateur' : "Retirer l'accès administrateur"}
          </DialogTitle>
          <DialogDescription>
            {isGrant ? (
              <>
                <strong className="text-foreground">{fullName}</strong> obtiendra un accès complet à
                l'espace d'administration.
              </>
            ) : (
              <>
                <strong className="text-foreground">{fullName}</strong> perdra immédiatement l'accès à
                l'espace d'administration.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {isGrant && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm space-y-1.5">
            <p className="flex items-center gap-2 font-medium text-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Ce que cet accès permet
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Voir toutes les pages d'administration et les données personnelles des marcheurs</li>
              <li>Modifier ou supprimer définitivement des comptes et leurs contributions</li>
              <li>Publier des pages et envoyer des lettres d'information</li>
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="confirm-admin-name">
            Pour confirmer, saisissez le nom de famille : <strong>{target.nom || '—'}</strong>
          </Label>
          <Input
            id="confirm-admin-name"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={target.nom || ''}
            autoComplete="off"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Annuler
          </Button>
          <Button
            variant={isGrant ? 'default' : 'destructive'}
            disabled={!matches || busy}
            onClick={run}
          >
            {busy ? 'En cours…' : isGrant ? "Accorder l'accès" : "Retirer l'accès"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GrantAdminDialog;
