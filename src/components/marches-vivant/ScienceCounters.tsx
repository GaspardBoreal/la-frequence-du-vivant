import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Users, MapPin, Database, FlaskConical, Radio } from 'lucide-react';
import { usePublicGlobalStats } from '@/hooks/usePublicGlobalStats';

interface CounterItemProps {
  icon: React.ReactNode;
  value: number | undefined;
  label: string;
  sublabel?: string;
  delay: number;
}

const CounterItem: React.FC<CounterItemProps> = ({ icon, value, label, sublabel, delay }) => (
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
    {sublabel && (
      <div className="text-[11px] text-muted-foreground/70 mt-1 leading-snug">{sublabel}</div>
    )}
  </motion.div>
);

interface ScienceCountersProps {
  className?: string;
}

/**
 * Source de vérité unifiée avec /agent-ia (RPC get_public_global_stats).
 * Tous les chiffres sont recalculés en base à chaque consultation.
 */
const ScienceCounters: React.FC<ScienceCountersProps> = ({ className = '' }) => {
  const { data: stats } = usePublicGlobalStats();

  const premiereMesure = stats?.premiere_mesure_capteur
    ? new Date(stats.premiere_mesure_capteur).toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      })
    : null;

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
    {
      icon: <Users className="w-5 h-5 text-cyan-400" />,
      value: stats?.marcheurs,
      label: 'Marcheurs',
    },
    {
      icon: <Layers className="w-5 h-5 text-orange-400" />,
      value: stats?.sols_documentes,
      label: 'Sols documentés',
      sublabel:
        typeof stats?.prelevements_analyses === 'number'
          ? `${stats.prelevements_analyses.toLocaleString('fr-FR')} prélèvements analysés`
          : undefined,
    },
    {
      icon: <Radio className="w-5 h-5 text-violet-400" />,
      value: stats?.mesures_capteurs,
      label: 'Mesures capteurs',
      sublabel: [
        typeof stats?.sondes_actives === 'number' ? `${stats.sondes_actives} sondes actives` : null,
        premiereMesure ? `depuis ${premiereMesure}` : null,
      ]
        .filter(Boolean)
        .join(' · ') || undefined,
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

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {counters.map((counter, index) => (
            <CounterItem
              key={counter.label}
              icon={counter.icon}
              value={counter.value}
              label={counter.label}
              sublabel={counter.sublabel}
              delay={index * 0.1}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-6 space-y-1"
        >
          <div className="text-xs text-muted-foreground">
            Données certifiées connectées au{' '}
            <a
              href="https://www.gbif.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              GBIF
            </a>
          </div>
          <div className="text-[11px] text-muted-foreground/70">
            Chiffres recalculés en direct à chaque consultation
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ScienceCounters;
