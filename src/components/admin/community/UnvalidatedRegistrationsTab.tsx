import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

type Row = {
  participation_id: string;
  user_id: string;
  marche_event_id: string;
  participation_created_at: string;
  event_title: string | null;
  exploration_id: string | null;
  prenom: string | null;
  nom: string | null;
  profile_id: string;
  has_inat: boolean;
  inat_username: string | null;
};

/**
 * Onglet « Inscriptions à valider » — détecte les marcheurs inscrits depuis
 * > 48 h dont la présence n'a jamais été validée. Permet une validation
 * rétroactive en un clic, qui déclenche promotion de rôle + backfill iNat.
 */
const UnvalidatedRegistrationsTab: React.FC = () => {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<Row[]>({
    queryKey: ['unvalidated-registrations'],
    queryFn: async () => {
      const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
      const { data: parts, error } = await supabase
        .from('marche_participations')
        .select(`
          id, user_id, marche_event_id, created_at,
          marche_events!inner(id, title, exploration_id),
          community_profiles!inner(id, prenom, nom)
        `)
        .is('validated_at', null)
        .lt('created_at', twoDaysAgo)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;

      // Fetch iNat accounts for these profiles
      const profileIds = Array.from(
        new Set((parts || []).map((p: any) => p.community_profiles?.id).filter(Boolean)),
      );
      const inatMap = new Map<string, string>();
      if (profileIds.length) {
        const { data: accs } = await supabase
          .from('community_profile_science_accounts')
          .select('profile_id, username')
          .eq('network', 'inaturalist')
          .in('profile_id', profileIds);
        for (const a of accs || []) inatMap.set((a as any).profile_id, (a as any).username);
      }

      return (parts || []).map((p: any) => ({
        participation_id: p.id,
        user_id: p.user_id,
        marche_event_id: p.marche_event_id,
        participation_created_at: p.created_at,
        event_title: p.marche_events?.title ?? null,
        exploration_id: p.marche_events?.exploration_id ?? null,
        prenom: p.community_profiles?.prenom ?? null,
        nom: p.community_profiles?.nom ?? null,
        profile_id: p.community_profiles?.id,
        has_inat: inatMap.has(p.community_profiles?.id),
        inat_username: inatMap.get(p.community_profiles?.id) ?? null,
      }));
    },
    staleTime: 60_000,
  });

  const validateOne = async (row: Row) => {
    setBusy(row.participation_id);
    try {
      const { error: upErr } = await supabase
        .from('marche_participations')
        .update({
          validated_at: new Date().toISOString(),
          validation_method: 'admin_retroactive',
        })
        .eq('id', row.participation_id);
      if (upErr) throw upErr;

      // Déclenche manuellement le backfill iNat sur l'exploration
      if (row.exploration_id && row.has_inat) {
        await supabase.functions.invoke('backfill-marcheur-inaturalist', {
          body: {
            user_id: row.user_id,
            exploration_id: row.exploration_id,
            marche_event_id: row.marche_event_id,
            source: 'admin_retroactive',
          },
        });
      }
      toast.success(`Validation OK — ${row.prenom ?? ''} ${row.nom ?? ''}`);
      qc.invalidateQueries({ queryKey: ['unvalidated-registrations'] });
    } catch (e: any) {
      toast.error(e?.message || 'Erreur');
    } finally {
      setBusy(null);
    }
  };

  const rows = data ?? [];
  const withInat = rows.filter((r) => r.has_inat).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{rows.length}</p>
              <p className="text-xs text-muted-foreground">Inscriptions non validées &gt; 48 h</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">{withInat}</p>
              <p className="text-xs text-muted-foreground">Avec compte iNaturalist lié</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Rafraîchir
          </Button>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Marcheur</TableHead>
              <TableHead>Marche</TableHead>
              <TableHead>Inscrit</TableHead>
              <TableHead>iNat</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Aucune inscription en attente — pipeline sain ✓
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.participation_id}>
                  <TableCell className="font-medium">
                    {r.prenom} {r.nom}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.event_title || '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(r.participation_created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </TableCell>
                  <TableCell>
                    {r.has_inat ? (
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                        @{r.inat_username}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => validateOne(r)}
                      disabled={busy === r.participation_id}
                    >
                      {busy === r.participation_id ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 mr-2" />
                      )}
                      Valider rétroactivement
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <p className="text-xs text-muted-foreground">
        Une inscription non validée bloque deux choses : la promotion du rôle (reste « En devenir »)
        et la synchro iNaturalist. La validation rétroactive débloque les deux instantanément.
      </p>
    </div>
  );
};

export default UnvalidatedRegistrationsTab;
