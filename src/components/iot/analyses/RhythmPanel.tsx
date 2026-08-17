import React from 'react';
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts';
import MoistureCarpet from './MoistureCarpet';
import type { SensorAnalysis } from '@/lib/iot/analyses';

const fmtTick = (t: number) =>
  new Date(t).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

/** Superpose les séries choisies sur une même horloge. */
const MultiLine: React.FC<{ analysis: SensorAnalysis; grandeurs: string[]; title: string; hint: string }> = ({
  analysis, grandeurs, title, hint,
}) => {
  const series = analysis.series.filter((s) => grandeurs.includes(s.grandeur));
  if (series.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
        <div className="text-sm font-medium">{title}</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Grandeur non transmise par cette sonde sur la fenêtre choisie.
        </p>
      </div>
    );
  }

  const times = [...new Set(series.flatMap((s) => s.points.map((p) => p.t)))].sort((a, b) => a - b);
  const data = times.map((t) => {
    const row: any = { t };
    series.forEach((s) => {
      const hit = s.points.find((p) => p.t === t);
      if (hit) row[s.key] = hit.v;
    });
    return row;
  });

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
      <div className="mb-1 text-sm font-medium">{title}</div>
      <p className="mb-3 text-[11px] text-muted-foreground">{hint}</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="t"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={fmtTick}
              tick={{ fontSize: 10 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              labelFormatter={(t) => new Date(Number(t)).toLocaleString('fr-FR')}
              contentStyle={{ fontSize: 12, borderRadius: 12, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={`${s.label} (${s.unite})`}
                stroke={s.color}
                dot={false}
                strokeWidth={1.6}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
        {series.map((s) => (
          <div key={s.key}>
            <span className="font-medium text-foreground">{s.label}</span> · min {s.min} / moy {s.mean} / max {s.max} {s.unite}
            {s.dailyAmplitude != null ? ` · amplitude jour-nuit ${s.dailyAmplitude}` : ''}
          </div>
        ))}
      </div>
    </div>
  );
};

/** Niveau 2 — comment ce coin respire. */
const RhythmPanel: React.FC<{ analysis: SensorAnalysis }> = ({ analysis }) => {
  const w = analysis.water;
  const soilT = analysis.series.find((s) => s.grandeur === 'soil_temperature');
  const airT = analysis.series.find((s) => s.grandeur === 'air_temperature');
  const amplitude = soilT?.dailyAmplitude ?? null;

  return (
    <div className="space-y-4">
      <MoistureCarpet rows={analysis.carpet} />

      <MultiLine
        analysis={analysis}
        grandeurs={['soil_temperature', 'air_temperature']}
        title="La respiration jour / nuit"
        hint="Une forte amplitude thermique du sol signale un sol nu et exposé ; une faible amplitude, un sol couvert, paillé ou vivant."
      />

      {amplitude != null && (
        <div className="rounded-2xl border border-border/60 bg-card/40 p-4 text-sm">
          <span className="font-medium">Lecture : </span>
          {amplitude > 8
            ? `le sol encaisse ${amplitude} °C d’écart chaque jour — surface nue ou très exposée, le paillage changerait tout.`
            : amplitude > 4
              ? `${amplitude} °C d’écart quotidien — couverture partielle, les jeunes plants souffriront en plein été.`
              : `${amplitude} °C d’écart seulement — sol bien couvert, l’inertie protège les racines.`}
          {airT?.dailyAmplitude != null ? ` L’air, lui, varie de ${airT.dailyAmplitude} °C.` : ''}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
          <div className="text-sm font-medium">Le budget d’eau</div>
          <dl className="mt-2 space-y-1.5 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Pluie sur la fenêtre</dt>
              <dd>{w.rainWindow != null ? `${w.rainWindow} mm` : 'non transmise'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Pluie 7 jours</dt>
              <dd>{w.rain7d != null ? `${w.rain7d} mm` : 'non transmise'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Assèchement observé</dt>
              <dd>{w.dryingPerDay != null ? `${w.dryingPerDay} pt/jour` : 'non calculable'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Dernière recharge du sol</dt>
              <dd>{w.daysSinceRecharge != null ? `il y a ${w.daysSinceRecharge} j` : 'aucune détectée'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Seuil « réserve juste » atteint dans</dt>
              <dd>{w.daysToThreshold != null ? `~${w.daysToThreshold} j` : '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
          <div className="text-sm font-medium">La lumière disponible</div>
          {analysis.light ? (
            <>
              <div className="mt-1 text-2xl font-semibold" style={{ color: '#c9a24a' }}>
                {analysis.light.hoursPerDay} h/j · {analysis.light.label}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Heures où la sonde reçoit plus de 2 000 lx — la clé du choix des strates.
              </p>
              <div className="mt-3 flex items-end gap-[3px]">
                {analysis.light.days.slice(-30).map((d) => (
                  <div
                    key={d.day}
                    title={`${d.day} · ${d.hours} h`}
                    className="flex-1 rounded-t-[2px] bg-amber-500/70"
                    style={{ height: `${Math.max(3, (d.hours / 16) * 60)}px` }}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Luminosité non transmise : l’exposition ne peut pas être déduite ici. Une sonde météo voisine peut servir de repère.
            </p>
          )}
        </div>
      </div>

      <MultiLine
        analysis={analysis}
        grandeurs={['soil_moisture']}
        title="Humidité du sol, profondeur par profondeur"
        hint="Les remontées après pluie et les descentes lentes racontent la réserve utile réelle du sol."
      />
    </div>
  );
};

export default RhythmPanel;
