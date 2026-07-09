import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PERSONAS, PERSONA_ORDER } from '@/lib/marcheurPersonas';
import type { UsageDashboardPayload } from '@/hooks/useCommunityUsageDashboard';

interface Props { data: UsageDashboardPayload; open: boolean; onClose: () => void }

const Metric: React.FC<{ value: string | number; label: string; sub?: string; delay?: number }> = ({ value, label, sub, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.7, ease: 'easeOut' }}
    className="text-center"
  >
    <div className="text-6xl md:text-7xl font-bold tabular-nums bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
      {value}
    </div>
    <div className="text-sm md:text-base uppercase tracking-widest text-white/70 mt-2">{label}</div>
    {sub && <div className="text-xs text-white/50 mt-1">{sub}</div>}
  </motion.div>
);

export const PitchModeOverlay: React.FC<Props> = ({ data, open, onClose }) => {
  const { kpis, funnel, personas } = data;
  const personaTop = [...(personas ?? [])].sort((a, b) => b.count - a.count).slice(0, 4);
  const conversion = kpis.total_users > 0 ? Math.round((funnel.participants / kpis.total_users) * 100) : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] overflow-y-auto"
          style={{
            background:
              'radial-gradient(ellipse at top, hsl(160 60% 15%) 0%, hsl(200 50% 8%) 60%, #000 100%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute top-4 right-4 z-10">
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={onClose}>
              <X className="h-4 w-4 mr-1" /> Fermer
            </Button>
          </div>

          <div className="min-h-screen flex flex-col justify-center items-center px-8 py-16 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <div className="text-xs uppercase tracking-[0.3em] text-white/50 mb-3">La Fréquence du Vivant</div>
              <h1 className="text-4xl md:text-6xl font-bold text-white">
                Une communauté vivante,
                <br />
                <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
                  ancrée dans les territoires.
                </span>
              </h1>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 w-full max-w-4xl">
              <Metric value={kpis.total_users} label="Marcheur·euse·s" delay={0.2} />
              <Metric value={funnel.participants} label="Ont marché" sub={`${conversion}% conversion`} delay={0.4} />
              <Metric value={kpis.contributors} label="Contributeurs" sub={`${kpis.avg_contribs} contribs/pers.`} delay={0.6} />
              <Metric value={funnel.adherents} label="Adhérents" delay={0.8} />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.8 }}
              className="mt-16 w-full max-w-4xl"
            >
              <h2 className="text-center text-white/70 text-sm uppercase tracking-widest mb-6">
                Les visages de la communauté
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {personaTop.map((p, i) => {
                  const meta = PERSONAS[p.key as keyof typeof PERSONAS] ?? PERSONAS.observateurs;
                  return (
                    <motion.div
                      key={p.key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.1 + i * 0.15 }}
                      className="rounded-xl border p-4 backdrop-blur-md"
                      style={{ borderColor: `${meta.color}66`, background: `${meta.color}18` }}
                    >
                      <div className="text-3xl mb-2">{meta.emoji}</div>
                      <div className="text-3xl font-bold tabular-nums" style={{ color: meta.color }}>{p.count}</div>
                      <div className="text-sm text-white/80 font-semibold mt-1">{meta.label}</div>
                      <div className="text-[11px] text-white/50 uppercase tracking-wide">{meta.tagline}</div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 1 }}
              className="mt-16 text-center text-white/60 italic max-w-2xl"
            >
              « Chaque marcheur·euse tisse un fil entre les vivants du territoire.
              Ensemble, {PERSONA_ORDER.length} manières d'écouter le monde. »
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PitchModeOverlay;
