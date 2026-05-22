import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Sparkles } from 'lucide-react';
import { useSpeciesPhotoMode } from '@/contexts/SpeciesPhotoModeContext';

/**
 * Pill segmentée animée Photos marcheurs ↔ iNaturalist.
 * Auto-masquée si aucune photo terrain n'existe sur l'exploration.
 */
const SpeciesPhotoModeToggle: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  const { mode, setMode, hasFieldPhotos, speciesWithFieldPhotos, isLoading } =
    useSpeciesPhotoMode();

  if (isLoading || !hasFieldPhotos) return null;

  const options: Array<{
    key: 'marcheur' | 'inaturalist';
    label: string;
    short: string;
    icon: React.ReactNode;
    activeBg: string;
    halo: string;
    count?: number;
  }> = [
    {
      key: 'marcheur',
      label: 'Photos marcheurs',
      short: 'Marcheurs',
      icon: <Camera className="w-3.5 h-3.5" />,
      activeBg: 'bg-emerald-500 text-white',
      halo: '0 0 0 0 hsl(152 76% 50% / 0.55)',
      count: speciesWithFieldPhotos,
    },
    {
      key: 'inaturalist',
      label: 'Photos iNaturalist',
      short: 'iNaturalist',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      activeBg: 'bg-sky-500 text-white',
      halo: '0 0 0 0 hsl(199 89% 55% / 0.55)',
    },
  ];

  return (
    <div
      className={`flex justify-center ${className}`}
      data-chat-control="species-photo-mode"
      data-chat-value={mode}
    >
      <div
        role="tablist"
        aria-label="Source des photos d'espèces"
        className="inline-flex p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-inner shadow-black/20"
      >
        {options.map((opt) => {
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
                        opt.halo.replace('/ 0.55)', '/ 0)').replace('0 0 0 0', '0 0 0 14px'),
                      ],
                    }
                  : { boxShadow: '0 0 0 0 rgba(0,0,0,0)' }
              }
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className={`relative z-10 px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isActive
                  ? opt.activeBg + ' shadow'
                  : 'text-white/65 hover:text-white/95'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="species-photo-mode-indicator"
                  className={`absolute inset-0 rounded-full ${opt.activeBg.split(' ')[0]} -z-10`}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              {opt.icon}
              <span className="hidden sm:inline">{opt.short}</span>
              <span className="sm:hidden sr-only">{opt.short}</span>
              {typeof opt.count === 'number' && (
                <span
                  className={`ml-0.5 px-1.5 rounded-full text-[10px] tabular-nums ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-white/10 text-white/80'
                  }`}
                >
                  {opt.count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default SpeciesPhotoModeToggle;
