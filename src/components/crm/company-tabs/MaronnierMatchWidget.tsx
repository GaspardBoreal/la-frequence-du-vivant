import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, ExternalLink, Copy, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface MaronnierMatch {
  event_id: string;
  nom: string;
  date_debut: string;
  date_fin: string | null;
  lieu: string | null;
  region: string | null;
  type: string | null;
  site_url: string | null;
  description: string | null;
  secteurs_naf: string[] | null;
  match_score: number;
  match_reasons: string[] | null;
}

function formatDateFr(d?: string | null) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
}

export const MaronnierMatchWidget: React.FC<{ companyId: string; companyName: string }> = ({
  companyId,
  companyName,
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ['maronnier-matches', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_maronnier_matches_for_company', {
        p_company_id: companyId,
        p_limit: 5,
      });
      if (error) throw error;
      return (data ?? []) as MaronnierMatch[];
    },
  });

  const copyAccroche = (m: MaronnierMatch) => {
    const txt = `Bonjour,\n\nNous serons présents au ${m.nom}${m.lieu ? ` à ${m.lieu}` : ''} le ${formatDateFr(m.date_debut)}. Profitons-en pour échanger sur la manière dont une Marche du Vivant pourrait révéler le patrimoine vivant de ${companyName} à vos équipes.\n\nÀ très vite,`;
    navigator.clipboard.writeText(txt);
    toast.success('Accroche copiée dans le presse-papiers');
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Salons stratégiques pour ce prospect</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Top événements du maronnier alignés avec le secteur NAF et la région de l'entreprise.
      </p>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Calcul des matches…
        </div>
      )}

      {!isLoading && (!data || data.length === 0) && (
        <p className="text-sm text-muted-foreground italic">
          Aucun salon à venir dans le maronnier. Enrichis la table <code>crm_maronnier_events</code>.
        </p>
      )}

      <div className="space-y-2">
        {data?.map((m) => (
          <Card key={m.event_id} className="p-3 space-y-2 bg-muted/30">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">{m.nom}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{formatDateFr(m.date_debut)}</span>
                  {m.lieu && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{m.lieu}</span>}
                </div>
              </div>
              <Badge variant="secondary" className="shrink-0">{m.match_score} pts</Badge>
            </div>

            {m.match_reasons && m.match_reasons.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {m.match_reasons.map((r) => (
                  <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => copyAccroche(m)}>
                <Copy className="h-3 w-3 mr-1" /> Copier accroche
              </Button>
              {m.site_url && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => window.open(m.site_url!, '_blank', 'noopener,noreferrer')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" /> Site
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};
