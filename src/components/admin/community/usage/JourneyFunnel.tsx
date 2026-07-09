import React from 'react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import type { UsageFunnel } from '@/hooks/useCommunityUsageDashboard';

interface Props { funnel: UsageFunnel }

const STAGES: { key: keyof UsageFunnel; label: string; color: string }[] = [
  { key: 'inscrits',     label: 'Inscrits',            color: 'hsl(200 70% 50%)' },
  { key: 'actifs_30d',   label: 'Actifs 30 j',         color: 'hsl(180 60% 45%)' },
  { key: 'participants', label: '≥ 1 marche',          color: 'hsl(160 60% 45%)' },
  { key: 'fideles',      label: '≥ 2 marches',         color: 'hsl(140 55% 45%)' },
  { key: 'contributeurs',label: 'Contributeurs',       color: 'hsl(280 55% 55%)' },
  { key: 'adherents',    label: 'Adhérents',           color: 'hsl(340 65% 55%)' },
];

export const JourneyFunnel: React.FC<Props> = ({ funnel }) => {
  const base = Math.max(funnel.inscrits, 1);
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-foreground">Parcours-type marcheur</h3>
      <p className="text-xs text-muted-foreground mb-4">Détecte les points de fuite pour cibler la relance.</p>
      <div className="space-y-2">
        {STAGES.map((s, idx) => {
          const value = funnel[s.key] as number;
          const pct = Math.round((value / base) * 100);
          const prevValue = idx > 0 ? (funnel[STAGES[idx - 1].key] as number) : value;
          const dropoff = idx > 0 && prevValue > 0 ? Math.round(100 - (value / prevValue) * 100) : 0;
          return (
            <div key={s.key} className="flex items-center gap-3">
              <div className="w-32 text-xs text-muted-foreground text-right">{s.label}</div>
              <div className="flex-1 relative h-8 bg-muted/40 rounded-md overflow-hidden">
                <motion.div
                  className="h-full flex items-center px-3 text-xs font-semibold text-white"
                  style={{ background: s.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(pct, 2)}%` }}
                  transition={{ delay: idx * 0.1, duration: 0.7, ease: 'easeOut' }}
                >
                  <span className="tabular-nums">{value}</span>
                  <span className="ml-2 opacity-80">{pct}%</span>
                </motion.div>
              </div>
              <div className="w-16 text-xs text-right">
                {idx > 0 && dropoff > 0 ? (
                  <span className="text-orange-500">−{dropoff}%</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default JourneyFunnel;
