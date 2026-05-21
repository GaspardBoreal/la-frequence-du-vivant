import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Users2, Share2, MousePointerClick, TrendingUp } from 'lucide-react';
import { useEventRayonnement } from '@/hooks/usePublicEvent';
import { cn } from '@/lib/utils';

interface Props {
  eventId: string;
}

const Stat: React.FC<{ icon: React.ElementType; label: string; value: number | string; tone?: string }> = ({
  icon: Icon, label, value, tone = 'text-primary',
}) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
    <div className={cn('p-2 rounded-md bg-primary/10', tone)}>
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground leading-tight">{label}</p>
      <p className="font-semibold text-foreground text-lg leading-tight">{value}</p>
    </div>
  </div>
);

const PublicEventMetricsPanel: React.FC<Props> = ({ eventId }) => {
  const { data, isLoading } = useEventRayonnement(eventId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }
  if (!data) return null;

  const topChannel = data.shares_by_channel?.[0]?.channel ?? '—';

  return (
    <Card className="p-4 space-y-4 bg-gradient-to-br from-background to-muted/30">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Rayonnement public
        </h4>
        <span className="text-xs text-muted-foreground">30 derniers jours</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat icon={Eye} label="Vues" value={data.views_total.toLocaleString('fr-FR')} />
        <Stat icon={Users2} label="Visiteurs uniques" value={data.unique_visitors.toLocaleString('fr-FR')} />
        <Stat icon={Share2} label="Partages" value={data.shares_total.toLocaleString('fr-FR')} tone="text-amber-500" />
        <Stat icon={MousePointerClick} label="Clics CTA" value={data.cta_clicks_total.toLocaleString('fr-FR')} tone="text-emerald-500" />
      </div>

      {data.shares_by_channel?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Partages par canal</p>
          <div className="flex flex-wrap gap-2">
            {data.shares_by_channel.map((c) => (
              <span
                key={c.channel}
                className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
              >
                {c.channel} · <strong>{c.count}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {data.top_referrers?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Top sources de trafic</p>
          <ul className="space-y-1 text-xs">
            {data.top_referrers.slice(0, 5).map((r) => (
              <li key={r.referrer} className="flex justify-between gap-2 text-muted-foreground">
                <span className="truncate">{r.referrer === 'direct' ? '🔗 Accès direct' : r.referrer}</span>
                <span className="font-medium text-foreground">{r.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.shares_total === 0 && data.views_total > 0 && (
        <p className="text-xs text-muted-foreground italic border-t pt-3">
          💡 Aucun partage encore — cette marche pourrait briller davantage. Top canal attendu : <strong>{topChannel}</strong>
        </p>
      )}
    </Card>
  );
};

export default PublicEventMetricsPanel;
