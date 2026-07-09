import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, Flame, Users, Sparkles, HeartHandshake } from 'lucide-react';
import type { UsageDashboardPayload } from '@/hooks/useCommunityUsageDashboard';

interface Props { data: UsageDashboardPayload }

const HeroKpi: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string | number;
  hint?: string;
  color: string;
  spark?: { day: string; active_users: number }[];
  delay?: number;
}> = ({ icon: Icon, label, value, hint, color, spark, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6, ease: 'easeOut' }}
  >
    <Card className="relative overflow-hidden p-4 h-full">
      <div className="absolute inset-0 opacity-[0.07]" style={{
        background: `radial-gradient(circle at 100% 0%, ${color}, transparent 60%)`,
      }} />
      <div className="relative flex flex-col h-full">
        <div className="flex items-start justify-between">
          <div className="rounded-lg p-2" style={{ backgroundColor: `${color}22`, color }}>
            <Icon className="h-4 w-4" />
          </div>
          {hint && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{hint}</span>}
        </div>
        <div className="mt-3">
          <p className="text-3xl font-bold tabular-nums text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
        {spark && spark.length > 1 && (
          <div className="mt-2 h-10 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark}>
                <defs>
                  <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 11 }}
                  labelFormatter={(l) => new Date(l as string).toLocaleDateString('fr-FR')}
                />
                <Area type="monotone" dataKey="active_users" stroke={color} strokeWidth={2} fill={`url(#grad-${label})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  </motion.div>
);

export const SignalVitalHero: React.FC<Props> = ({ data }) => {
  const { kpis, daily, funnel } = data;
  const conversion = kpis.total_users > 0
    ? Math.round((kpis.with_participation / kpis.total_users) * 100)
    : 0;
  const retention = kpis.with_participation > 0
    ? Math.round((kpis.returning / kpis.with_participation) * 100)
    : 0;
  const frequenceCollective = Math.round(
    (kpis.avg_events_30d || 0) * 5 + (kpis.avg_contribs || 0) * 3,
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      <HeroKpi
        icon={Activity} color="hsl(160 60% 45%)"
        label="Actifs 7 j" hint="signal vital"
        value={kpis.dau_7d} spark={daily} delay={0.0}
      />
      <HeroKpi
        icon={Users} color="hsl(200 70% 50%)"
        label={`Actifs 30 j / ${kpis.total_users}`} hint="engagement"
        value={kpis.wau_30d} delay={0.1}
      />
      <HeroKpi
        icon={Flame} color="hsl(20 85% 55%)"
        label="Marcheurs récurrents" hint={`${retention}% fidélité`}
        value={kpis.returning} delay={0.2}
      />
      <HeroKpi
        icon={Sparkles} color="hsl(280 55% 55%)"
        label="Contributeurs" hint={`${kpis.avg_contribs} / marcheur`}
        value={kpis.contributors} delay={0.3}
      />
      <HeroKpi
        icon={HeartHandshake} color="hsl(340 65% 55%)"
        label={`Adhérents / ${conversion}% conversion`} hint={`fréquence ${frequenceCollective}`}
        value={funnel.adherents} delay={0.4}
      />
    </div>
  );
};

export default SignalVitalHero;
