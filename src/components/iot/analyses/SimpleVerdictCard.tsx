import React from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openIotAi } from '@/components/iot/chatbot/iotChatFocus';
import { fmtMesure } from '@/lib/iot/grandeurs';
import { moistureLayers, type SensorAnalysis } from '@/lib/iot/analyses';
import type { PaletteFitRow } from '@/hooks/iot/useIotAnalyses';
import type { SensorSpan } from '@/hooks/iot/useIotTelemetry';
import CoverageLine from './CoverageLine';

const TrendIcon: React.FC<{ trend: string }> = ({ trend }) =>
  trend === 'up' ? (
    <ArrowUpRight className="h-3.5 w-3.5" />
  ) : trend === 'down' ? (
    <ArrowDownRight className="h-3.5 w-3.5" />
  ) : (
    <ArrowRight className="h-3.5 w-3.5" />
  );

const Dial: React.FC<{
  label: string;
  value: string;
  hint?: string | null;
  trend?: string;
  color?: string;
  missing?: boolean;
}> = ({ label, value, hint, trend, color, missing }) => (
  <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
    <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
    <div
      className={`mt-1 flex items-center gap-1.5 text-lg font-semibold ${missing ? 'text-muted-foreground' : ''}`}
      style={missing ? undefined : { color }}
    >
      {value}
      {trend && !missing ? <TrendIcon trend={trend} /> : null}
    </div>
    {hint ? <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div> : null}
  </div>
);

/** Niveau 1 — « Que planter ici, maintenant ? » lisible en trois secondes. */
const SimpleVerdictCard: React.FC<{
  capteur: any;
  analysis: SensorAnalysis;
  suggestions: PaletteFitRow[];
  span?: SensorSpan | null;
}> = ({ capteur, analysis, suggestions, span }) => {
  const { surface, deep } = moistureLayers(analysis.series);
  const soilT = analysis.series.find((s) => s.grandeur === 'soil_temperature') ?? null;
  const v = analysis.verdict;

  return (
    <section className="rounded-3xl border border-border/60 bg-card/60 p-5">
      <header className="flex flex-wrap items-start gap-3">
        <div
          className="mt-1 h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: v.color }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {capteur.nom} · {capteur.propriete?.nom ?? 'propriété inconnue'}
          </div>
          <h3 className="text-xl font-semibold" style={{ color: v.color }}>
            {v.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{v.detail}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            openIotAi({
              capteurId: capteur.id,
              proprieteId: capteur.propriete_id,
              prefill: `Que puis-je planter près de la sonde « ${capteur.nom} » au vu des mesures des ${analysis.windowDays} derniers jours ?`,
            })
          }
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Interroger l’IA
        </Button>
      </header>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Dial
          label="Humidité surface"
          value={surface ? fmtMesure(surface.last, 'soil_moisture', surface.unite) : 'non transmise'}
          hint={deep ? `Fond : ${fmtMesure(deep.last, 'soil_moisture', deep.unite)}` : null}
          trend={surface?.trend}
          color={surface?.color}
          missing={!surface}
        />
        <Dial
          label="Température du sol"
          value={soilT ? fmtMesure(soilT.last, 'soil_temperature', soilT.unite) : 'non transmise'}
          hint={soilT?.dailyAmplitude != null ? `Amplitude jour/nuit ${soilT.dailyAmplitude} °C` : null}
          trend={soilT?.trend}
          color={soilT?.color}
          missing={!soilT}
        />
        <Dial
          label="Lumière reçue"
          value={analysis.light ? `${analysis.light.hoursPerDay} h/j` : 'non transmise'}
          hint={analysis.light ? analysis.light.label : null}
          color="#c9a24a"
          missing={!analysis.light}
        />
        <Dial
          label="Pluie 7 jours"
          value={analysis.water.rain7d != null ? `${analysis.water.rain7d} mm` : 'non transmise'}
          hint={
            analysis.water.daysSinceRecharge != null
              ? `Dernière recharge du sol il y a ${analysis.water.daysSinceRecharge} j`
              : null
          }
          color="#3d7ea6"
          missing={analysis.water.rain7d == null}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-3">
        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Action conseillée</div>
        <div className="text-sm font-medium">{v.action}</div>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Trois espèces qui aiment ce coin
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {suggestions.slice(0, 3).map((s) => (
              <div key={s.id} className="rounded-2xl border border-border/60 bg-background/60 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="truncate text-sm font-medium">{s.fr}</div>
                  <div className="text-xs text-muted-foreground">{s.score}/100</div>
                </div>
                <div className="truncate text-[11px] italic text-muted-foreground">{s.latin}</div>
                <p className="mt-1 text-[11px] text-muted-foreground">{s.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {v.missing.length > 0 && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Pour aller plus loin, il manque : {v.missing.join(' · ')}.
        </p>
      )}

      <CoverageLine span={span} windowDays={analysis.windowDays} />
    </section>
  );
};

export default SimpleVerdictCard;
