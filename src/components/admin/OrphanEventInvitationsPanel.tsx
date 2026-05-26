import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Ticket, Trash2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface Row {
  id: string;
  invited_email: string;
  invited_prenom: string | null;
  event_title: string;
  token: string;
  created_at: string;
  consumed_at: string | null;
}

const OrphanEventInvitationsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ['orphan-event-invitations'],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase.rpc('admin_orphan_event_invitations');
      if (error) throw error;
      return (data ?? []) as Row[];
    },
    staleTime: 30_000,
  });

  const rows = data ?? [];
  const allSelected = rows.length > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0 && !allSelected;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedRows = useMemo(() => rows.filter((r) => selected.has(r.id)), [rows, selected]);

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data, error } = await supabase.rpc('admin_delete_orphan_event_invitations', { p_ids: ids });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row as { deleted_count: number };
    },
    onSuccess: (res) => {
      toast.success(`${res?.deleted_count ?? 0} invitation(s) supprimée(s).`);
      setSelected(new Set());
      setConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['orphan-event-invitations'] });
    },
    onError: (err: any) => toast.error(`Suppression impossible : ${err?.message ?? 'erreur'}`),
  });

  return (
    <Card className="p-4 border-amber-500/30">
      <div className="mb-4 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 text-amber-500" />
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Maintenance · Tokens d'invitation orphelins
            </h3>
            <p className="text-xs text-muted-foreground">
              Lignes <code>event_invitations</code> dont l'email cible (ou le compte ayant consommé) n'existe plus côté auth.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} /> Actualiser
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={selected.size === 0 || deleteMutation.isPending}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Supprimer ({selected.size})
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : error ? (
        <p className="text-sm text-destructive py-6 text-center">Erreur : {(error as Error).message}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Aucun token orphelin. ✨</p>
      ) : (
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Email cible</TableHead>
                <TableHead>Événement</TableHead>
                <TableHead>Créé</TableHead>
                <TableHead>Consommé</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} data-state={selected.has(r.id) ? 'selected' : undefined}>
                  <TableCell>
                    <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleOne(r.id)} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.invited_email}
                    {r.invited_prenom && <span className="text-muted-foreground"> · {r.invited_prenom}</span>}
                  </TableCell>
                  <TableCell className="text-xs">{r.event_title}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(r.created_at), { locale: fr, addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.consumed_at ? formatDistanceToNow(new Date(r.consumed_at), { locale: fr, addSuffix: true }) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer les tokens orphelins ?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRows.length} token(s) seront supprimés. Le serveur revérifie l'absence du compte avant suppression.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate(selectedRows.map((r) => r.id));
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Suppression…' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default OrphanEventInvitationsPanel;
