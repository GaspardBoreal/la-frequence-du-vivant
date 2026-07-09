import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Sparkles, Presentation, RefreshCw } from 'lucide-react';
import { useCommunityUsageDashboard } from '@/hooks/useCommunityUsageDashboard';
import SignalVitalHero from './SignalVitalHero';
import PersonaMatrix from './PersonaMatrix';
import JourneyFunnel from './JourneyFunnel';
import RhythmHeatmap from './RhythmHeatmap';
import FeatureRadar from './FeatureRadar';
import TopCitiesPanel from './TopCitiesPanel';
import PitchModeOverlay from './PitchModeOverlay';

export const UsageDashboard: React.FC = () => {
  const [days, setDays] = useState(90);
  const [pitchOpen, setPitchOpen] = useState(false);
  const { data, isLoading, refetch, isFetching } = useCommunityUsageDashboard(days);

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="h-40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">Aucune donnée d'usage disponible.</Card>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3 justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Profils d'usage & signaux vivants
          </h2>
          <p className="text-sm text-muted-foreground">
            Comment nos marcheur·euse·s vivent l'application — pour animer, ré-engager, cibler et convaincre.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 jours</SelectItem>
              <SelectItem value="30">30 jours</SelectItem>
              <SelectItem value="90">90 jours</SelectItem>
              <SelectItem value="180">6 mois</SelectItem>
              <SelectItem value="365">1 an</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={() => setPitchOpen(true)}>
            <Presentation className="h-3.5 w-3.5 mr-1.5" />
            Mode Pitch
          </Button>
        </div>
      </div>

      {/* 1. Signal vital */}
      <SignalVitalHero data={data} />

      {/* 2. Personas */}
      <PersonaMatrix data={data} />

      {/* 3 + 4. Funnel & Rhythm */}
      <div className="grid gap-4 md:grid-cols-2">
        <JourneyFunnel funnel={data.funnel} />
        <RhythmHeatmap heatmap={data.heatmap ?? []} />
      </div>

      {/* 5 + 6. Radar & Cities */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <FeatureRadar radar={data.radar ?? []} />
        </div>
        <TopCitiesPanel cities={data.top_cities ?? []} />
      </div>

      <p className="text-[10px] text-muted-foreground text-right">
        Généré {new Date(data.generated_at).toLocaleString('fr-FR')} · plage {days} j
      </p>

      <PitchModeOverlay data={data} open={pitchOpen} onClose={() => setPitchOpen(false)} />
    </div>
  );
};

export default UsageDashboard;
