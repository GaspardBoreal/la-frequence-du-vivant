import React from 'react';
import { motion } from 'framer-motion';
import { Check, CircleDashed, X, Minus, AlertTriangle, Gauge } from 'lucide-react';
import { AnalyzeCard } from '@/components/propriete/analyze/AnalyzeCard';
import { IcgRing } from '../FloraPictos';
import {
  ECO_AXES,
  ICG_BAND_LABEL,
  READ_LEVEL_LABEL,
  type ConcordanceDetail,
  type ConcordanceRow,
  type AxisMatch,
  type ReadLevel,
} from '@/lib/plantIndicatorKb';
import { EcoSourceNote } from '../EcoSourceNote';

const VERDICT_TOKEN: Record<AxisMatch, string> = {
  oui: '--ds-verdict-oui',
  partiel: '--ds-verdict-partiel',
  non: '--ds-verdict-non',
  na: '--ds-verdict-na',
};

const iconFor = (m: AxisMatch, cls = 'w-3.5 h-3.5') => {
  if (m === 'oui') return <Check className={cls} strokeWidth={3} />;
  if (m === 'partiel') return <CircleDashed className={cls} strokeWidth={2.4} />;
  if (m === 'non') return <X className={cls} strokeWidth={3} />;
  return <Minus className={cls} />;
};

const wordFor = (m: AxisMatch) =>
  m === 'oui' ? 'OUI · 2 pts' : m === 'partiel' ? 'PARTIEL · 1 pt' : m === 'non' ? 'NON · 0 pt' : 'NON ÉVALUÉ · 0 pt';

/** Pastille de verdict, contrastée et sémantique */
const VerdictChip: React.FC<{ match: AxisMatch }> = ({ match }) => {
  const token = VERDICT_TOKEN[match];
  if (match === 'na') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[hsl(var(--ds-verdict-na))]/60 px-2 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--ds-verdict-na))]">
        {iconFor(match, 'w-3 h-3')} Non évalué
      </span>
    );
  }
  const solid = match === 'oui';
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.1em]"
      style={
        solid
          ? { background: `hsl(var(${token}))`, color: 'hsl(var(--ds-cream))' }
          : {
              background: `hsl(var(${token}) / 0.14)`,
              color: `hsl(var(${token}))`,
              boxShadow: `inset 0 0 0 1px hsl(var(${token}) / 0.45)`,
            }
      }
    >
      {iconFor(match, 'w-3 h-3')} {wordFor(match)}
    </span>
  );
};

/** Jauge à 3 crans — lecture immédiate : deux barres alignées = accord */
const LevelGauge: React.FC<{
  level: ReadLevel | null;
  token: string;
  align?: 'left' | 'right';
  caption: string;
}> = ({ level, token, align = 'left', caption }) => (
  <div className={align === 'right' ? 'flex flex-col items-end gap-1' : 'flex flex-col gap-1'}>
    <div className={`flex gap-[3px] ${align === 'right' ? 'flex-row-reverse' : ''}`}>
      {[1, 2, 3].map((step) => {
        const on = level != null && level >= step;
        return (
          <span
            key={step}
            className="h-[7px] w-6 rounded-full transition-colors"
            style={{
              background: on ? `hsl(var(${token}) / ${0.45 + step * 0.18})` : 'hsl(var(--ds-line) / 0.55)',
              outline: level == null ? '1px dashed hsl(var(--ds-verdict-na) / 0.5)' : 'none',
              outlineOffset: '1px',
            }}
          />
        );
      })}
    </div>
    <span className="text-[10px] leading-none text-[hsl(var(--ds-forest-deep))]/70">{caption}</span>
  </div>
);

