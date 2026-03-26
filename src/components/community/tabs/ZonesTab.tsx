import React from 'react';
import { motion } from 'framer-motion';
import { Radar, Zap } from 'lucide-react';
import DetecteurZonesBlanches from '@/components/zones-blanches/DetecteurZonesBlanches';

const multipliers = [
  { label: 'Zone fréquentée', mult: '×1', bg: 'bg-white/10', text: 'text-white/60', border: 'border-white/10' },
  { label: 'Peu fréquentée', mult: '×2', bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-400/20' },
  { label: 'Zone blanche', mult: '×4', bg: 'bg-amber-500/20', text: 'text-amber-200', border: 'border-amber-400/30' },
];

const ZonesTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.12] backdrop-blur-lg border border-white/20 rounded-xl p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-300" />
          </div>
          <h3 className="text-white font-semibold text-sm">Multiplicateurs de Fréquences</h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {multipliers.map((m) => (
            <div
              key={m.mult}
              className={`${m.bg} ${m.border} border rounded-lg px-3 py-2 text-center`}
            >
              <span className={`block text-lg font-bold ${m.text}`}>{m.mult}</span>
              <span className="text-[10px] text-white/50 leading-tight">{m.label}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-white/50 leading-relaxed">
          Les zones blanches sont des territoires où la biodiversité n'a pas encore été écoutée.
          En vous y rendant, vos Fréquences sont multipliées.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <DetecteurZonesBlanches />
      </motion.div>
    </div>
  );
};

export default ZonesTab;
