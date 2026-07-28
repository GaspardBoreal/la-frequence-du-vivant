import React from 'react';
import { motion } from 'framer-motion';
import { Check, Pencil, Printer, RotateCcw, Leaf, AlertTriangle } from 'lucide-react';
import type { PropertyFloraState } from '@/hooks/propriete/usePropertyFlora';
import { FamilyIcon, IcgRing } from '@/components/propriete/identify/FloraPictos';
import {
  PLANT_INDICATORS,
  FAMILY_META,
  ECO_AXES,
  ECO_SOURCE,
  LEVEL_LABEL,
  computePoleScores,
  computeConcordanceDetail,
  narratePoleScores,
  type PlantFamily,
  type SoilLite,
} from '@/lib/plantIndicatorKb';

export type IdentifyBlockId = 'cortege' | 'poles' | 'concordance' | 'narration' | 'notes';

interface Props {
  state: PropertyFloraState;
  soil: SoilLite;
  soilAvailable: boolean;
  completedAt: string | null;
  propertyName?: string;
  onEditBlock: (id: IdentifyBlockId) => void;
  onReopenAll: () => void;
  onPrint?: () => void;
  printOnly?: boolean;
  /** p1 = cortège + pôles, p2 = concordance + narration + notes + sources */
  printSection?: 'all' | 'p1' | 'p2';
}

const num = (n: number) => String(n).padStart(2, '0');

const Section: React.FC<{
  number: number;
  title: string;
  blockId: IdentifyBlockId;
  onEditBlock: (id: IdentifyBlockId) => void;
  printOnly?: boolean;
  warn?: boolean;
  children: React.ReactNode;
}> = ({ number, title, blockId, onEditBlock, printOnly, warn, children }) => (
  <div className="group relative print-avoid-break">
    {!printOnly && (
      <button
        onClick={() => onEditBlock(blockId)}
        className="absolute -right-1 top-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-gold))]/15 print:hidden"
        title={`Modifier ${title}`}
        aria-label={`Modifier ${title}`}
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    )}
    <div className="flex items-center gap-2 mb-2">
      <h3
        className={
          warn
            ? 'text-[11px] uppercase tracking-[0.2em] font-bold text-amber-700'
            : 'text-[11px] uppercase tracking-[0.2em] font-bold text-[hsl(var(--ds-forest))]'
        }
      >
        {num(number)}. {title}
      </h3>
      {warn && (
        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold uppercase tracking-tight">
          Incomplet
        </span>
      )}
    </div>
    {children}
  </div>
);

const Chip: React.FC<{ children: React.ReactNode; tone?: 'gold' | 'muted' }> = ({
  children,
  tone = 'gold',
}) => (
  <span
    className={
      tone === 'gold'
        ? 'inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ds-gold))]/60 bg-[hsl(var(--ds-cream))] px-2.5 py-1 text-sm text-[hsl(var(--ds-forest-deep))] shadow-sm print:shadow-none'
        : 'inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ds-line))] px-2.5 py-1 text-xs text-[hsl(var(--ds-forest-deep))]/75'
    }
  >
    {children}
  </span>
);

const Empty = () => (
  <p className="mb-2 text-xs italic text-[hsl(var(--ds-forest-deep))]/40">— Non renseigné —</p>
);

const MATCH_LABEL: Record<string, { label: string; cls: string }> = {
  oui: { label: 'Concordant', cls: 'bg-[hsl(var(--ds-forest))]/15 text-[hsl(var(--ds-forest-deep))]' },
  partiel: { label: 'Partiel', cls: 'bg-amber-100 text-amber-800' },
  non: { label: 'Divergent', cls: 'bg-rose-100 text-rose-800' },
  na: { label: 'Donnée absente', cls: 'bg-[hsl(var(--ds-line))]/40 text-[hsl(var(--ds-forest-deep))]/50' },
};

