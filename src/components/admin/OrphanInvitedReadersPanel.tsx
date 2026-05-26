import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Skeleton } from '@/components/ui/skeleton';
import { MailX, Trash2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface OrphanInviteRow {
  user_id: string;
  invitations_count: number;
  event_titles: string[];
  last_invited_at: string;
}

const OrphanInvitedReadersPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ['orphan-invited-readers'],
    queryFn: async (): Promise<OrphanInviteRow[]> => {
      const { data, error } = await supabase.rpc('admin_orphan_invited_readers');
      if (error) throw error;
      return (data ?? []) as OrphanInviteRow[];
    },
    staleTime: 30_000,
  });

  const rows = data ?? [];
  const totalInvites = useMemo(
    () => rows.reduce((s, r) => s + Number(r.invitations_count || 0), 0),
    [rows],
  );

  const selectedRows = rows.filter((r) => selected.has(r.user_id));
  const selectedInvites = selectedRows.reduce((s, r) => s + Number(r.invitations_count || 0), 0);

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.user_id)));
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const { data, error } = await supabase.rpc('admin_delete_orphan_invited_readers', {
        p_user_ids: userIds,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row as { deleted_count: number; affected_users: string[] };
    },
    onSuccess: (res) => {
      toast.success(
        `${res?.deleted_count ?? 0} invitation(s) orpheline(s) supprimée(s).`,
      );
      setSelected(new Set());
      setConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['orphan-invited-readers'] });
      queryClient.invalidateQueries({ queryKey: ['exploration-pending-invitees'] });
    },
    onError: (err: any) => {
      toast.error(`Suppression impossible : ${err?.message ?? 'erreur inconnue'}`);
    },
  });

  return (
    <Card className="p-4 border-amber-500/30">
      <div className="mb-4 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <MailX className="h-4 w-4 text-amber-500" />
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Maintenance · Invitations orphelines
            </h3>
            <p className="text-xs text-muted-foreground">
              Lignes <code>event_invited_readers</code> dont l'utilisateur n'a plus de profil ni de compte auth (tests d'onboarding, comptes supprimés…).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={selected.size === 0 || deleteMutation.isPending}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Supprimer la sélection ({selected.size})
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive py-6 text-center">
          Erreur de chargement : {(error as Error).message}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          Aucune invitation orpheline. ✨
        </p>
      ) : (
        <>
          <div className="text-xs text-muted-foreground mb-2">
            {rows.length} compte(s) orphelin(s) · {totalInvites} invitation(s) au total
          </div>
          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                      onCheckedChange={toggleAll}
                      aria-label="Tout sélectionner"
                    />
                  </TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead className="text-right">Invitations</TableHead>
                  <TableHead>Marches concernées</TableHead>
                  <TableHead>Dernière invitation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const checked = selected.has(r.user_id);
                  return (
                    <TableRow key={r.user_id} data-state={checked ? 'selected' : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleOne(r.user_id)}
                          aria-label={`Sélectionner ${r.user_id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground">
                          {r.user_id.slice(0, 8)}…{r.user_id.slice(-4)}
                        </code>
                      </TableCell>
                      <TableCell className="text-right font-medium">{r.invitations_count}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(r.event_titles ?? []).slice(0, 4).map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px] max-w-[200px] truncate">
                              {t}
                            </Badge>
                          ))}
                          {(r.event_titles ?? []).length > 4 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{r.event_titles.length - 4}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(r.last_invited_at), { locale: fr, addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer les invitations orphelines ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de supprimer <strong>{selectedInvites} invitation(s)</strong> issues
              de <strong>{selectedRows.length} compte(s) orphelin(s)</strong>. Cette action est
              irréversible. Le serveur revérifie que chaque compte n'a effectivement plus de profil ni
              d'entrée auth avant de supprimer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate(selectedRows.map((r) => r.user_id));
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Suppression…' : 'Supprimer définitivement'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default OrphanInvitedReadersPanel;
