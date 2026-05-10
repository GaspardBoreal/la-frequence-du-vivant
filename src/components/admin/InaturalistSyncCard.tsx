import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, AlertCircle, CheckCircle2, Link2Off } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  userId: string | null;
  explorationId: string;
  onSynced?: () => void;
}

interface LogRow {
  id: string;
  status: string;
  observations_inserted: number | null;
  marches_scanned: number | null;
  error: string | null;
  source: string;
  created_at: string;
  completed_at: string | null;
}

export default function InaturalistSyncCard({ userId, explorationId, onSynced }: Props) {
  const [loading, setLoading] = useState(false);
  const [lastLog, setLastLog] = useState<LogRow | null>(null);
  const [hasInat, setHasInat] = useState<boolean | null>(null);

  const loadStatus = async () => {
    if (!userId) return;
    const [logRes, profRes] = await Promise.all([
      supabase
        .from('marcheur_backfill_log')
        .select('*')
        .eq('user_id', userId)
        .eq('exploration_id', explorationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('community_profiles').select('id').eq('user_id', userId).maybeSingle(),
    ]);
    setLastLog((logRes.data as LogRow) || null);
    if (profRes.data?.id) {
      const { data } = await supabase
        .from('community_profile_science_accounts')
        .select('username')
        .eq('profile_id', profRes.data.id)
        .eq('network', 'inaturalist')
        .maybeSingle();
      setHasInat(!!data?.username);
    } else {
      setHasInat(false);
    }
  };

  useEffect(() => {
    void loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, explorationId]);

  const trigger = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('backfill-marcheur-inaturalist', {
        body: { user_id: userId, exploration_id: explorationId, source: 'manual' },
      });
      if (error) throw error;
      const inserted = (data as any)?.inserted ?? 0;
      const status = (data as any)?.status;
      if (status === 'no_account') {
        toast.warning('Aucun compte iNaturalist lié à ce marcheur');
      } else {
        toast.success(`Synchronisation OK — ${inserted} observation${inserted > 1 ? 's' : ''} ajoutée${inserted > 1 ? 's' : ''}`);
        onSynced?.();
      }
      await loadStatus();
    } catch (e: any) {
      toast.error(e?.message || 'Erreur de synchronisation');
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="border rounded-lg p-3 bg-muted/20 text-sm text-muted-foreground flex items-center gap-2">
        <Link2Off className="h-4 w-4" />
        Marcheur sans compte utilisateur — backfill iNaturalist indisponible.
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-3 bg-muted/20 space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        <RefreshCw className="h-4 w-4 text-emerald-500" />
        <span className="font-medium text-sm flex-1">Synchronisation iNaturalist</span>
        {hasInat === false && (
          <Badge variant="outline" className="text-amber-600 border-amber-600/30">
            Aucun compte lié
          </Badge>
        )}
        {hasInat && (
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
            Compte iNat lié
          </Badge>
        )}
        <Button size="sm" onClick={trigger} disabled={loading || !hasInat}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
          Re-synchroniser
        </Button>
      </div>

      {lastLog && (
        <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
          {lastLog.status === 'success' && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
          {lastLog.status === 'error' && <AlertCircle className="h-3 w-3 text-destructive" />}
          {lastLog.status === 'pending' && <Loader2 className="h-3 w-3 animate-spin" />}
          <span>
            Dernière synchro {formatDistanceToNow(new Date(lastLog.created_at), { addSuffix: true, locale: fr })}
          </span>
          {lastLog.status === 'success' && (
            <span>
              · {lastLog.observations_inserted ?? 0} obs ajoutée
              {(lastLog.observations_inserted ?? 0) > 1 ? 's' : ''} sur {lastLog.marches_scanned ?? 0} marche
              {(lastLog.marches_scanned ?? 0) > 1 ? 's' : ''}
            </span>
          )}
          {lastLog.status === 'no_account' && <span>· aucun compte iNat</span>}
          {lastLog.error && <span className="text-destructive">· {lastLog.error}</span>}
        </div>
      )}
    </div>
  );
}
