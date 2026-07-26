import React from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { AnalyzeCard } from '@/components/propriete/analyze/AnalyzeCard';
import {
  ECO_AXES,
  LEVEL_LABEL,
  poleScore,
  type PoleScore,
  type EcoAxis,
  type EcoPoleKey,
} from '@/lib/plantIndicatorKb';
import { EcoSourceNote } from '../EcoSourceNote';

const PAIRS: Array<{ axis: EcoAxis; left: EcoPoleKey; right: EcoPoleKey; question: string }> = [
  { axis: 'eau', left: 'eau_frais', right: 'eau_sec', question: 'Le sol retient-il l’eau ?' },
  { axis: 'texture', left: 'tex_argile_limon', right: 'tex_limon_sable', question: 'Quelle est la granulométrie dominante ?' },
  { axis: 'nutri', left: 'nutri_riche', right: 'nutri_pauvre', question: 'Le milieu est-il nourrissant ?' },
  { axis: 'ph', left: 'ph_calcaire', right: 'ph_acide', question: 'Quelle réaction chimique ?' },
];

const LEVELS = ['tres_faible', 'faible', 'moyen', 'fort', 'tres_fort'] as const;

export const IntensitiesBlock: React.FC<{
  scores: PoleScore[];
  plantCount: number;
  narrative: string;
  index?: number;
  onUseNarrative?: (text: string) => void;
}> = ({ scores, plantCount, narrative, index = 1, onUseNarrative }) => {
  const [copied, setCopied] = React.useState(false);

  const handleUse = () => {
    onUseNarrative?.(narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <AnalyzeCard
      number={3}
      category="Somme des indices"
      title="Ce que racontent les plantes observées"
      subtitle="Intensité forte = 3 points, moyenne = 2, faible = 1. Additionnées par colonne, elles révèlent les tendances du sol."
      index={index}
    >
      {plantCount === 0 ? (
        <p className="text-[12px] italic text-[hsl(var(--ds-forest-deep))]/60 text-center py-6">
          Cochez au moins une plante dans le tableau pour révéler le portrait écologique du site.
        </p>
      ) : (
        <div className="space-y-4">
          {narrative && (
            <div className="rounded-2xl border border-[hsl(var(--ds-forest))]/25 bg-[hsl(var(--ds-forest))]/6 p-3">
              <div className="text-[9px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/75 mb-1">
                Lecture d’ensemble
              </div>
              <p className="text-[12.5px] italic leading-relaxed text-[hsl(var(--ds-forest-deep))]/85">{narrative}</p>
              {onUseNarrative && (
                <button
                  onClick={handleUse}
                  className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold rounded-full border border-[hsl(var(--ds-forest))]/35 px-2.5 py-1 text-[hsl(var(--ds-forest))] hover:bg-[hsl(var(--ds-forest))]/10 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Reprise dans la conclusion' : 'Reprendre dans ma conclusion'}
                </button>
              )}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-3">
            {PAIRS.map((pair, i) => {
              const l = poleScore(scores, pair.left);
              const r = poleScore(scores, pair.right);
              const color = `hsl(var(${ECO_AXES[pair.axis].token}))`;
              const dominant = l.points === r.points ? null : l.points > r.points ? l : r;
              return (
                <motion.div
                  key={pair.axis}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.07 * i }}
                  className="rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 p-3"
                >
                  <div className="flex items-baseline justify-between gap-2 mb-2">
                    <span
                      className="text-[10px] font-bold tracking-[0.24em] uppercase"
                      style={{ color }}
                    >
                      {ECO_AXES[pair.axis].label}
                    </span>
                    <span className="text-[10px] italic text-[hsl(var(--ds-forest-deep))]/60">{pair.question}</span>
                  </div>

                  {[l, r].map((s) => (
                    <div key={s.pole.key} className="mb-2 last:mb-0">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-[hsl(var(--ds-forest-deep))]">{s.pole.label}</span>
                        <span className="tabular-nums text-[hsl(var(--ds-forest-deep))]/70">
                          {s.points} pt{s.points > 1 ? 's' : ''} · {s.contributors} plante{s.contributors > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex gap-[3px]">
                        {LEVELS.map((lv, li) => {
                          const active = LEVELS.indexOf(s.level) >= li && s.points > 0;
                          return (
                            <motion.div
                              key={lv}
                              initial={{ scaleX: 0, opacity: 0 }}
                              whileInView={{ scaleX: 1, opacity: 1 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.35, delay: 0.05 * li }}
                              className="h-2.5 flex-1 rounded-full origin-left"
                              style={{
                                background: active ? color : 'hsl(var(--ds-line) / 0.6)',
                                opacity: active ? 0.45 + li * 0.14 : 1,
                              }}
                            />
                          );
                        })}
                      </div>
                      <div className="mt-1 text-[10px] font-semibold" style={{ color }}>
                        Niveau : {s.points === 0 ? 'Aucun indice' : LEVEL_LABEL[s.level]}
                      </div>
                    </div>
                  ))}

                  <div className="mt-2 pt-2 border-t border-[hsl(var(--ds-line))]/70 text-[11px] text-[hsl(var(--ds-forest-deep))]/80">
                    {dominant ? (
                      <>
                        Dominante : <span className="font-semibold">{dominant.pole.label}</span>
                      </>
                    ) : (
                      <>Aucune dominante nette — critère équilibré.</>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="text-[10px] italic text-[hsl(var(--ds-forest-deep))]/60 text-right">
            Calcul basé sur {plantCount} plante{plantCount > 1 ? 's' : ''} cochée{plantCount > 1 ? 's' : ''}.
          </div>
          <EcoSourceNote compact />
        </div>
      )}
    </AnalyzeCard>
  );
};
