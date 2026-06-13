import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  Activity, Info, Leaf, Eye, CalendarIcon,
  Trophy, TrendingUp, CalendarDays, Flame, Sparkles, Users, Star,
} from 'lucide-react';
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
  marcheurObs?: any[] | undefined;
  marchesById?: Map<string, { name: string; ville?: string; latitude?: number; longitude?: number }>;
  onNavigateToMarche?: (marcheId: string) => void;
  explorationId?: string;
  allEventMarches?: SpeciesMarcheData[];
  overrideTotalSpecies?: number;
  period?: EvolutionPeriod;
  onPeriodChange?: (p: EvolutionPeriod) => void;
  customRange?: { from?: string; to?: string };
  onCustomRangeChange?: (r: { from?: string; to?: string }) => void;
  dateSource?: DateSource;
  onDateSourceChange?: (s: DateSource) => void;
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
  } catch { return iso; }
};
const formatDateShort = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch { return iso; }
};
const formatTickShort = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  } catch { return iso; }
};

const pad = (n: number) => String(n).padStart(2, '0');
const dateToISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISOToDate = (s?: string): Date | undefined => {
  if (!s) return undefined;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};

// ─────────────────────────────────────────────
// KPI strip (vue Observations uniquement)
// ─────────────────────────────────────────────
interface KpiChipProps {
  icon: React.ComponentType<{ className?: string }>;
  value: React.ReactNode;
  label: string;
  hint?: string;
  tone?: 'default' | 'accent';
}
const KpiChip: React.FC<KpiChipProps> = ({ icon: Icon, value, label, hint, tone = 'default' }) => (
  <div
    className={cn(
      'flex-shrink-0 snap-start min-w-[140px] sm:min-w-0 rounded-xl border p-3 transition-transform hover:scale-[1.02]',
      tone === 'accent'
        ? 'border-primary/40 bg-gradient-to-br from-primary/15 to-primary/5'
        : 'border-border bg-gradient-to-br from-primary/5 to-transparent',
    )}
  >
    <div className="flex items-center gap-1.5 mb-1">
      <Icon className={cn('w-3.5 h-3.5', tone === 'accent' ? 'text-primary' : 'text-muted-foreground')} />
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium truncate">{label}</span>
    </div>
    <div className="text-xl sm:text-2xl font-bold tabular-nums leading-tight text-foreground">{value}</div>
    {hint && <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{hint}</div>}
  </div>
);

