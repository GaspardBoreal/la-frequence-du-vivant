import React from 'react';
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts';
import { grandeurMeta } from '@/lib/iot/grandeurs';
import type { SensorAnalysis } from '@/lib/iot/analyses';

const fmtTick = (t: number) =>
  new Date(t).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

/** Niveau 2 — deux ou trois sondes sur la même grandeur : le jardin n'est pas homogène. */
const SensorCompare: React.FC<{
  capteurs: any[];
  byCapteur: Map<string, SensorAnalysis>;
}> = ({ capteurs, byCapteur }) => {
  const grandeurs = React.useMemo(() => {
    const set = new Set<string>();
    byCapteur.forEach((a) => a.series.forEach((s) => set.add(s.grandeur)));
    return [...set];
  }, [byCapteur]);

  const [grandeur, setGrandeur] = React.useState<string>('soil_moisture');
  const active = grandeurs.includes(grandeur) ? grandeur : grandeurs[0];

  const lines = React.useMemo(() => {
    if (!active) return [];
    return capteurs
      .map((c) => {
        const a = byCapteur.get(c.id);
        const s = a?.series.filter((x) => x.grandeur === active) ?? [];
        if (s.length === 0) return null;
        // Une seule courbe par sonde : la profondeur la plus fine.
        const best = [...s].sort((x, y) => (x.profondeur_m ?? 0) - (y.profondeur_m ?? 0))[0];
        return { capteur: c, serie: best };
      })
      .filter(Boolean) as Array<{ capteur: any; serie: any }>;
  }, [capteurs, byCapteur, active]);

  if (!active || lines.length < 2) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
        Le comparateur demande au moins deux sondes qui transmettent la même grandeur sur la fenêtre choisie.
      </div>
    );
  }

  const palette = ['#3f7f52', '#c2703d', '#2f6f8f', '#8e6ea8', '#c9a24a', '#6f8f8a'];
  const times = [...new Set(lines.flatMap((l) => l.serie.points.map((p: any) => p.t)))].sort((a, b) => a - b);
  const data = times.map((t) => {
    const row: any = { t };
    lines.forEach((l) => {
      const hit = l.serie.points.find((p: any) => p.t === t);
      if (hit) row[l.capteur.id] = hit.v;
    });
    return row;
  });

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="text-sm font-medium">Comparateur de sondes</div>
        <div className="ml-auto flex flex-wrap gap-1">
          {grandeurs.map((g) => (
            <button
              key={g}
              onClick={() => setGrandeur(g)}
              className={`rounded-full px-3 py-1 text-[11px] transition ${
                g === active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {grandeurMeta(g).label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
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
            {lines.map((l, i) => (
              <Line
                key={l.capteur.id}
                type="monotone"
                dataKey={l.capteur.id}
                name={`${l.capteur.nom}${l.serie.profondeur_m != null ? ` · ${Math.round(l.serie.profondeur_m * 100)} cm` : ''}`}
                stroke={palette[i % palette.length]}
                dot={false}
                strokeWidth={1.6}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
        {lines.map((l) => (
          <div key={l.capteur.id}>
            <span className="font-medium text-foreground">{l.capteur.nom}</span> · moy {l.serie.mean} {l.serie.unite}
            {' · '}min {l.serie.min} / max {l.serie.max}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SensorCompare;
