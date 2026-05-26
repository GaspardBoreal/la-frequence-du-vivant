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
import { UserX, Trash2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface OrphanRow {
  marcheur_id: string;
  user_id: string;
  exploration_id: string;
  prenom: string | null;
  nom: string | null;
  created_at: string;
  nb_observations: number;
  nb_medias: number;
}

interface UserGroup {
  user_id: string;
  marcheurs: OrphanRow[];
  totalObservations: number;
  totalMedias: number;
  displayName: string;
}

const OrphanExplorationMarcheursPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ['orphan-exploration-marcheurs'],
    queryFn: async (): Promise<OrphanRow[]> => {
      const { data, error } = await supabase.functions.invoke('admin-orphan-marcheurs', {
        body: { action: 'list' },
      });
      if (error) throw error;
      return ((data as any)?.orphans ?? []) as OrphanRow[];
    },
    staleTime: 30_000,
  });

  const groups: UserGroup[] = useMemo(() => {
    const rows = data ?? [];
    const map = new Map<string, UserGroup>();
    for (const r of rows) {
      const existing = map.get(r.user_id);
      const name = [r.prenom, r.nom].filter(Boolean).join(' ').trim() || '(sans nom)';
      if (existing) {
        existing.marcheurs.push(r);
        existing.totalObservations += Number(r.nb_observations ?? 0);
        existing.totalMedias += Number(r.nb_medias ?? 0);
      } else {
        map.set(r.user_id, {
          user_id: r.user_id,
          marcheurs: [r],
          totalObservations: Number(r.nb_observations ?? 0),
          totalMedias: Number(r.nb_medias ?? 0),
          displayName: name,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [data]);

  const allSelected = groups.length > 0 && selected.size === groups.length;
  const someSelected = selected.size > 0 && !allSelected;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(groups.map((g) => g.user_id)));
  const toggleOne = (uid: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });

  const selectedGroups = useMemo(() => groups.filter((g) => selected.has(g.user_id)), [groups, selected]);

  const purgeMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const { data, error } = await supabase.functions.invoke('admin-orphan-marcheurs', {
        body: { action: 'purge', user_ids: userIds },
      });
      if (error) throw error;
      return data as { success: boolean; results: Array<{ user_id: string; error?: string }> };
    },
    onSuccess: (res) => {
      const errors = (res?.results ?? []).filter((r) => r.error);
      if (errors.length > 0) {
        toast.warning(`${res.results.length - errors.length} purgé(s), ${errors.length} en erreur.`);
      } else {
        toast.success(`${res.results.length} compte(s) fantôme purgé(s) avec toutes leurs traces.`);
      }
      setSelected(new Set());
      setConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['orphan-exploration-marcheurs'] });
    },
    onError: (err: any) => toast.error(`Purge impossible : ${err?.message ?? 'erreur'}`),
  });

  return (
    <Card className="p-4 border-rose-500/30">
      <div className="mb-4 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <UserX className="h-4 w-4 text-rose-500" />
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Maintenance · Marcheurs fantômes
            </h3>
            <p className="text-xs text-muted-foreground">
              Fiches <code>exploration_marcheurs</code> dont le compte auth a été supprimé. La purge supprime aussi observations, médias, audios, textes, etc.
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
            disabled={selected.size === 0 || purgeMutation.isPending}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Purger ({selected.size})
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : error ? (
        <p className="text-sm text-destructive py-6 text-center">Erreur : {(error as Error).message}</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Aucun marcheur fantôme. ✨</p>
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
                <TableHead>Nom</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead className="text-right">Fiches</TableHead>
                <TableHead className="text-right">Obs.</TableHead>
                <TableHead className="text-right">Médias</TableHead>
                <TableHead>Plus récente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => {
                const mostRecent = g.marcheurs.reduce((acc, m) => (m.created_at > acc ? m.created_at : acc), g.marcheurs[0].created_at);
                return (
                  <TableRow key={g.user_id} data-state={selected.has(g.user_id) ? 'selected' : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(g.user_id)}
                        onCheckedChange={() => toggleOne(g.user_id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-sm">{g.displayName}</TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground">{g.user_id.slice(0, 8)}…{g.user_id.slice(-4)}</code>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="text-[10px]">{g.marcheurs.length}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{g.totalObservations}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{g.totalMedias}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(mostRecent), { locale: fr, addSuffix: true })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Purger {selectedGroups.length} compte(s) fantôme ?</AlertDialogTitle>
            <AlertDialogDescription>
              Suppression cascade complète : fiches marcheur, observations, médias, audios, textes,
              participations, invitations, témoignages, profils… <strong>Action irréversible.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={purgeMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                purgeMutation.mutate(selectedGroups.map((g) => g.user_id));
              }}
              disabled={purgeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {purgeMutation.isPending ? 'Purge…' : 'Purger définitivement'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default OrphanExplorationMarcheursPanel;
