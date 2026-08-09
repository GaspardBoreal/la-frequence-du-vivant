import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PartnerRoadmap } from '@/lib/partnerRoadmaps';
import { priorityEffort } from '@/lib/partnerRoadmaps';

const PALETTE = [
  'hsl(var(--primary))',
  '#c9a227',
  '#7aa88f',
  '#b07d4f',
  '#5f8fa6',
  '#9c6f8f',
];

/** Charge estimée par priorité (barres horizontales). */
export const EffortByPriorityChart: React.FC<{ roadmap: PartnerRoadmap }> = ({ roadmap }) => {
  const data = roadmap.priorities.map((p) => ({
    name: `${p.code}`,
    jours: priorityEffort(p.tasks),
    chantiers: p.tasks.length,
  }));

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <YAxis
            type="category"
            dataKey="name"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 8,
              fontSize: 12,
              color: 'hsl(var(--foreground))',
            }}
            formatter={(v: number, n: string) => [v, n === 'jours' ? 'Jours-homme' : 'Chantiers']}
          />
          <Bar dataKey="jours" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/** Répartition des retours de l'entretien par famille de sujet. */
export const ThemeFamilyChart: React.FC<{ roadmap: PartnerRoadmap }> = ({ roadmap }) => {
  const counts = new Map<string, number>();
  roadmap.themes.forEach((t) => counts.set(t.family, (counts.get(t.family) ?? 0) + 1));
  const data = Array.from(counts.entries()).map(([name, value]) => ({ name, value }));

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={44}
            outerRadius={78}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="transparent" />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            height={44}
            wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 8,
              fontSize: 12,
              color: 'hsl(var(--foreground))',
            }}
            formatter={(v: number) => [`${v} sujets`, '']}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

/** Courbe d'exemple sol / air illustrant la restitution capteurs cible (P3). */
export const SensorSampleChart: React.FC<{ roadmap: PartnerRoadmap }> = ({ roadmap }) => (
  <div className="h-[260px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={roadmap.sensorSample} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          unit="°"
          domain={['dataMin - 2', 'dataMax + 2']}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
            color: 'hsl(var(--foreground))',
          }}
          formatter={(v: number) => [`${v} °C`, '']}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }} />
        <Line type="monotone" dataKey="air" name="Air 3 m" stroke={PALETTE[1]} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="sol10" name="Surface 10 cm" stroke={PALETTE[0]} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="sol30" name="Sol 30 cm" stroke={PALETTE[2]} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="sol60" name="Sol 60 cm" stroke={PALETTE[4]} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);
