import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PERSONAS, PERSONA_ORDER, type PersonaKey } from '@/lib/marcheurPersonas';
import type { UsageRadarCell } from '@/hooks/useCommunityUsageDashboard';

interface Props { radar: UsageRadarCell[] }

const FEATURES = ['Carnet', 'Carte', 'Espèces', 'Chatbot', 'Audio', 'Outils', 'Quiz', 'Partage'];

export const FeatureRadar: React.FC<Props> = ({ radar }) => {
  const [selected, setSelected] = useState<PersonaKey[]>(['sentinelles_actives', 'ambassadeurs_latents', 'nouvelles_graines']);

  const chartData = useMemo(() => {
    // Normalise per feature (max = 100) across selected personas so the radar reads as % relative usage.
    const perPersonaMax: Record<string, number> = {};
    PERSONA_ORDER.forEach((k) => {
      const sum = radar.filter((r) => r.persona === k).reduce((a, r) => a + r.count, 0);
      perPersonaMax[k] = sum || 1;
    });
    return FEATURES.map((feature) => {
      const row: Record<string, string | number> = { feature };
      PERSONA_ORDER.forEach((k) => {
        const c = radar.find((r) => r.persona === k && r.feature === feature)?.count ?? 0;
        row[k] = Math.round((c / perPersonaMax[k]) * 100);
      });
      return row;
    });
  }, [radar]);

  const toggle = (k: PersonaKey) => setSelected((prev) =>
    prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
  );

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-foreground">Signature d'usage par persona</h3>
      <p className="text-xs text-muted-foreground mb-3">Répartition (%) de l'activité entre les 8 fonctions clés.</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PERSONA_ORDER.map((k) => (
          <button
            key={k}
            onClick={() => toggle(k)}
            className={`text-[11px] px-2 py-1 rounded-full border transition-all ${
              selected.includes(k) ? 'opacity-100 shadow-sm' : 'opacity-40 hover:opacity-80'
            }`}
            style={{
              borderColor: PERSONAS[k].color,
              background: selected.includes(k) ? `${PERSONAS[k].color}22` : 'transparent',
              color: PERSONAS[k].color,
            }}
          >
            {PERSONAS[k].emoji} {PERSONAS[k].label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <RadarChart data={chartData} outerRadius="75%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="feature" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
          {selected.map((k) => (
            <Radar
              key={k}
              name={PERSONAS[k].label}
              dataKey={k}
              stroke={PERSONAS[k].color}
              fill={PERSONAS[k].color}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          ))}
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }}
            formatter={(v) => `${v}%`}
          />
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default FeatureRadar;
