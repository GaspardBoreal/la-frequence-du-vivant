import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { motion } from 'framer-motion';
import { Activity, Info, Leaf, Eye, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  useBiodiversityEvolution,
  type EvolutionMetric,
  type EvolutionPeriod,
  type DateSource,
} from '@/hooks/useBiodiversityEvolution';
import DayDetailDrawer from './DayDetailDrawer';
import type { SpeciesMarcheData } from '@/hooks/useSpeciesMarches';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface Props {
  snapshots: any[] | undefined;
  marchesById?: Map<string, { name: string; ville?: string; latitude?: number; longitude?: number }>;
  onNavigateToMarche?: (marcheId: string) => void;
  explorationId?: string;
  allEventMarches?: SpeciesMarcheData[];
  /** Override the species total in the header to align with the unified pool (snapshots ∪ marcheur_observations). */
  overrideTotalSpecies?: number;
}

const periodOptions: { key: EvolutionPeriod; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: '7d', label: '7 derniers jours' },
  { key: '30d', label: '30 derniers jours' },
  { key: 'last_month', label: 'Mois dernier' },
  { key: 'last_quarter', label: 'Trimestre dernier' },
  { key: '6m', label: '6 derniers mois' },
  { key: 'year', label: 'Année en cours' },
  { key: '12m', label: '12 mois glissants' },
  { key: 'all', label: 'Tout' },
  { key: 'custom', label: 'Période personnalisée…' },
];

const formatDateFr = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const formatTickShort = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  } catch {
    return iso;
  }
};

const pad = (n: number) => String(n).padStart(2, '0');
const dateToISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;


const BiodiversityEvolutionChart: React.FC<Props> = ({ snapshots, marchesById, onNavigateToMarche, explorationId, allEventMarches, overrideTotalSpecies }) => {
  const [metric, setMetric] = useState<EvolutionMetric>('species');
  const [period, setPeriod] = useState<EvolutionPeriod>('all');
  const [dateSource, setDateSource] = useState<DateSource>('observation');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { series, byDay, firstDate, totalSpecies, totalObservations } = useBiodiversityEvolution(snapshots, {
    dateSource,
    metric,
    period,
  });

  const displayedSpecies = typeof overrideTotalSpecies === 'number' ? overrideTotalSpecies : totalSpecies;
  const headerCount = metric === 'species' ? displayedSpecies : totalObservations;
  const headerLabel = metric === 'species' ? (displayedSpecies > 1 ? 'espèces découvertes' : 'espèce découverte') : (totalObservations > 1 ? 'observations enregistrées' : 'observation enregistrée');

  const handleClick = (state: any) => {
    const payload = state?.activePayload?.[0]?.payload;
    if (payload?.date) setSelectedDay(payload.date);
  };

  const hasEnough = series.length >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-border bg-card p-4 sm:p-5 mb-5"
      data-chat-component="biodiversity-evolution-chart"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-foreground">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold">Pouls du vivant</h3>
          </div>
          {firstDate && (
            <p className="text-xs text-muted-foreground mt-1.5 ml-10">
              <span className="font-semibold text-foreground">{headerCount}</span>{' '}
              {headerLabel} depuis le {formatDateFr(firstDate)}
            </p>
          )}
        </div>

        {/* Metric toggle */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
          {(['species', 'observations'] as EvolutionMetric[]).map(m => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                metric === m ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m === 'species' ? <Leaf className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {m === 'species' ? 'Espèces' : 'Observations'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {!hasEnough ? (
        <div className="h-56 flex flex-col items-center justify-center text-center px-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/15 flex items-center justify-center mb-3">
            <Leaf className="w-5 h-5 text-primary/60" />
          </div>
          <p className="text-sm text-foreground font-medium">L'histoire commence à peine</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Revenez après la prochaine marche pour voir le pouls de la biodiversité s'animer.
          </p>
        </div>
      ) : (
        <div className="h-64 sm:h-72 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={series}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              onClick={handleClick}
            >
              <defs>
                <linearGradient id="bioCumulFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatTickShort}
                tick={{ fontSize: 10 }}
                className="fill-muted-foreground"
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10 }}
                className="fill-muted-foreground"
                width={28}
              />
              <Tooltip
                cursor={{ stroke: 'hsl(var(--primary))', strokeOpacity: 0.4, strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as any;
                  return (
                    <div className="rounded-lg border border-border bg-popover/95 backdrop-blur px-3 py-2 shadow-lg text-xs">
                      <div className="font-semibold text-foreground">{formatDateFr(p.date)}</div>
                      <div className="text-muted-foreground mt-0.5">
                        Cumul : <span className="text-foreground font-medium">{p.cumulative}</span> espèces
                      </div>
                      <div className="text-muted-foreground">
                        Ce jour : <span className="text-foreground font-medium">{p.daily}</span> {metric === 'species' ? 'espèce(s)' : 'obs.'}
                      </div>
                      {p.newSpeciesCount > 0 && (
                        <div className="text-primary mt-0.5 font-medium">+{p.newSpeciesCount} nouvelle{p.newSpeciesCount > 1 ? 's' : ''}</div>
                      )}
                      <div className="text-[10px] text-muted-foreground mt-1 italic">Cliquez pour voir les détails</div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="daily"
                fill="hsl(var(--muted-foreground))"
                fillOpacity={0.25}
                maxBarSize={14}
                radius={[2, 2, 0, 0]}
                style={{ cursor: 'pointer' }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#bioCumulFill)"
                activeDot={{ r: 5, stroke: 'hsl(var(--background))', strokeWidth: 2, style: { cursor: 'pointer' } }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {periodLabels.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
                period === p.key
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <button
            onClick={() => setDateSource(dateSource === 'observation' ? 'collection' : 'observation')}
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors"
            title={dateSource === 'observation' ? "Date à laquelle l'espèce a été observée sur le terrain" : 'Date à laquelle la donnée a été collectée par la plateforme'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dateSource === 'observation' ? 'bg-primary' : 'bg-muted-foreground'}`} />
            {dateSource === 'observation' ? 'Date terrain' : 'Date collecte'}
            <Info className="w-3 h-3 opacity-60" />
          </button>
        </div>
      </div>

      {/* Drawer */}
      <DayDetailDrawer
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        day={selectedDay}
        bucket={selectedDay ? byDay.get(selectedDay) || null : null}
        marchesById={marchesById}
        onNavigateToMarche={onNavigateToMarche}
        explorationId={explorationId}
        allEventMarches={allEventMarches}
      />
    </motion.div>
  );
};

export default BiodiversityEvolutionChart;