const GUIDE: Array<{ m: AxisMatch; txt: string }> = [
  { m: 'oui', txt: 'Même niveau de lecture : le sol et la flore disent la même chose.' },
  { m: 'partiel', txt: 'Un cran d’écart : tendance commune, intensité différente — à nuancer.' },
  { m: 'non', txt: 'Deux crans d’écart : les lectures divergent, un facteur externe agit.' },
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
  const { rows, points, max, icg, band, counts, reliability, evaluated } = detail;

  // Regroupement visuel par critère (2 pôles par critère)
  const isAxisStart = (r: ConcordanceRow, i: number) => i === 0 || rows[i - 1].axis !== r.axis;

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
          <div className="flex flex-col md:flex-row items-start gap-5">
            {/* Anneau ICG + fiabilité */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex-shrink-0 w-full md:w-[212px] text-center"
            >
              <IcgRing value={icg} band={band} />
              <div
                className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{
                  background: `hsl(var(--ds-verdict-${band === 'bonne' ? 'oui' : band === 'moyenne' ? 'partiel' : 'non'}) / 0.14)`,
                  color: `hsl(var(--ds-verdict-${band === 'bonne' ? 'oui' : band === 'moyenne' ? 'partiel' : 'non'}))`,
                }}
              >
                {ICG_BAND_LABEL[band]}
              </div>
              <div className="mt-1.5 text-[10px] leading-relaxed text-[hsl(var(--ds-forest-deep))]/70">
                <span className="font-semibold">{points} / {max} points</span> → ICG {icg} %
                <br />
                {counts.oui} oui · {counts.partiel} partiel · {counts.non} non · {counts.na} non évalué
              </div>

              {/* Indice de fiabilité — distinct de l'ICG */}
              <div className="mt-3 rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 px-3 py-2 text-left">
                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--ds-forest))]">
                  <Gauge className="w-3 h-3" /> Fiabilité {reliability} %
                </div>
                <div className="mt-1 h-[6px] w-full rounded-full bg-[hsl(var(--ds-line))]/60 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${reliability}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: 'hsl(var(--ds-eco-eau))' }}
                  />
                </div>
                <p className="mt-1 text-[10px] leading-snug text-[hsl(var(--ds-forest-deep))]/70">
                  {evaluated} ligne{evaluated > 1 ? 's' : ''} sur 8 réellement évaluée{evaluated > 1 ? 's' : ''}.
                  {counts.na > 0
                    ? ' Un ICG bas peut venir des données manquantes de l’Étape 2, pas d’une divergence réelle.'
                    : ' Toutes les données du sol sont renseignées.'}
                </p>
              </div>
            </motion.div>

            {/* Tableau des 8 lignes */}
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
                  {rows.map((r, i) => {
                    const axisToken = ECO_AXES[r.axis].token;
                    const start = isAxisStart(r, i);
                    return (
                      <motion.tr
                        key={r.key}
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.04 * i }}
                        className="group transition-colors hover:bg-[hsl(var(--ds-cream))]/70"
                        style={{
                          background: i % 2 === 1 ? 'hsl(var(--ds-cream) / 0.35)' : undefined,
                          borderTop: start && i > 0 ? '1px solid hsl(var(--ds-line))' : undefined,
                        }}
                      >
                        <td className="py-1.5 pr-2.5" style={{ paddingLeft: 0 }}>
                          <div className="flex">
                            {/* filet vertical coloré par critère */}
                            <span
                              className="w-[3px] self-stretch rounded-r"
                              style={{ background: `hsl(var(${axisToken}) / ${start ? 0.9 : 0.35})` }}
                            />
                            <div className="pl-2.5">
                              {start && (
                                <span
                                  className="block text-[9px] font-bold tracking-[0.18em] uppercase"
                                  style={{ color: `hsl(var(${axisToken}))` }}
                                >
                                  {ECO_AXES[r.axis].label}
                                </span>
                              )}
                              <span className="text-[11.5px] font-semibold text-[hsl(var(--ds-forest-deep))]">
                                {r.label}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-2.5 py-1.5">
                          <LevelGauge
                            level={r.soilLevel}
                            token="--ds-mineral"
                            caption={
                              r.soilLevel == null
                                ? 'Donnée manquante'
                                : `${READ_LEVEL_LABEL[r.soilLevel]} · ${r.soil}`
                            }
                          />
                        </td>
                        <td className="px-2.5 py-1.5">
                          <LevelGauge
                            level={r.floraLevel}
                            token="--ds-chloro"
                            caption={`${READ_LEVEL_LABEL[r.floraLevel]} · ${r.flora}`}
                          />
                        </td>
                        <td className="px-2.5 py-1.5">
                          <VerdictChip match={r.match} />
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-2">
            {GUIDE.map((g) => (
              <div
                key={g.m}
                className="rounded-xl border-l-[3px] border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 px-3 py-2 text-[11px] text-[hsl(var(--ds-forest-deep))]/80"
                style={{ borderLeftColor: `hsl(var(${VERDICT_TOKEN[g.m]}))` }}
              >
                <span className="mb-1 block">
                  <VerdictChip match={g.m} />
                </span>
                <p className="leading-snug">{g.txt}</p>
              </div>
            ))}
          </div>

          <p className="text-[10.5px] italic leading-snug text-[hsl(var(--ds-forest-deep))]/60">
            Calcul officiel de la méthode : 4 critères × 2 niveaux = 8 lignes, soit un maximum fixe de 16 points
            (OUI 2 · PARTIEL 1 · NON 0). ICG = (score obtenu ÷ 16) × 100. Une ligne non évaluée ne réduit jamais
            le maximum : elle abaisse l'indice et la fiabilité, pour ne jamais surestimer un diagnostic incomplet.
          </p>

          {icg < 60 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[hsl(var(--ds-verdict-non))]/40 bg-[hsl(var(--ds-verdict-non))]/8 p-3"
            >
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.24em] uppercase text-[hsl(var(--ds-verdict-non))]">
                <AlertTriangle className="w-3.5 h-3.5" /> En cas de faible cohérence
              </div>
              <ul className="mt-1.5 space-y-1 text-[11.5px] text-[hsl(var(--ds-forest-deep))]/85">
                {REMEDES.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="text-[hsl(var(--ds-verdict-non))]">—</span>
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
