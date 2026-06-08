import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Users, MapPin, Database } from 'lucide-react';
import { usePublicGlobalStats } from '@/hooks/usePublicGlobalStats';

interface CounterItemProps {
  icon: React.ReactNode;
  value: number | undefined;
  label: string;
  delay: number;
}

const CounterItem: React.FC<CounterItemProps> = ({ icon, value, label, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    viewport={{ once: true }}
    className="flex flex-col items-center text-center p-4"
  >
    <div className="w-12 h-12 rounded-full bg-emerald-900/50 border border-emerald-500/30 flex items-center justify-center mb-3">
      {icon}
    </div>
    <div className="text-3xl md:text-4xl font-crimson font-semibold text-foreground mb-1 tabular-nums">
      {typeof value === 'number' ? value.toLocaleString('fr-FR') : '—'}
    </div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </motion.div>
);

interface ScienceCountersProps {
  className?: string;
}

/**
 * Source de vérité unifiée avec /agent-ia (RPC get_public_global_stats).
 * Terminologie alignée : espèces tracées · domaines documentés · observations citoyennes.
 */
const ScienceCounters: React.FC<ScienceCountersProps> = ({ className = '' }) => {
  const { data: stats } = usePublicGlobalStats();

  const counters = [
    {
      icon: <Leaf className="w-5 h-5 text-emerald-400" />,
      value: stats?.especes_tracees,
      label: 'Espèces tracées',
    },
    {
      icon: <MapPin className="w-5 h-5 text-blue-400" />,
      value: stats?.domaines,
      label: 'Domaines documentés',
    },
    {
      icon: <Users className="w-5 h-5 text-amber-400" />,
      value: stats?.observations_citoyennes,
      label: 'Observations citoyennes',
    },
  ];

  return (
    <div className={`py-12 ${className}`}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/40 border border-emerald-500/20 rounded-full mb-4">
            <Database className="w-3 h-3 text-emerald-400" />
            <span className="font-mono text-xs uppercase tracking-wide text-emerald-300">
              Science Participative
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {counters.map((counter, index) => (
            <CounterItem
              key={counter.label}
              icon={counter.icon}
              value={counter.value}
              label={counter.label}
              delay={index * 0.15}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-6"
        >
          <span className="text-xs text-muted-foreground">
            Données certifiées connectées au{' '}
            <a
              href="https://www.gbif.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              GBIF
            </a>
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default ScienceCounters;
