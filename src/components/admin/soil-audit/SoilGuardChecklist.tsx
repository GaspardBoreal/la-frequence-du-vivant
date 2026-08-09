import React from 'react';
import { motion } from 'framer-motion';
import { Check, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Verdict } from './SoilGuardVerdictBanner';

export interface GuardCheck {
  id: string;
  label: string;
  detail: string;
  verdict: Verdict;
}

const ICONS = { ok: Check, warn: AlertTriangle, fail: X };
const TONE: Record<Verdict, string> = {
  ok: 'bg-primary/10 text-primary',
  warn: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  fail: 'bg-destructive/10 text-destructive',
};

export const SoilGuardChecklist: React.FC<{ checks: GuardCheck[] }> = ({ checks }) => (
  <ul className="space-y-3">
    {checks.map((c, i) => {
      const Icon = ICONS[c.verdict];
      return (
        <motion.li
          key={c.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
        >
          <span className={cn('shrink-0 rounded-full p-1.5', TONE[c.verdict])}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-medium text-foreground leading-snug">{c.label}</p>
            <p className="text-sm text-muted-foreground mt-0.5 break-words">{c.detail}</p>
          </div>
        </motion.li>
      );
    })}
  </ul>
);

export default SoilGuardChecklist;
