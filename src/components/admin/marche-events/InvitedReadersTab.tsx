import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, UserPlus2, ArrowUpRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import InviteReaderDialog from './InviteReaderDialog';
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
import { useAuth } from '@/hooks/useAuth';

interface InvitedReader {
  id: string;
  event_id: string;
  user_id: string | null;
  invitation_id: string | null;
  added_by_user_id: string | null;
  promoted_to_participant_at: string | null;
  created_at: string;
  prenom: string | null;
  nom: string | null;
  email: string | null;
  invited_by_prenom: string | null;
  source: 'manuel' | 'invitation';
  status: 'inscrit' | 'en_attente' | 'expire';
}

interface InvitedReadersTabProps {
  eventId: string;
  eventTitle?: string | null;
}

const STATUS_META: Record<InvitedReader['status'], { label: string; className: string }> = {
  inscrit: { label: 'Inscrit', className: 'bg-emerald-500/15 text-emerald-600' },
  en_attente: { label: 'En attente', className: 'bg-amber-500/15 text-amber-600' },
  expire: { label: 'Expirée', className: 'bg-muted text-muted-foreground' },
};

const InvitedReadersTab: React.FC<InvitedReadersTabProps> = ({ eventId, eventTitle }) => {
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const authReady = !authLoading && !!user;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['event-invited-readers', eventId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('event-invited-readers-list', {
        body: { event_id: eventId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return (((data as any)?.readers) || []) as InvitedReader[];
    },
    enabled: !!eventId && authReady,
    staleTime: 0,
    refetchOnMount: 'always',
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 4000),
  });

  const promote = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('event-invited-reader-promote', {
        body: { event_id: eventId, user_id: userId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      toast.success('Lecteur promu en Participant');
      queryClient.invalidateQueries({ queryKey: ['event-invited-readers', eventId] });
      queryClient.invalidateQueries({ queryKey: ['marche-participations', eventId] });
      queryClient.invalidateQueries({ queryKey: ['marche-participation-counts'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Erreur lors de la promotion'),
  });

  const rows = data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          Personnes invitées à découvrir l'événement en lecture seule. Elles peuvent être promues en Participant.
        </p>
        <InviteReaderDialog
          eventId={eventId}
          eventTitle={eventTitle}
          triggerLabel="Inviter un Lecteur"
          invalidateKey={['event-invited-readers', eventId]}
        />
      </div>

      {!authReady || isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : isError ? (
        <Card className="p-6 text-center border-dashed border-destructive/40">
          <p className="text-sm text-destructive">
            Impossible de charger les Lecteurs invités. {(error as Error)?.message === 'forbidden'
              ? "Vous n'avez pas les droits nécessaires."
              : 'Réessayez dans un instant.'}
          </p>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Réessayer
            </Button>
          </div>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Aucun Lecteur invité pour le moment.
          </p>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prénom</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Invité par</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const status = STATUS_META[r.status];
              return (
                <TableRow key={r.id}>
                  <TableCell>{r.prenom || '—'}</TableCell>
                  <TableCell>{r.nom || '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{r.email || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={status.className}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="text-xs capitalize">
                    {r.source === 'manuel' ? <UserPlus2 className="h-3.5 w-3.5 inline mr-1" /> : null}
                    {r.source}
                  </TableCell>
                  <TableCell className="text-xs">{r.invited_by_prenom || '—'}</TableCell>
                  <TableCell className="text-xs">
                    {format(new Date(r.created_at), 'd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === 'inscrit' && r.user_id && !r.promoted_to_participant_at && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={promote.isPending}
                        onClick={() => promote.mutate(r.user_id!)}
                      >
                        <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                        Promouvoir
                      </Button>
                    )}
                    {r.promoted_to_participant_at && (
                      <span className="text-xs text-muted-foreground">Promu</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default InvitedReadersTab;
