import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Rows3 } from 'lucide-react';
import { useSpeciesViewMode, type SpeciesViewMode } from '@/contexts/SpeciesViewModeContext';

interface Props {
  className?: string;
}

const OPTIONS: Array<{
  key: SpeciesViewMode;
  label: string;
  icon: React.ReactNode;
  activeBg: string;
  halo: string;
}> = [
  {
    key: 'gallery',
    label: 'Galerie',
    icon: <LayoutGrid className="w-3.5 h-3.5" />,
    activeBg: 'bg-emerald-500 text-white',
    halo: '0 0 0 0 hsl(152 76% 50% / 0.55)',
  },
  {
    key: 'list',
    label: 'Liste',
    icon: <Rows3 className="w-3.5 h-3.5" />,
    activeBg: 'bg-zinc-700 text-white',
    halo: '0 0 0 0 hsl(220 9% 46% / 0.55)',
  },
];

/**
 * Toggle segmenté Galerie ↔ Liste pour les vues d'espèces.
 * Visuellement aligné sur SpeciesPhotoModeToggle : pill glassmorphism,
 * indicateur partagé via layoutId, halo pulsé sur sélection.
 */
const SpeciesViewModeToggle: React.FC<Props> = ({ className = '' }) => {
  const { mode, setMode } = useSpeciesViewMode();

  return (
    <div
      className={`inline-flex ${className}`}
      data-chat-control="species-view-mode"
      data-chat-value={mode}
    >
      <div
        role="tablist"
        aria-label="Mode d'affichage des espèces"
        className="inline-flex p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-inner shadow-black/20"
      >
        {OPTIONS.map((opt) => {
          const isActive = mode === opt.key;
          return (
            <motion.button
              key={opt.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={opt.label}
              onClick={() => setMode(opt.key)}
              whileTap={{ scale: 0.96 }}
              animate={
                isActive
                  ? {
                      boxShadow: [
                        opt.halo,
                        opt.halo
                          .replace('/ 0.55)', '/ 0)')
                          .replace('0 0 0 0', '0 0 0 12px'),
                      ],
                    }
                  : { boxShadow: '0 0 0 0 rgba(0,0,0,0)' }
              }
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className={`relative z-10 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isActive
                  ? opt.activeBg + ' shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="species-view-mode-indicator"
                  className={`absolute inset-0 rounded-full ${opt.activeBg.split(' ')[0]} -z-10`}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              {opt.icon}
              <span>{opt.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default SpeciesViewModeToggle;
