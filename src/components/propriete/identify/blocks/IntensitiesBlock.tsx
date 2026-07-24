import React from 'react';
import { motion } from 'framer-motion';
import { AnalyzeCard } from '@/components/propriete/analyze/AnalyzeCard';
import type { FloraProfile } from '@/lib/plantIndicatorKb';

const AXES: Array<{
  key: keyof Omit<FloraProfile, 'count'>;
  label: string;
  lo: string;
  hi: string;
}> = [
  { key: 'eau', label: 'Hydrique', lo: 'Sec', hi: 'Humide' },
  { key: 'texture', label: 'Texture', lo: 'Sableux', hi: 'Argileux' },
  { key: 'nutri', label: 'Nutrition', lo: 'Pauvre', hi: 'Riche' },
  { key: 'ph', label: 'pH', lo: 'Acide', hi: 'Calcaire' },
];

export const IntensitiesBlock: React.FC<{
  profile: FloraProfile;
  index?: number;
}> = ({ profile, index = 1 }) => {
  return (
    <AnalyzeCard
      number={2}
      category="Lecture des indices"
      title="Ce que dit votre cortège"
      subtitle="Chaque plante porte une signature écologique. Cumulées, elles esquissent le profil du lieu."
      index={index}
    >
      {profile.count === 0 ? (
        <p className="text-[12px] italic text-[hsl(var(--ds-forest-deep))]/60 text-center py-6">
          Cochez au moins une plante pour révéler le portrait écologique du site.
        </p>
      ) : (
        <div className="space-y-4">
          {AXES.map((a) => {
            const v = profile[a.key];
            const pct = ((v + 3) / 6) * 100; // -3..+3 → 0..100
            return (
              <div key={a.key}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold tracking-[0.2em] uppercase text-[hsl(var(--ds-forest))]/80">
                    {a.label}
                  </span>
                  <span className="italic text-[hsl(var(--ds-forest-deep))]/70">
                    {v.toFixed(1)}
                  </span>
                </div>
                <div className="relative h-3 rounded-full bg-[hsl(var(--ds-line))]/60 overflow-hidden">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-[hsl(var(--ds-forest))]/40" />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.abs(pct - 50)}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    style={{
                      left: v >= 0 ? '50%' : `${pct}%`,
                      background:
                        'linear-gradient(90deg, hsl(var(--ds-forest)) 0%, hsl(var(--ds-forest-deep)) 100%)',
                    }}
                    className="absolute inset-y-0 rounded-full"
                  />
                </div>
                <div className="flex justify-between text-[10px] italic text-[hsl(var(--ds-forest-deep))]/55 mt-1">
                  <span>{a.lo}</span>
                  <span>{a.hi}</span>
                </div>
              </div>
            );
          })}
          <div className="text-[10px] italic text-[hsl(var(--ds-forest-deep))]/60 text-right">
            Basé sur {profile.count} plante{profile.count > 1 ? 's' : ''} observée{profile.count > 1 ? 's' : ''}.
          </div>
        </div>
      )}
    </AnalyzeCard>
  );
};
