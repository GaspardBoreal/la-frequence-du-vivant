import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Verdict = 'ok' | 'warn' | 'fail';

interface Props {
  verdict: Verdict;
  title: string;
  subtitle: string;
}

const ICONS = { ok: ShieldCheck, warn: ShieldQuestion, fail: ShieldAlert };

const TONE: Record<Verdict, string> = {
  ok: 'border-primary/40 bg-primary/5 text-primary',
  warn: 'border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400',
  fail: 'border-destructive/40 bg-destructive/5 text-destructive',
};

export const SoilGuardVerdictBanner: React.FC<Props> = ({ verdict, title, subtitle }) => {
  const Icon = ICONS[verdict];
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn('rounded-xl border p-5 sm:p-6 flex items-start gap-4', TONE[verdict])}
    >
      <motion.span
        initial={{ scale: 0.7 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        className="shrink-0 mt-0.5"
      >
        <Icon className="h-7 w-7" aria-hidden="true" />
      </motion.span>
      <div className="min-w-0">
        <h2 className="text-lg sm:text-xl font-semibold leading-tight">{title}</h2>
        <p className="text-sm mt-1 text-muted-foreground">{subtitle}</p>
      </div>
    </motion.div>
  );
};

export default SoilGuardVerdictBanner;
