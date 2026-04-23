import React, { useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { MarcheEventType } from '@/lib/marcheEventTypes';
import { getMarcheEventTypeMeta } from '@/lib/marcheEventTypes';
import {
  LIVING_PILLARS,
  LIVING_TIMEFRAMES,
  ROLE_MISSIONS,
  EVENT_TYPE_PILLAR_PRIORITIES,
  getMissingPillars,
  getPillarSuggestions,
  inferPillarsFromText,
} from '@/lib/marchesVivantFramework';

type ExplorationMarchePreview = {
  ordre?: number | null;
  publication_status?: string | null;
  marches?: {
    nom_marche?: string | null;
    ville?: string | null;
    departement?: string | null;
    theme_principal?: string | null;
  } | null;
  exploration_parties?: { titre?: string | null } | null;
};

interface LivingPathOverviewProps {
  eventTitle?: string | null;
  eventDescription?: string | null;
  eventType?: MarcheEventType | string | null;
  marches?: ExplorationMarchePreview[];
}

function getIcon(name: string): React.ElementType {
  return (LucideIcons as any)[name] || LucideIcons.Leaf;
}

const LivingPathOverview: React.FC<LivingPathOverviewProps> = ({ eventTitle, eventDescription, eventType, marches = [] }) => {
  const typeMeta = getMarcheEventTypeMeta(eventType);

  const enrichedMarches = useMemo(() => marches.map((item, index) => {
    const marche = item.marches;
    const text = [eventTitle, eventDescription, marche?.nom_marche, marche?.ville, marche?.theme_principal, item.exploration_parties?.titre].filter(Boolean).join(' ');
    const pillars = inferPillarsFromText(text, eventType);
    return { ...item, displayOrder: item.ordre ?? index + 1, pillars };
  }), [eventTitle, eventDescription, eventType, marches]);

  const activePillars = useMemo(() => {
    const set = new Set(enrichedMarches.flatMap((item) => item.pillars));
    if (eventType && eventType in EVENT_TYPE_PILLAR_PRIORITIES) {
      EVENT_TYPE_PILLAR_PRIORITIES[eventType as MarcheEventType].slice(0, 2).forEach((pillar) => set.add(pillar));
    }
    return LIVING_PILLARS.filter((pillar) => set.has(pillar.key));
  }, [enrichedMarches, eventType]);

  const missing = getMissingPillars(activePillars.map((pillar) => pillar.key));
  const coverage = Math.round((activePillars.length / LIVING_PILLARS.length) * 100);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Parcours vivant</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">Lecture opérationnelle de l’événement selon les 5 piliers, les points de marche, les niveaux marcheurs et les trois temporalités.</p>
            {typeMeta && (
              <Badge variant="outline" className={cn('w-fit', typeMeta.badgeClassName)}>{typeMeta.label}</Badge>
            )}
          </div>
          <div className="min-w-44 rounded-xl border border-border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">Équilibre des piliers</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{coverage}%</p>
            <Progress value={coverage} className="mt-3 h-2" />
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-5">
        {LIVING_PILLARS.map((pillar) => {
          const Icon = getIcon(pillar.icon);
          const active = activePillars.some((activePillar) => activePillar.key === pillar.key);
          return (
            <Card key={pillar.key} className={cn('p-4', active ? 'border-primary/30 bg-primary/5' : 'border-dashed bg-muted/10')}>
              <div className="flex items-center gap-2">
                <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground')} />
                <p className="text-sm font-semibold text-foreground">{pillar.label}</p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{pillar.verb}</p>
              <Badge variant={active ? 'default' : 'outline'} className="mt-3 text-[10px]">{active ? 'Couvert' : 'À renforcer'}</Badge>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-foreground">Points de marche</h3>
        <div className="mt-4 space-y-3">
          {enrichedMarches.length > 0 ? enrichedMarches.map((item) => {
            const marche = item.marches;
            return (
              <div key={`${item.displayOrder}-${marche?.nom_marche || marche?.ville}`} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.displayOrder}. {marche?.nom_marche || marche?.ville || 'Point de marche'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{[marche?.ville, marche?.departement, marche?.theme_principal].filter(Boolean).join(' · ') || 'Point à qualifier'}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.pillars.map((pillarKey) => {
                      const pillar = LIVING_PILLARS.find((candidate) => candidate.key === pillarKey)!;
                      return <Badge key={pillarKey} variant="outline" className="text-[10px]">{pillar.label}</Badge>;
                    })}
                  </div>
                </div>
              </div>
            );
          }) : <p className="text-sm text-muted-foreground">Associez une exploration pour visualiser les points de marche.</p>}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-foreground">Suggestions prioritaires</h3>
          <div className="mt-3 space-y-2">
            {getPillarSuggestions(missing.map((pillar) => pillar.key)).slice(0, 4).map((suggestion) => (
              <p key={suggestion} className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">{suggestion}</p>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-foreground">Missions par niveau</h3>
          <div className="mt-3 space-y-3">
            {(['marcheur', 'eclaireur', 'ambassadeur', 'sentinelle'] as const).map((role) => (
              <div key={role}>
                <p className="text-xs font-medium capitalize text-foreground">{role.replace('_', ' ')}</p>
                <p className="text-xs text-muted-foreground">{ROLE_MISSIONS[role][0]}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-foreground">Avant · Pendant · Après</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {Object.entries(LIVING_TIMEFRAMES).map(([key, timeframe]) => (
            <div key={key} className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">{timeframe.label}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{timeframe.description}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default LivingPathOverview;