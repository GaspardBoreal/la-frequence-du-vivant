import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Church, Radar, Footprints, ArrowLeft } from 'lucide-react';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import ImmersiveCathedrale from './immersive/ImmersiveCathedrale';
import ImmersiveScan from './immersive/ImmersiveScan';
import ImmersiveTraversee from './immersive/ImmersiveTraversee';

interface Props {
  species: BiodiversitySpecies[];
  photoBy: Map<string, string>;
}

type ImmersiveSubMode = 'picker' | 'cathedrale' | 'scan' | 'traversee';

const CHOICES: Array<{
  id: Exclude<ImmersiveSubMode, 'picker'>;
  label: string;
  tagline: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  ring: string;
  audience: string;
}> = [
  {
    id: 'cathedrale',
    label: 'Cathédrale',
    tagline: 'contempler',
    desc: 'Chaque espèce devient un tableau. Parallaxe, halos taxonomiques, typographie XXL, chapitrage par acte.',
    Icon: Church,
    gradient: 'from-amber-500/40 via-rose-400/20 to-emerald-500/30',
    ring: 'ring-amber-400/60',
    audience: 'grand public · mécènes',
  },
  {
    id: 'scan',
    label: 'Scan Vivant',
    tagline: 'comprendre',
    desc: 'Mur de contrôle. Grille temps réel, fiches data, badges emblématique / pionnière, contributeurs.',
    Icon: Radar,
    gradient: 'from-emerald-400/40 via-cyan-500/25 to-slate-900/20',
    ring: 'ring-emerald-400/60',
    audience: 'scientifiques · presse',
  },
  {
    id: 'traversee',
    label: 'Traversée',
    tagline: 'vivre',
    desc: 'On rejoue la marche. Les espèces surgissent le long du tracé GPS, mandala final en constellation.',
    Icon: Footprints,
    gradient: 'from-sky-500/40 via-emerald-500/25 to-fuchsia-500/20',
    ring: 'ring-sky-400/60',
    audience: 'jeunes · événementiel',
  },
];

const ImmersiveScreensaver: React.FC<Props> = ({ species, photoBy }) => {
  const [sub, setSub] = useState<ImmersiveSubMode>('picker');

  // Keyboard shortcuts inside the picker
  useEffect(() => {
    if (sub !== 'picker') return;
    const h = (e: KeyboardEvent) => {
      if (e.key === '1') setSub('cathedrale');
      if (e.key === '2') setSub('scan');
      if (e.key === '3') setSub('traversee');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [sub]);

  // Back to picker on 'b'
  useEffect(() => {
    if (sub === 'picker') return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'b' || e.key === 'B') setSub('picker');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [sub]);

  if (species.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-white/50 bg-black">
        Aucune espèce avec photo pour le mode Immersif.
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <AnimatePresence mode="wait">
        {sub === 'picker' && (
          <motion.div
            key="picker"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-black overflow-hidden"
          >
            <ImmersivePicker choices={CHOICES} count={species.length} onPick={setSub} />
          </motion.div>
        )}

        {sub === 'cathedrale' && (
          <motion.div key="cathedrale" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="absolute inset-0">
            <ImmersiveCathedrale species={species} photoBy={photoBy} />
            <BackToPicker onClick={() => setSub('picker')} />
          </motion.div>
        )}
        {sub === 'scan' && (
          <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="absolute inset-0">
            <ImmersiveScan species={species} photoBy={photoBy} />
            <BackToPicker onClick={() => setSub('picker')} />
          </motion.div>
        )}
        {sub === 'traversee' && (
          <motion.div key="traversee" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="absolute inset-0">
            <ImmersiveTraversee species={species} photoBy={photoBy} />
            <BackToPicker onClick={() => setSub('picker')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BackToPicker: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 text-xs text-white/80 backdrop-blur"
  >
    <ArrowLeft className="h-3.5 w-3.5" />
    <span>Autres immersions</span>
    <span className="text-white/40 hidden sm:inline">· B</span>
  </button>
);

const ImmersivePicker: React.FC<{
  choices: typeof CHOICES;
  count: number;
  onPick: (id: ImmersiveSubMode) => void;
}> = ({ choices, count, onPick }) => (
  <div className="absolute inset-0 flex flex-col">
    {/* Aurora background */}
    <div className="absolute inset-0 opacity-70"
      style={{
        background:
          'radial-gradient(ellipse at 15% 20%, rgba(52,211,153,0.25) 0%, transparent 55%),' +
          'radial-gradient(ellipse at 85% 30%, rgba(34,211,238,0.20) 0%, transparent 55%),' +
          'radial-gradient(ellipse at 50% 90%, rgba(244,114,182,0.15) 0%, transparent 60%)',
      }}
    />
    <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
      <motion.p
        initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 0.6 }}
        transition={{ duration: 0.7 }}
        className="text-xs uppercase tracking-[0.4em] text-white/50 mb-3"
      >
        Mode Immersif
      </motion.p>
      <motion.h2
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
        className="text-4xl sm:text-6xl font-light text-white text-center max-w-3xl leading-tight"
      >
        Trois manières d'entrer dans <span className="italic text-emerald-300">{count}</span> vivants
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 0.7 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="mt-4 text-sm sm:text-base text-white/60 text-center max-w-xl"
      >
        Chaque immersion révèle une facette différente de la biodiversité collectée. Choisissez la vôtre.
      </motion.p>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-6xl">
        {choices.map((c, i) => (
          <motion.button
            key={c.id}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.12, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPick(c.id)}
            className={`relative group text-left rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br ${c.gradient} p-6 min-h-[240px] flex flex-col hover:${c.ring} hover:ring-2 transition-all`}
          >
            <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-black/40 text-[10px] flex items-center justify-center text-white/70 border border-white/10">
              {i + 1}
            </div>
            <div className="h-10 w-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4 backdrop-blur">
              <c.Icon className="h-5 w-5 text-white" />
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/60 mb-1">{c.tagline}</div>
            <h3 className="text-2xl sm:text-3xl font-light text-white leading-tight">{c.label}</h3>
            <p className="mt-3 text-sm text-white/70 leading-relaxed flex-1">{c.desc}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-white/50">{c.audience}</span>
              <span className="text-sm text-white/80 group-hover:text-white transition">Entrer →</span>
            </div>
          </motion.button>
        ))}
      </div>

      <p className="mt-8 text-[11px] text-white/40 tracking-widest">
        1 · 2 · 3 pour choisir · B pour revenir ici · H pour le hub Découverte
      </p>
    </div>
  </div>
);

export default ImmersiveScreensaver;
