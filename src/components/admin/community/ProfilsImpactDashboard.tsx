import React from 'react';
import { Card } from '@/components/ui/card';
import { useCommunityImpactAggregates } from '@/hooks/useCommunityImpactAggregates';
import { AGE_BRACKETS, CSP_OPTIONS, GENDER_OPTIONS } from '@/lib/communityProfileTaxonomy';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Treemap,
} from 'recharts';
import { Users, MapPinned, Sprout, HeartHandshake, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const GENDER_COLORS: Record<string, string> = {
  femme: 'hsl(340 70% 60%)',
  homme: 'hsl(200 70% 55%)',
  non_binaire: 'hsl(280 60% 65%)',
  prefere_ne_pas_dire: 'hsl(220 10% 60%)',
  inconnu: 'hsl(220 5% 75%)',
};

const TREEMAP_COLORS = [
  'hsl(160 60% 45%)', 'hsl(180 55% 40%)', 'hsl(140 50% 50%)',
  'hsl(200 55% 50%)', 'hsl(40 70% 55%)', 'hsl(20 70% 55%)',
  'hsl(280 50% 55%)', 'hsl(340 60% 60%)', 'hsl(120 45% 45%)',
  'hsl(220 30% 55%)',
];

const Counter: React.FC<{ value: number; label: string; icon: React.ElementType; color: string }> = ({ value, label, icon: Icon, color }) => (
  <Card className="p-4 relative overflow-hidden">
    <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at top right, ${color}, transparent 60%)` }} />
    <div className="relative flex items-start gap-3">
      <div className="rounded-lg p-2" style={{ backgroundColor: `${color}20`, color }}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <motion.p
          className="text-3xl font-bold text-foreground tabular-nums"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {value.toLocaleString('fr-FR')}
        </motion.p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  </Card>
);

interface ProfilsImpactDashboardProps {
  /** Restreint les agrégats aux participant·e·s d'un événement précis. */
  eventId?: string | null;
}

export const ProfilsImpactDashboard: React.FC<ProfilsImpactDashboardProps> = ({ eventId }) => {
  const { data, isLoading } = useCommunityImpactAggregates(eventId ?? null);

  if (isLoading || !data) {
    return <div className="text-muted-foreground text-sm">Chargement des indicateurs d'impact…</div>;
  }

  const ageData = AGE_BRACKETS
    .filter(b => b.value !== 'inconnu')
    .map(b => ({ name: b.label, range: b.range, value: data.by_age[b.value] || 0 }));

  const genderData = GENDER_OPTIONS.map(g => ({
    name: g.label,
    value: data.by_gender[g.value] || 0,
    color: GENDER_COLORS[g.value],
  })).filter(d => d.value > 0);

  const cspData = CSP_OPTIONS.map((c, i) => ({
    name: c.short,
    size: data.by_csp[c.value] || 0,
    fill: TREEMAP_COLORS[i % TREEMAP_COLORS.length],
  })).filter(d => d.size > 0);

  return (
    <div className="space-y-6">
      {/* Compteurs animés */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Counter value={data.total} label="Marcheur·euse·s" icon={Users} color="hsl(160 60% 45%)" />
        <Counter value={data.territories_count} label="Territoires touchés" icon={MapPinned} color="hsl(40 70% 55%)" />
        <Counter value={data.with_csp} label="Activités renseignées" icon={Sprout} color="hsl(120 45% 45%)" />
        <Counter value={data.with_gender} label="Genres renseignés" icon={HeartHandshake} color="hsl(340 60% 60%)" />
        <Counter value={data.with_birthdate} label="Âges renseignés" icon={Sparkles} color="hsl(280 50% 55%)" />
      </div>

      {/* Dataviz */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pyramide des âges */}
        <Card className="p-4 lg:col-span-1">
          <h4 className="text-sm font-semibold text-foreground mb-1">Pyramide des âges</h4>
          <p className="text-xs text-muted-foreground mb-3">Comment les Marches du Vivant relient les générations</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ageData} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} width={100} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number, _n, p) => [`${v} marcheur·euse·s`, p.payload.range]}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Donut Genre */}
        <Card className="p-4">
          <h4 className="text-sm font-semibold text-foreground mb-1">Tisser la diversité</h4>
          <p className="text-xs text-muted-foreground mb-3">Représentations des genres parmi les marcheurs</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={genderData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                {genderData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
            {genderData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                <span className="text-muted-foreground">
                  {d.name} <span className="text-foreground font-medium">({d.value})</span>
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Treemap CSP */}
        <Card className="p-4">
          <h4 className="text-sm font-semibold text-foreground mb-1">Mosaïque des activités</h4>
          <p className="text-xs text-muted-foreground mb-3">Tous les métiers convergent vers le vivant</p>
          {cspData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <Treemap data={cspData} dataKey="size" stroke="hsl(var(--background))" />
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
              Aucune activité renseignée pour l'instant.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProfilsImpactDashboard;
