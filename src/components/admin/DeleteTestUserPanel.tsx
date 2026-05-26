import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { UserX, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DryRunResult {
  user_id: string;
  email: string | null;
  counts: Record<string, number>;
}

const DeleteTestUserPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [dryRun, setDryRun] = useState<DryRunResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const invokeMutation = useMutation({
    mutationFn: async (vars: { email: string; dry_run: boolean }) => {
      const { data, error } = await supabase.functions.invoke('admin-delete-user-cascade', {
        body: { email: vars.email, dry_run: vars.dry_run },
      });
      if (error) {
        let msg = error.message || 'Échec';
        try {
          const ctx: any = (error as any).context;
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json();
            if (body?.error) msg = body.error;
          }
        } catch { /* noop */ }
        throw new Error(msg);
      }
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as any;
    },
  });

  const handleDryRun = async () => {
    if (!email.trim()) return;
    try {
      const res = await invokeMutation.mutateAsync({ email: email.trim(), dry_run: true });
      setDryRun({ user_id: res.user_id, email: res.email, counts: res.counts });
      toast.success(`Compte trouvé. Aperçu prêt.`);
    } catch (e: any) {
      toast.error(e?.message || 'Échec');
      setDryRun(null);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await invokeMutation.mutateAsync({ email: email.trim(), dry_run: false });
      toast.success(`Compte ${res.email} supprimé.`);
      setConfirmOpen(false);
      setDryRun(null);
      setEmail('');
      // Rafraîchir toutes les listes admin
      queryClient.invalidateQueries({ queryKey: ['orphan-invited-readers'] });
      queryClient.invalidateQueries({ queryKey: ['orphan-event-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['orphan-marche-participations'] });
      queryClient.invalidateQueries({ queryKey: ['community-profiles-admin'] });
      queryClient.invalidateQueries({ queryKey: ['admin-marche-participations'] });
    } catch (e: any) {
      toast.error(e?.message || 'Échec suppression');
    }
  };

  return (
    <Card className="p-4 border-destructive/40">
      <div className="mb-4 flex items-start gap-2">
        <UserX className="h-4 w-4 text-destructive mt-1" />
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Maintenance · Supprimer un compte de test
          </h3>
          <p className="text-xs text-muted-foreground">
            Supprime entièrement un compte : participations, invitations, profil, auth. Refuse les admins.
            Faire un aperçu (dry-run) d'abord.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 items-end">
        <div className="flex-1 w-full">
          <Label htmlFor="del-email" className="text-xs">Email du compte</Label>
          <Input
            id="del-email"
            type="email"
            placeholder="aurelien.dript@gmail.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setDryRun(null); }}
            disabled={invokeMutation.isPending}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDryRun}
          disabled={!email.trim() || invokeMutation.isPending}
        >
          <Search className="h-4 w-4 mr-1" /> Aperçu
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          disabled={!dryRun || invokeMutation.isPending}
        >
          <Trash2 className="h-4 w-4 mr-1" /> Supprimer
        </Button>
      </div>

      {dryRun && (
        <div className="mt-4 rounded-md border border-border p-3 bg-muted/30">
          <p className="text-xs text-muted-foreground mb-2">
            <code className="text-foreground">{dryRun.email}</code> — <code className="text-muted-foreground">{dryRun.user_id.slice(0, 8)}…{dryRun.user_id.slice(-4)}</code>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {Object.entries(dryRun.counts).map(([table, count]) => (
              <div key={table} className="rounded border border-border/60 p-2 bg-background">
                <div className="text-muted-foreground">{table}</div>
                <div className="font-mono text-foreground">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer définitivement ce compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{dryRun?.email}</strong> sera supprimé entièrement (participations, invitations, profil, auth).
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={invokeMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirmDelete(); }}
              disabled={invokeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {invokeMutation.isPending ? 'Suppression…' : 'Confirmer la suppression'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default DeleteTestUserPanel;
