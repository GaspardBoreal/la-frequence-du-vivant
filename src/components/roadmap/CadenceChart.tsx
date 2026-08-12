import React from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { RoadmapEntry, RoadmapWeek } from '@/lib/roadmap/types';

interface Props {
  weeks: RoadmapWeek[];
  entries: RoadmapEntry[];
}

/** Cadence de livraison : nouveautés publiées par semaine (12 dernières). */
const CadenceChart: React.FC<Props> = ({ weeks, entries }) => {
  const data = [...weeks]
    .sort((a, b) => (a.iso_year - b.iso_year) || (a.iso_week - b.iso_week))
    .slice(-12)
    .map((w) => ({
      name: `S${w.iso_week}`,
      nouveautes: entries.filter((e) => e.week_id === w.id).length,
    }));

  if (data.length === 0) return null;

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 8,
              fontSize: 12,
              color: 'hsl(var(--foreground))',
            }}
            formatter={(v: number) => [`${v} nouveautés`, '']}
          />
          <Bar dataKey="nouveautes" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill="hsl(var(--primary))" fillOpacity={0.45 + (i / data.length) * 0.55} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CadenceChart;
