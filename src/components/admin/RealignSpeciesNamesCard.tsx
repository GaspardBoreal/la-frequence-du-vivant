import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Languages, Loader2 } from 'lucide-react';

type Change = { sci: string; before: string | null; after: string };

export default function RealignSpeciesNamesCard() {
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ changed: 0, unchanged: 0, notFound: 0, remaining: 0 });
  const [changes, setChanges] = useState<Change[]>([]);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setRunning(true); setError(null); setChanges([]);
    setStats({ changed: 0, unchanged: 0, notFound: 0, remaining: 0 });
    let offset = 0;
    try {
      for (let i = 0; i < 100; i++) {
        const { data, error } = await supabase.functions.invoke('realign-species-names', { body: { offset, limit: 50 } });
        if (error) throw error;
        const d = data as any;
        setStats((s) => ({
          changed: s.changed + d.changed.length,
          unchanged: s.unchanged + d.unchanged.length,
          notFound: s.notFound + d.notFound.length,
          remaining: d.remainingApprox,
        }));
        setChanges((c) => [...c, ...d.changed]);
        offset = d.nextOffset;
        if (d.done) break;
      }
      qc.invalidateQueries({ queryKey: ['fr-species-names-auto'] });
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card className="p-6 mt-8">
      <div className="flex items-center mb-3">
        <Languages className="h-7 w-7 text-accent mr-3" />
        <h2 className="text-xl font-semibold text-foreground">Noms français officiels (INPN)</h2>
      </div>
      <p className="text-muted-foreground text-sm mb-4">
        Revérifie auprès d'iNaturalist (aligné TAXREF) les noms français issus de l'IA ou de Wikipédia.
        Les noms saisis à la main ne sont jamais modifiés ; l'ancien nom reste trouvable par la recherche.
      </p>
      <Button onClick={run} disabled={running} variant="outline">
        {running && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {running ? 'Alignement en cours…' : 'Lancer l\u2019alignement'}
      </Button>
      {(running || stats.changed + stats.unchanged + stats.notFound > 0) && (
        <p className="text-sm mt-3 text-foreground">
          {stats.changed} changés · {stats.unchanged} déjà justes · {stats.notFound} introuvables
          {running && ` · environ ${stats.remaining} restants`}
        </p>
      )}
      {error && <p className="text-sm mt-2 text-destructive">{error}</p>}
      {changes.length > 0 && (
        <div className="mt-3 max-h-64 overflow-auto text-xs border rounded p-2 space-y-0.5">
          {changes.map((c) => (
            <div key={c.sci}><i>{c.sci}</i> : {c.before || '—'} → <b>{c.after}</b></div>
          ))}
        </div>
      )}
    </Card>
  );
}
