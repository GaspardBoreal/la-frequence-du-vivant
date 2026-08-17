import React from 'react';
import { CloudSun, Snowflake, Sun, Thermometer, Droplets, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openIotAi } from '@/components/iot/chatbot/iotChatFocus';
import type { SensorAnalysis } from '@/lib/iot/analyses';
import type { SensorSpan } from '@/hooks/iot/useIotTelemetry';
import CoverageLine from './CoverageLine';

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string; sub?: string }> = ({
  icon,
  label,
  value,
  sub,
}) => (
  <div className="rounded-xl border border-border/50 bg-background/60 p-3">
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
      {icon}
      {label}
    </div>
    <div className="mt-1 text-lg font-semibold leading-none">{value}</div>
    {sub && <div className="mt-1 text-[10px] text-muted-foreground">{sub}</div>}
  </div>
);

/**
 * Lecture d'une station météo : le climat du lieu, sans verdict de plantation.
 * Une station ne voit pas le sol — elle donne le cadre, pas la décision.
 */
const ClimateCard: React.FC<{ capteur: any; analysis: SensorAnalysis; span?: SensorSpan | null }> = ({
  capteur,
  analysis,
  span,
}) => {
  const c = analysis.climate;
  if (!c) return null;
  const v = analysis.verdict;
  const fmt = (n: number | null | undefined, u: string, d = 1) =>
    n == null || !Number.isFinite(n) ? '—' : `${n.toFixed(d)} ${u}`;

  return (
    <section className="rounded-2xl border border-border/60 bg-card/50 p-4">
      <header className="flex flex-wrap items-start gap-3">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ background: `${v.color}22`, color: v.color }}
        >
          <CloudSun className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{capteur?.nom ?? 'Station météo'}</h3>
            <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">
              Station météo · climat du lieu
            </span>
          </div>
          <p className="mt-0.5 text-sm font-medium" style={{ color: v.color }}>
            {v.title}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{v.detail}</p>
        </div>
      </header>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat
          icon={<Thermometer className="h-3 w-3" />}
          label="Air (moyenne)"
          value={fmt(c.air?.mean, '°C')}
          sub={c.air ? `min ${c.air.min} / max ${c.air.max} °C` : 'non transmise'}
        />
        <Stat
          icon={<Droplets className="h-3 w-3" />}
          label="Humidité de l’air"
          value={fmt(c.humidity?.mean, '%', 0)}
          sub={c.humidity ? `min ${c.humidity.min} / max ${c.humidity.max} %` : 'non transmise'}
        />
        <Stat
          icon={<Sun className="h-3 w-3" />}
          label="Amplitude jour-nuit"
          value={fmt(c.amplitude, '°C')}
          sub={c.amplitude == null ? '—' : c.amplitude > 12 ? 'site ouvert' : 'ambiance tamponnée'}
        />
        <Stat
          icon={<Snowflake className="h-3 w-3" />}
          label="Gel / chaleur"
          value={`${c.frostDays} / ${c.hotDays}`}
          sub={`jours sur ${c.days || 0}`}
        />
      </div>

      {v.missing.length > 0 && (
        <p className="mt-3 rounded-xl border border-dashed border-border/60 bg-background/40 p-2 text-[11px] text-muted-foreground">
          Non mesuré par cette station : {v.missing.join(' · ')}. Les décisions de plantation se lisent sur les sondes
          de sol voisines.
        </p>
      )}

      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            openIotAi({
              capteurId: capteur?.id,
              proprieteId: capteur?.propriete_id,
              prefill: `Que dit le climat mesuré par la station « ${capteur?.nom} » sur les ${analysis.windowDays} derniers jours, et quelles précautions pour les plantations du lieu ?`,
            })
          }
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Interroger l’IA de Jardin
        </Button>
      </div>
    </section>
  );
};

export default ClimateCard;
