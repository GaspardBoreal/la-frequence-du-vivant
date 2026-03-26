import React from 'react';
import { motion } from 'framer-motion';
import { CommunityRoleKey } from '@/hooks/useCommunityProfile';

const ROLE_GRADIENT: Record<CommunityRoleKey, [string, string]> = {
  marcheur_en_devenir: ['#6ee7b7', '#34d399'],
  marcheur: ['#34d399', '#10b981'],
  eclaireur: ['#2dd4bf', '#14b8a6'],
  ambassadeur: ['#38bdf8', '#0ea5e9'],
  sentinelle: ['#fbbf24', '#f59e0b'],
};

interface FrequenceWaveProps {
  totalFrequences: number;
  role: CommunityRoleKey;
}

const FrequenceWave: React.FC<FrequenceWaveProps> = ({ totalFrequences, role }) => {
  const [c1, c2] = ROLE_GRADIENT[role];
  const bars = 24;
  const heights = Array.from({ length: bars }, (_, i) => {
    const x = i / (bars - 1);
    const base = Math.sin(x * Math.PI) * 0.7 + 0.3;
    const noise = Math.sin(x * 7) * 0.15 + Math.cos(x * 13) * 0.1;
    return Math.max(0.15, Math.min(1, base + noise));
  });

  return (
    <div className="relative rounded-2xl bg-white/[0.12] border border-white/20 backdrop-blur-lg p-5 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent" />
      <div className="relative flex items-end justify-center gap-[3px] h-16">
        {heights.map((h, i) => (
          <motion.div
            key={i}
            className="w-[3px] rounded-full origin-bottom"
            style={{ background: `linear-gradient(to top, ${c1}, ${c2})` }}
            initial={{ scaleY: 0 }}
            animate={{
              scaleY: [h * 0.6, h, h * 0.75, h * 0.9, h * 0.6],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.06,
            }}
            whileHover={{ scaleY: 1.2 }}
          />
        ))}
      </div>
      <div className="relative mt-3 flex items-center justify-between">
        <span className="text-xs text-white/70">Ma Fréquence du jour</span>
        <motion.span
          key={totalFrequences}
          initial={{ scale: 1.3, color: c1 }}
          animate={{ scale: 1, color: '#d1fae5' }}
          className="text-lg font-bold"
        >
          ★ {totalFrequences}
        </motion.span>
      </div>
    </div>
  );
};

export default FrequenceWave;
