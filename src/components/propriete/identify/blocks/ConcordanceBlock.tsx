import React from 'react';
import { motion } from 'framer-motion';
import { Check, CircleDashed, X, Minus, AlertTriangle } from 'lucide-react';
import { AnalyzeCard } from '@/components/propriete/analyze/AnalyzeCard';
import { IcgRing } from '../FloraPictos';
import { ECO_AXES, type ConcordanceDetail, type AxisMatch } from '@/lib/plantIndicatorKb';
import { EcoSourceNote } from '../EcoSourceNote';

const iconFor = (m: AxisMatch) => {
  if (m === 'oui') return <Check className="w-4 h-4 text-[hsl(var(--ds-forest))]" strokeWidth={3} />;
  if (m === 'partiel') return <CircleDashed className="w-4 h-4 text-[hsl(var(--ds-gold))]" strokeWidth={2.4} />;
  if (m === 'non') return <X className="w-4 h-4 text-[#b95c3a]" strokeWidth={3} />;
  return <Minus className="w-4 h-4 text-[hsl(var(--ds-forest-deep))]/40" />;
};

const wordFor = (m: AxisMatch) =>
  m === 'oui' ? 'OUI · 2 pts' : m === 'partiel' ? 'PARTIEL · 1 pt' : m === 'non' ? 'NON · 0 pt' : 'Non évalué';

const GUIDE = [
  { m: 'oui' as AxisMatch, txt: 'Le sol et la flore disent la même chose : lecture fiable.' },
  { m: 'partiel' as AxisMatch, txt: 'Tendance commune mais d’intensité différente : à nuancer.' },
  { m: 'non' as AxisMatch, txt: 'Les deux lectures divergent : un facteur externe agit sans doute.' },
];

const REMEDES = [
  'Reprendre l’observation de terrain : le cortège coché est-il complet et bien identifié ?',
  'Vérifier les prélèvements de l’Étape 2 : nombre, emplacement et représentativité des points.',
  'Envisager une histoire du site (remblai, amendement, drainage, travaux récents) qui découplerait sol et végétation.',
];

export const ConcordanceBlock: React.FC<{
  detail: ConcordanceDetail;
  soilAvailable: boolean;
  index?: number;
}> = ({ detail, soilAvailable, index = 2 }) => {
  const { rows, points, max, icg, counts } = detail;

  return (
    <AnalyzeCard
      number={4}
      category="Concordance sol / flore"
      title="Deux voix, une seule histoire ?"
      subtitle="On confronte ligne à ligne ce que dit le sol (Étape 2) et ce que raconte la végétation (Étape 3)."
      index={index}
    >
      {!soilAvailable ? (
        <div className="rounded-xl border border-dashed border-[hsl(var(--ds-line))] p-4 text-[12px] italic text-[hsl(var(--ds-forest-deep))]/65 text-center">
          Complétez d'abord l'Étape 2 « J'analyse le sol » pour révéler la concordance.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-5">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex-shrink-0 text-center"
            >
              <IcgRing value={icg} />
              <div className="mt-1 text-[10px] italic text-[hsl(var(--ds-forest-deep))]/70">
                {counts.oui} oui · {counts.partiel} partiel · {counts.non} non
                <br />
                {points} / {max} points → ICG {icg} %
              </div>
            </motion.div>

            <div className="flex-1 w-full overflow-hidden rounded-2xl border border-[hsl(var(--ds-line))]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[hsl(var(--ds-cream))]">
                    {['Critère', 'Étape 2 · le sol', 'Étape 3 · la flore', 'Concordance'].map((h) => (
                      <th
                        key={h}
                        className="px-2.5 py-1.5 text-[9px] font-bold tracking-[0.2em] uppercase text-[hsl(var(--ds-forest))] border-b border-[hsl(var(--ds-line))]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <motion.tr
                      key={r.key}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.04 * i }}
                      className="border-b border-[hsl(var(--ds-line))]/50 last:border-0"
                    >
                      <td className="px-2.5 py-1.5">
                        <span
                          className="block text-[9px] font-bold tracking-[0.18em] uppercase"
                          style={{ color: `hsl(var(${ECO_AXES[r.axis].token}))` }}
                        >
                          {ECO_AXES[r.axis].label}
                        </span>
                        <span className="text-[11.5px] font-semibold text-[hsl(var(--ds-forest-deep))]">{r.label}</span>
                      </td>
                      <td className="px-2.5 py-1.5 text-[11px] text-[hsl(var(--ds-forest-deep))]/80">{r.soil}</td>
                      <td className="px-2.5 py-1.5 text-[11px] text-[hsl(var(--ds-forest-deep))]/80">{r.flora}</td>
                      <td className="px-2.5 py-1.5">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[hsl(var(--ds-forest-deep))]/85">
                          {iconFor(r.match)} {wordFor(r.match)}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-2">
            {GUIDE.map((g) => (
              <div
                key={g.m}
                className="rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 px-3 py-2 text-[11px] text-[hsl(var(--ds-forest-deep))]/80"
              >
                <span className="inline-flex items-center gap-1.5 font-semibold mb-0.5">
                  {iconFor(g.m)} {wordFor(g.m)}
                </span>
                <p className="leading-snug">{g.txt}</p>
              </div>
            ))}
          </div>

          {icg < 50 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[#b95c3a]/40 bg-[#b95c3a]/8 p-3"
            >
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.24em] uppercase text-[#b95c3a]">
                <AlertTriangle className="w-3.5 h-3.5" /> En cas de faible cohérence
              </div>
              <ul className="mt-1.5 space-y-1 text-[11.5px] text-[hsl(var(--ds-forest-deep))]/85">
                {REMEDES.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="text-[#b95c3a]">—</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          <EcoSourceNote compact />
        </div>
      )}
    </AnalyzeCard>
  );
};
