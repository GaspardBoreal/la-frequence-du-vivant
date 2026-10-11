import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, AlertTriangle, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SpeciesName } from '@/components/species/SpeciesName';

const LATE_MS = 3 * 60 * 60 * 1000;

export default function AdminVeilleInat() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-inat-watch-misses'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('inat_watch_misses')
        .select('*, marches(nom_marche)')
        .is('resolved_at', null)
        .order('first_seen_at', { ascending: true })
        .limit(500);
      if (error) throw error;
      return data as any[];
    },
    refetchInterval: 60_000,
  });

  const rows = data || [];
  const late = rows.filter((r) => Date.now() - new Date(r.first_seen_at).getTime() > LATE_MS);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to="/admin/outils" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Outils admin
        </Link>
        <header>
          <h1 className="text-2xl font-semibold text-foreground">Veille iNaturalist</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vérification toutes les heures des observations du compte @les-marches-du-vivant et des marcheurs liés. Une observation absente est recollectée automatiquement ; elle passe en alerte au-delà de 3 h.
          </p>
        </header>

        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : rows.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-4 text-sm text-foreground">
            <CheckCircle2 className="w-4 h-4 text-primary" /> Toutes les observations récentes sont bien affichées.
          </div>
        ) : (
          <>
            {late.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="w-4 h-4" /> {late.length} observation{late.length > 1 ? 's' : ''} absente{late.length > 1 ? 's' : ''} depuis plus de 3 h
              </div>
            )}
            <ul className="divide-y divide-border rounded-lg border border-border bg-card">
              {rows.map((r) => {
                const isLate = Date.now() - new Date(r.first_seen_at).getTime() > LATE_MS;
                return (
                  <li key={r.id} className="p-3 flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground">
                        {r.scientific_name ? <SpeciesName scientificName={r.scientific_name} /> : 'Espèce non identifiée'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        @{r.observer_login} · {r.marches?.nom_marche || 'Marche'}
                        {r.observed_on && ` · observée le ${format(new Date(r.observed_on), 'dd/MM/yyyy')}`}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${isLate ? 'border-destructive/40 text-destructive' : 'border-border text-muted-foreground'}`}>
                      {r.reason} · {formatDistanceToNow(new Date(r.first_seen_at), { locale: fr, addSuffix: true })}
                    </span>
                    {r.observation_url && (
                      <a href={r.observation_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary underline">
                        iNaturalist <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