const BiodiversityEvolutionChart: React.FC<Props> = ({
  snapshots, marcheurObs, marchesById, onNavigateToMarche, explorationId, allEventMarches, overrideTotalSpecies,
  period: periodProp, onPeriodChange,
  customRange: customRangeProp, onCustomRangeChange,
  dateSource: dateSourceProp, onDateSourceChange,
}) => {
  const [metric, setMetric] = useState<EvolutionMetric>('species');
  const [periodLocal, setPeriodLocal] = useState<EvolutionPeriod>('all');
  const [customRangeLocal, setCustomRangeLocal] = useState<{ from?: string; to?: string }>({});
  const [dateSourceLocal, setDateSourceLocal] = useState<DateSource>('observation');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const period = periodProp ?? periodLocal;
  const customRange = customRangeProp ?? customRangeLocal;
  const dateSource = dateSourceProp ?? dateSourceLocal;

  const setPeriod = (p: EvolutionPeriod) => {
    if (onPeriodChange) onPeriodChange(p); else setPeriodLocal(p);
  };
  const setCustomRange = (r: { from?: string; to?: string }) => {
    if (onCustomRangeChange) onCustomRangeChange(r); else setCustomRangeLocal(r);
  };
  const setDateSource = (s: DateSource) => {
    if (onDateSourceChange) onDateSourceChange(s); else setDateSourceLocal(s);
  };

  const customFrom = fromISOToDate(customRange?.from);
  const customTo = fromISOToDate(customRange?.to);

  const { series, byDay, firstDate, totalSpecies, totalObservations } = useBiodiversityEvolution(
    snapshots,
    {
      dateSource,
      metric,
      period,
      customRange: period === 'custom' ? customRange : undefined,
    },
    marcheurObs,
  );

  const isObservations = metric === 'observations';

  // ── Données dérivées pour la vue Observations (KPI + highlight) ──
  const maxDaily = useMemo(() => {
    if (!isObservations || !series.length) return 0;
    return series.reduce((m, p) => Math.max(m, p.observationsDaily), 0);
  }, [series, isObservations]);

  const avgPerActiveDay = useMemo(() => {
    if (!series.length) return 0;
    const total = series.reduce((s, p) => s + p.observationsDaily, 0);
    const active = series.filter(p => p.observationsDaily > 0).length;
    return active ? total / active : 0;
  }, [series]);

  const kpis = useMemo(() => {
    if (!isObservations || !series.length) return null;

    const total = series.reduce((s, p) => s + p.observationsDaily, 0);
    const activeDays = series.filter(p => p.observationsDaily > 0).length;
    const totalDays = series.length;
    const newSpeciesTotal = series.reduce((s, p) => s + p.newSpeciesCount, 0);

    // Jour record
    let recordPoint = series[0];
    series.forEach(p => { if (p.observationsDaily > recordPoint.observationsDaily) recordPoint = p; });

    // Streak en cours (depuis la fin)
    let streak = 0;
    for (let i = series.length - 1; i >= 0; i--) {
      if (series[i].observationsDaily > 0) streak++; else break;
    }

    // Contributeurs uniques + Top espèce sur la période
    const contributors = new Set<string>();
    const speciesCount = new Map<string, { count: number; fr?: string | null; sci: string }>();
    series.forEach(p => {
      const bucket = byDay.get(p.date);
      if (!bucket) return;
      bucket.observations.forEach(o => {
        if (o.observerName) contributors.add(o.observerName.toLowerCase());
        const key = o.scientificName.toLowerCase();
        const cur = speciesCount.get(key) || { count: 0, fr: o.commonNameFr, sci: o.scientificName };
        cur.count += 1;
        if (!cur.fr && o.commonNameFr) cur.fr = o.commonNameFr;
        speciesCount.set(key, cur);
      });
    });
    let topSpecies: { count: number; fr?: string | null; sci: string } | null = null;
    speciesCount.forEach(v => { if (!topSpecies || v.count > topSpecies.count) topSpecies = v; });

    const newSpeciesShare = total > 0 ? Math.round((newSpeciesTotal / total) * 100) : 0;

    return {
      total,
      recordPoint,
      avgPerActive: activeDays ? total / activeDays : 0,
      activeDays,
      totalDays,
      streak,
      newSpeciesTotal,
      newSpeciesShare,
      contributorsCount: contributors.size,
      topSpecies,
    };
  }, [isObservations, series, byDay]);

  const displayedSpecies = typeof overrideTotalSpecies === 'number' ? overrideTotalSpecies : totalSpecies;
  const headerCount = metric === 'species' ? displayedSpecies : totalObservations;
  const headerLabel = metric === 'species'
    ? (displayedSpecies > 1 ? 'espèces découvertes' : 'espèce découverte')
    : (totalObservations > 1 ? 'observations enregistrées' : 'observation enregistrée');

  const handleClick = (state: any) => {
    const payload = state?.activePayload?.[0]?.payload;
    if (payload?.date) setSelectedDay(payload.date);
  };

  const hasEnough = series.length >= 1;

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
          {firstDate && !isObservations && (
            <p className="text-xs text-muted-foreground mt-1.5 ml-10">
              <span className="font-semibold text-foreground">{headerCount}</span>{' '}
              {headerLabel} depuis le {formatDateFr(firstDate)}
            </p>
          )}
          {firstDate && isObservations && (
            <p className="text-[11px] text-muted-foreground mt-1.5 ml-10">
              Depuis le {formatDateFr(firstDate)} · vue détaillée des observations
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

      {/* ── KPI strip (Observations uniquement) ── */}
      {isObservations && kpis && hasEnough && (
        <div className="relative -mx-1 mb-4">
          <div className="flex sm:grid sm:grid-cols-4 lg:grid-cols-8 gap-2 overflow-x-auto snap-x snap-mandatory px-1 pb-1 scrollbar-thin">
            <KpiChip icon={Eye} value={kpis.total.toLocaleString('fr-FR')} label="Total obs" tone="accent" />
            <KpiChip
              icon={Trophy}
              value={kpis.recordPoint.observationsDaily}
              label="Jour record"
              hint={formatDateShort(kpis.recordPoint.date)}
            />
            <KpiChip
              icon={TrendingUp}
              value={kpis.avgPerActive.toFixed(1)}
              label="Moy / jour actif"
            />
            <KpiChip
              icon={CalendarDays}
              value={`${kpis.activeDays}/${kpis.totalDays}`}
              label="Jours actifs"
              hint={kpis.totalDays > 0 ? `${Math.round((kpis.activeDays / kpis.totalDays) * 100)}% couverts` : undefined}
            />
            <KpiChip
              icon={Flame}
              value={kpis.streak}
              label="Streak actuel"
              hint={kpis.streak > 1 ? 'jours consécutifs' : 'jour'}
            />
            <KpiChip
              icon={Sparkles}
              value={kpis.newSpeciesTotal}
              label="Nouv. espèces"
              hint={`${kpis.newSpeciesShare}% des obs.`}
            />
            <KpiChip
              icon={Users}
              value={kpis.contributorsCount}
              label="Contributeurs"
            />
            <KpiChip
              icon={Star}
              value={kpis.topSpecies ? kpis.topSpecies.count : 0}
              label="Top espèce"
              hint={kpis.topSpecies ? (kpis.topSpecies.fr || kpis.topSpecies.sci) : undefined}
            />
          </div>
          {/* fade hints mobile */}
          <div className="sm:hidden pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-card to-transparent" />
          <div className="sm:hidden pointer-events-none absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-card to-transparent" />
        </div>
      )}

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
        <div className={cn(isObservations ? 'h-80 sm:h-96' : 'h-64 sm:h-72', '-mx-2')}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={series}
              margin={{ top: isObservations ? 20 : 8, right: 12, left: 0, bottom: 0 }}
              onClick={handleClick}
            >
              <defs>
                <linearGradient id="bioCumulFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="obsBarFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                </linearGradient>
                <linearGradient id="obsBarRecord" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatTickShort}
                tick={{ fontSize: 10 }}
                className="fill-muted-foreground"
                interval="preserveStartEnd"
                minTickGap={isObservations ? 32 : 24}
              />
              <YAxis
                yAxisId="left"
                allowDecimals={false}
                tick={{ fontSize: 10 }}
                className="fill-muted-foreground"
                width={isObservations ? 24 : 28}
              />
              {isObservations && (
                <YAxis yAxisId="right" orientation="right" hide />
              )}
              <Tooltip
                cursor={{ stroke: 'hsl(var(--primary))', strokeOpacity: 0.4, strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as any;
                  const obs = p.observationsDaily ?? p.daily;
                  const vsAvg = avgPerActiveDay > 0 && isObservations
                    ? Math.round(((obs - avgPerActiveDay) / avgPerActiveDay) * 100)
                    : null;
                  return (
                    <div className="rounded-lg border border-border bg-popover/95 backdrop-blur px-3 py-2 shadow-lg text-xs">
                      <div className="font-semibold text-foreground">{formatDateFr(p.date)}</div>
                      {isObservations ? (
                        <>
                          <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold tabular-nums text-primary">{obs}</span>
                            <span className="text-[11px] text-muted-foreground">observation{obs > 1 ? 's' : ''}</span>
                          </div>
                          {vsAvg !== null && obs > 0 && (
                            <div className={cn('text-[10px] mt-0.5', vsAvg >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
                              {vsAvg >= 0 ? '+' : ''}{vsAvg}% vs moyenne période
                            </div>
                          )}
                          <div className="mt-1.5 pt-1.5 border-t border-border text-[10px] text-muted-foreground">
                            Cumul espèces : <span className="text-foreground font-medium">{p.cumulative}</span>
                          </div>
                          {p.newSpeciesCount > 0 && (
                            <div className="text-primary text-[10px] font-medium">+{p.newSpeciesCount} nouvelle{p.newSpeciesCount > 1 ? 's' : ''}</div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="text-muted-foreground mt-0.5">
                            Cumul : <span className="text-foreground font-medium">{p.cumulative}</span> espèces
                          </div>
                          <div className="text-muted-foreground">
                            Ce jour : <span className="text-foreground font-medium">{p.daily}</span> espèce(s)
                          </div>
                          {p.newSpeciesCount > 0 && (
                            <div className="text-primary mt-0.5 font-medium">+{p.newSpeciesCount} nouvelle{p.newSpeciesCount > 1 ? 's' : ''}</div>
                          )}
                        </>
                      )}
                      <div className="text-[10px] text-muted-foreground mt-1 italic">Cliquez pour voir les détails</div>
                    </div>
                  );
                }}
              />
              {isObservations ? (
                <>
                  {/* Barres XXL avec mise en valeur du jour record */}
                  <Bar
                    yAxisId="left"
                    dataKey="observationsDaily"
                    maxBarSize={42}
                    radius={[6, 6, 0, 0]}
                    style={{ cursor: 'pointer' }}
                  >
                    {series.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.observationsDaily === maxDaily && maxDaily > 0
                          ? 'url(#obsBarRecord)'
                          : 'url(#obsBarFill)'}
                      />
                    ))}
                    <LabelList
                      dataKey="observationsDaily"
                      position="top"
                      style={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      formatter={(v: any) => (v === maxDaily && maxDaily > 0 ? String(v) : '')}
                    />
                  </Bar>
                  {/* Courbe espèces discrète, axe droit caché */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cumulative"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                </>
              ) : (
                <>
                  <Bar
                    yAxisId="left"
                    dataKey="daily"
                    fill="hsl(var(--muted-foreground))"
                    fillOpacity={0.25}
                    maxBarSize={14}
                    radius={[2, 2, 0, 0]}
                    style={{ cursor: 'pointer' }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="cumulative"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#bioCumulFill)"
                    dot={{ r: 4, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                    activeDot={{ r: 5, stroke: 'hsl(var(--background))', strokeWidth: 2, style: { cursor: 'pointer' } }}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {isObservations && hasEnough && (
        <div className="flex items-center justify-end gap-3 mt-1 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary/80" />
            Observations / jour
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-px border-t border-dashed border-muted-foreground/60" />
            Cumul espèces (réf.)
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={period} onValueChange={(v) => setPeriod(v as EvolutionPeriod)}>
            <SelectTrigger className="h-8 w-auto min-w-[170px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map(p => (
                <SelectItem key={p.key} value={p.key} className="text-xs">
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {period === 'custom' && (
            <div className="flex items-center gap-1.5">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn('h-8 px-2 text-xs font-normal', !customFrom && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    {customFrom ? format(customFrom, 'd MMM yyyy', { locale: fr }) : 'Début'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customFrom}
                    onSelect={(d) => setCustomRange({ from: d ? dateToISO(d) : undefined, to: customRange?.to })}
                    locale={fr}
                    initialFocus
                    className={cn('p-3 pointer-events-auto')}
                  />
                </PopoverContent>
              </Popover>
              <span className="text-xs text-muted-foreground">→</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn('h-8 px-2 text-xs font-normal', !customTo && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    {customTo ? format(customTo, 'd MMM yyyy', { locale: fr }) : 'Fin'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customTo}
                    onSelect={(d) => setCustomRange({ from: customRange?.from, to: d ? dateToISO(d) : undefined })}
                    locale={fr}
                    disabled={(d) => customFrom ? d < customFrom : false}
                    initialFocus
                    className={cn('p-3 pointer-events-auto')}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
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