export const IdentifySummary: React.FC<Props> = ({
  state,
  soil,
  soilAvailable,
  completedAt,
  propertyName,
  onEditBlock,
  onReopenAll,
  onPrint,
  printOnly = false,
  printSection = 'all',
}) => {
  const observed = state.observed_plants ?? [];
  const plants = React.useMemo(
    () => PLANT_INDICATORS.filter((p) => observed.includes(p.id)),
    [observed],
  );
  const scores = React.useMemo(() => computePoleScores(observed), [observed]);
  const detail = React.useMemo(() => computeConcordanceDetail(observed, soil), [observed, soil]);
  const sentence = React.useMemo(() => narratePoleScores(scores), [scores]);

  const byFamily = React.useMemo(() => {
    const m = new Map<PlantFamily, typeof plants>();
    for (const p of plants) m.set(p.famille, [...(m.get(p.famille) ?? []), p]);
    return m;
  }, [plants]);

  const dateStr = completedAt
    ? new Date(completedAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';

  const showP1 = printSection === 'all' || printSection === 'p1';
  const showP2 = printSection === 'all' || printSection === 'p2';
  const isSuite = printSection === 'p2';
  const gridCols = printOnly
    ? 'grid grid-cols-2 gap-x-8 gap-y-6'
    : 'grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8';

  // En impression, aucune animation d'entrée : le portail est `display:none`
  // jusqu'au moment du print, ce qui figerait l'opacité initiale à 0.
  const Root: any = printOnly ? 'article' : motion.article;

  return (
    <Root
      {...(printOnly ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } })}
      className="identify-print-root relative bg-[hsl(var(--ds-cream))] border border-[hsl(var(--ds-line))] shadow-[0_10px_40px_-15px_rgba(22,48,32,0.15)] p-8 md:p-14 overflow-hidden print:shadow-none print:border-0"
    >
      {/* Cartouche impression */}
      {showP1 && (
        <div className={printOnly ? 'block mb-8' : 'hidden print:block mb-8'}>
          <div className="border-t-2 border-b-2 border-[hsl(var(--ds-gold))] py-6 text-center">
            <div className="text-[10px] font-bold tracking-[0.4em] uppercase text-[hsl(var(--ds-forest))]/70">
              Diagnostic Propriété · Étape 3
            </div>
            <h1 className="mt-3 font-serif italic text-4xl text-[hsl(var(--ds-forest-deep))] leading-tight">
              {propertyName ?? 'La flore en place'}
            </h1>
            <div className="mt-3 text-[11px] tracking-[0.25em] uppercase text-[hsl(var(--ds-forest))]/70">
              Validé le {dateStr} · Fréquence du Vivant
            </div>
          </div>
        </div>
      )}

      {isSuite && (
        <div className="mb-8 border-b border-[hsl(var(--ds-gold))]/70 pb-5">
          <div className="text-[10px] font-bold tracking-[0.35em] uppercase text-[hsl(var(--ds-forest))]/70">
            Diagnostic Propriété · Étape 3 · Suite
          </div>
          <h2 className="mt-2 font-serif italic text-3xl text-[hsl(var(--ds-forest-deep))] leading-tight">
            {propertyName ?? 'La flore en place'}
          </h2>
          <div className="mt-2 text-[10px] tracking-[0.25em] uppercase text-[hsl(var(--ds-forest))]/60">
            Concordance sol ↔ flore · Fréquence du Vivant
          </div>
        </div>
      )}

      {/* Sceau daté (écran) */}
      {!printOnly && (
        <div className="absolute top-6 right-6 md:top-8 md:right-8 w-32 h-32 flex items-center justify-center rotate-12 pointer-events-none z-10 print:hidden">
          <svg className="absolute inset-0 w-full h-full text-[hsl(var(--ds-forest-deep))]" viewBox="0 0 100 100">
            <defs>
              <path
                id="identify-seal-circle"
                d="M 15,50 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0"
                fill="transparent"
              />
            </defs>
            <text className="fill-current" style={{ fontSize: '7px', letterSpacing: '2px', fontWeight: 700 }}>
              <textPath href="#identify-seal-circle">
                FLORE EN PLACE • FRÉQUENCE DU VIVANT •
              </textPath>
            </text>
          </svg>
          <div className="relative flex flex-col items-center justify-center text-center w-20 h-20 rounded-full border border-[hsl(var(--ds-gold))] bg-[hsl(var(--ds-cream))]">
            <span className="text-[9px] uppercase tracking-widest font-bold text-[hsl(var(--ds-gold))]">
              Validé
            </span>
            <span className="font-serif italic text-sm text-[hsl(var(--ds-forest-deep))] leading-tight">
              {dateStr}
            </span>
            <span className="text-[7px] uppercase tracking-widest text-[hsl(var(--ds-gold))]">
              Étape 3
            </span>
          </div>
        </div>
      )}

      {/* Header écran */}
      {!printOnly && (
        <header className="mb-6 md:mb-8 border-b border-[hsl(var(--ds-line))] pb-6 pr-32 print:hidden">
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]">
            Étape 3 — Terminée
          </span>
          <h2 className="mt-2 font-serif italic text-4xl md:text-5xl text-[hsl(var(--ds-forest-deep))] leading-tight">
            {propertyName ? `La flore — ${propertyName}` : 'La flore en place'}
          </h2>
          <p className="mt-3 text-sm md:text-base text-[hsl(var(--ds-forest-deep))]/70 max-w-xl">
            Le cortège végétal lu comme un texte : ce que les plantes disent de l'eau, de la
            texture, de la richesse et de la réaction du sol.
          </p>
        </header>
      )}

      {showP1 && (
        <>
          {/* Lecture dominante */}
          <div className="mb-8 border-l-2 border-[hsl(var(--ds-gold))] pl-4 print-avoid-break">
            <div className="text-[9px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/70">
              Lecture dominante
            </div>
            <p className="mt-1.5 font-serif italic text-2xl md:text-3xl text-[hsl(var(--ds-forest-deep))] leading-snug">
              {sentence || 'Aucune plante bio-indicatrice cochée pour l’instant.'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip tone="muted">{plants.length} espèces reconnues</Chip>
              <Chip tone="muted">{byFamily.size} strates représentées</Chip>
              {soilAvailable && <Chip tone="muted">ICG {detail.icg} / 100</Chip>}
            </div>
          </div>

          <div className={gridCols}>
            <Section
              number={1}
              title="Cortège révélé"
              blockId="cortege"
              onEditBlock={onEditBlock}
              printOnly={printOnly}
              warn={plants.length === 0}
            >
              {plants.length === 0 ? (
                <Empty />
              ) : (
                <div className="space-y-3">
                  {(['herbacee', 'arbuste', 'liane', 'arbre'] as PlantFamily[])
                    .filter((f) => byFamily.has(f))
                    .map((f) => (
                      <div key={f}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <FamilyIcon family={f} active size={18} />
                          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[hsl(var(--ds-forest))]/80">
                            {FAMILY_META[f].label} · {byFamily.get(f)!.length}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {byFamily.get(f)!.map((p) => (
                            <Chip key={p.id}>
                              <span className="font-medium">{p.nom}</span>
                              {p.latin && (
                                <span className="italic opacity-60 text-xs">{p.latin}</span>
                              )}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Section>

            <Section
              number={2}
              title="Somme des indices — les 8 pôles"
              blockId="poles"
              onEditBlock={onEditBlock}
              printOnly={printOnly}
            >
              <div className="space-y-2">
                {scores.map((s) => (
                  <div key={s.pole.key} className="print-avoid-break">
                    <div className="flex items-baseline justify-between text-xs text-[hsl(var(--ds-forest-deep))]/80">
                      <span>
                        <span className="uppercase tracking-widest text-[9px] text-[hsl(var(--ds-forest))]/60 mr-1.5">
                          {ECO_AXES[s.pole.axis].label}
                        </span>
                        {s.pole.label}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {s.points} pt{s.points > 1 ? 's' : ''} · {LEVEL_LABEL[s.level]}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-[hsl(var(--ds-line))]/50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[hsl(var(--ds-forest))]"
                        style={{ width: `${Math.round(Math.min(1, s.ratio) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </>
      )}

      {showP2 && (
        <div className={`${printSection === 'all' ? 'print-break-before mt-8' : 'mt-0'} space-y-8`}>
          <Section
            number={3}
            title="Concordance sol ↔ flore"
            blockId="concordance"
            onEditBlock={onEditBlock}
            printOnly={printOnly}
            warn={!soilAvailable}
          >
            {!soilAvailable ? (
              <p className="text-sm italic text-[hsl(var(--ds-forest-deep))]/60">
                L'étape 2 « J'analyse le sol » n'est pas encore renseignée : la concordance
                reste en attente.
              </p>
            ) : (
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="shrink-0">
                  <IcgRing value={detail.icg} size={112} />
                  <div className="mt-1 text-center text-[9px] uppercase tracking-[0.2em] text-[hsl(var(--ds-forest))]/70">
                    {detail.points} / {detail.max} points
                  </div>
                </div>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="text-left text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--ds-forest))]/70">
                      <th className="py-1 pr-2 font-bold">Pôle</th>
                      <th className="py-1 pr-2 font-bold">Sol (étape 2)</th>
                      <th className="py-1 pr-2 font-bold">Flore (étape 3)</th>
                      <th className="py-1 font-bold">Lecture</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.rows.map((row) => (
                      <tr key={row.key} className="border-t border-[hsl(var(--ds-line))]/60">
                        <td className="py-1 pr-2 text-[hsl(var(--ds-forest-deep))]">{row.label}</td>
                        <td className="py-1 pr-2 text-[hsl(var(--ds-forest-deep))]/70">{row.soil}</td>
                        <td className="py-1 pr-2 text-[hsl(var(--ds-forest-deep))]/70">{row.flora}</td>
                        <td className="py-1">
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-tight ${MATCH_LABEL[row.match].cls}`}
                          >
                            {MATCH_LABEL[row.match].label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section
            number={4}
            title="Narration du diagnostic"
            blockId="narration"
            onEditBlock={onEditBlock}
            printOnly={printOnly}
            warn={!(state.flora_conclusion ?? '').trim()}
          >
            {(state.flora_conclusion ?? '').trim() ? (
              <p className="font-serif italic text-lg text-[hsl(var(--ds-forest-deep))] leading-relaxed whitespace-pre-line">
                {state.flora_conclusion}
              </p>
            ) : (
              <Empty />
            )}
          </Section>

          {(state.notes ?? '').trim() && (
            <Section
              number={5}
              title="Notes de terrain"
              blockId="notes"
              onEditBlock={onEditBlock}
              printOnly={printOnly}
            >
              <p className="text-sm text-[hsl(var(--ds-forest-deep))]/85 leading-relaxed whitespace-pre-line">
                {state.notes}
              </p>
            </Section>
          )}

          <div className="print-avoid-break border-t border-[hsl(var(--ds-line))] pt-3">
            <div className="text-[9px] uppercase tracking-[0.25em] font-bold text-[hsl(var(--ds-forest))]/70 mb-1">
              06. Sources
            </div>
            <p className="text-[10px] leading-relaxed text-[hsl(var(--ds-forest-deep))]/60">
              {ECO_SOURCE} Observations de terrain croisées avec iNaturalist (science
              participative, Fréquence du Vivant).
            </p>
          </div>
        </div>
      )}

      {/* Footer / actions */}
      {!printOnly && (
        <footer className="mt-12 pt-6 border-t border-[hsl(var(--ds-line))] flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full border border-[hsl(var(--ds-forest))] flex items-center justify-center text-[hsl(var(--ds-forest))]">
              <Check className="w-4 h-4" />
            </span>
            <span className="text-sm font-medium text-[hsl(var(--ds-forest-deep))]">
              Flore verrouillée · prête pour le rapport client
            </span>
            {plants.length === 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                <AlertTriangle className="w-3 h-3" /> aucune espèce cochée
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-[hsl(var(--ds-forest))] text-[hsl(var(--ds-forest-deep))] text-xs font-semibold uppercase tracking-widest hover:bg-[hsl(var(--ds-forest))] hover:text-[hsl(var(--ds-cream))] transition-colors rounded"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimer
            </button>
            <button
              onClick={onReopenAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))] text-xs font-semibold uppercase tracking-widest hover:bg-[hsl(var(--ds-gold))]/15 transition-colors rounded"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Rouvrir en édition
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-[hsl(var(--ds-forest-deep))]/60">
              <Leaf className="w-3.5 h-3.5" /> {plants.length} vignettes à l'atlas
            </span>
          </div>
        </footer>
      )}
    </Root>
  );
};

export default IdentifySummary;
