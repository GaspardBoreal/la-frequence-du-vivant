import React from 'react';
import { motion } from 'framer-motion';
import { Check, Pencil, Printer, RotateCcw, ArrowRight, MapPin, AlertTriangle } from 'lucide-react';
import type { PropertySoilState } from '@/hooks/propriete/usePropertySoil';
import type { ProprieteParcelle } from '@/hooks/propriete/usePropertyParcelles';
import { buildSoilReading } from './soilReading';

import { SoilSamplesPlan } from './SoilSamplesPlan';
import { RESULT_SHORT, TEST_LABELS } from './structureTests';
import { TEXTURE_SHORT, TEXTURE_TEST_LABELS, BOUDIN_FORM_MAP } from './textureTests';
import { PH_CLASS_MAP, PH_TEST_LABELS, classifyPh } from './phTests';
import { LIFE_CLASS_MAP, LIFE_SIGN_MAP, LIFE_TEST_LABELS, type LifeSignId } from './lifeTests';

export type AnalyzeBlockId =
  | 'terrain'
  | 'prelevements'
  | 'structure'
  | 'texture'
  | 'ph'
  | 'life'
  | 'synthesis';

interface Props {
  state: PropertySoilState;
  completedAt: string | null;
  propertyName?: string;
  parcelles?: ProprieteParcelle[];
  onEditBlock: (id: AnalyzeBlockId) => void;
  onReopenAll: () => void;
  onNextStep?: () => void;
  onPrint?: () => void;
  /** Rendu destiné à l'impression combinée. */
  printOnly?: boolean;
  /** Découpage éditorial : p1 = plan + 01, p2 = 02→06, p3 = registre 07 + note 08. */
  printSection?: 'all' | 'first' | 'second' | 'p1' | 'p2' | 'p3';
}

const num = (n: number) => String(n).padStart(2, '0');

const Section: React.FC<{
  number: number;
  title: string;
  blockId: AnalyzeBlockId;
  onEditBlock: (id: AnalyzeBlockId) => void;
  warn?: boolean;
  printOnly?: boolean;
  children: React.ReactNode;
}> = ({ number, title, blockId, onEditBlock, warn, printOnly, children }) => (
  <div
    className={
      (warn
        ? 'group relative -m-2 p-3 rounded-lg bg-amber-50/60 border border-amber-200/70'
        : 'group relative') + ' print-avoid-break'
    }
  >
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
          Attention
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

export const AnalyzeSummary: React.FC<Props> = ({
  state,
  completedAt,
  propertyName,
  parcelles = [],
  onEditBlock,
  onReopenAll,
  onNextStep,
  onPrint,
  printOnly = false,
  printSection = 'all',
}) => {
  const r = React.useMemo(() => buildSoilReading(state), [state]);
  const dateStr = completedAt
    ? new Date(completedAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';

  const showFirst = printSection === 'all' || printSection === 'first';
  const showSecond = printSection === 'all' || printSection === 'second';

  const phClass = r.ph.dominant ? PH_CLASS_MAP[r.ph.dominant] : null;
  const lifeClass = r.life.dominant ? LIFE_CLASS_MAP[r.life.dominant] : null;

  const samplesTable = (
    <div className="overflow-hidden rounded-xl border border-[hsl(var(--ds-line))]">
      <table className="w-full text-left text-[11px]">
        <thead>
          <tr className="bg-[hsl(var(--ds-forest))]/8 text-[9px] uppercase tracking-[0.18em] text-[hsl(var(--ds-forest))]/80">
            <th className="px-2.5 py-2">#</th>
            <th className="px-2.5 py-2">Lieu</th>
            <th className="px-2.5 py-2">Structure</th>
            <th className="px-2.5 py-2">Texture</th>
            <th className="px-2.5 py-2">pH</th>
            <th className="px-2.5 py-2">Vie du sol</th>
          </tr>
        </thead>
        <tbody>
          {r.samples.map((s) => {
            const incomplete = r.incomplete.includes(s.label);
            const ph = typeof s.ph_value === 'number' ? s.ph_value : null;
            const phc = ph != null ? classifyPh(ph) : null;
            const signs = (s.life_signs ?? [])
              .map((id) => LIFE_SIGN_MAP[id as LifeSignId]?.short)
              .filter(Boolean);

            return (
              <tr
                key={s.id}
                className={
                  'border-t border-[hsl(var(--ds-line))] align-top ' +
                  (incomplete ? 'bg-amber-50/50' : '')
                }
              >
                <td className="px-2.5 py-2 font-bold text-[hsl(var(--ds-forest-deep))]">
                  {s.label}
                  {s.lat != null && s.lng != null && (
                    <MapPin className="inline w-3 h-3 ml-1 text-[hsl(var(--ds-gold))]" />
                  )}
                </td>
                <td className="px-2.5 py-2 text-[hsl(var(--ds-forest-deep))]/80">
                  {s.location?.trim() || '—'}
                </td>
                <td className="px-2.5 py-2">
                  {s.structure_result ? (
                    <>
                      <span className="font-semibold">{RESULT_SHORT[s.structure_result]}</span>
                      {s.structure_test && (
                        <span className="block text-[9px] uppercase tracking-wider text-[hsl(var(--ds-forest))]/60">
                          {TEST_LABELS[s.structure_test]}
                        </span>
                      )}
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-2.5 py-2">
                  {s.texture_result ? (
                    <>
                      <span className="font-semibold">{TEXTURE_SHORT[s.texture_result]}</span>
                      <span className="block text-[9px] uppercase tracking-wider text-[hsl(var(--ds-forest))]/60">
                        {s.texture_test ? TEXTURE_TEST_LABELS[s.texture_test] : ''}
                        {s.boudin_form ? ` · ${BOUDIN_FORM_MAP[s.boudin_form].label}` : ''}
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-2.5 py-2">
                  {ph != null ? (
                    <>
                      <span className="font-semibold">{ph.toFixed(1)}</span>
                      <span className="block text-[9px] uppercase tracking-wider text-[hsl(var(--ds-forest))]/60">
                        {phc?.short}
                        {s.ph_test ? ` · ${PH_TEST_LABELS[s.ph_test]}` : ''}
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-2.5 py-2">
                  {signs.length || typeof s.worm_count === 'number' ? (
                    <>
                      <span className="font-semibold">
                        {typeof s.worm_count === 'number' ? `${s.worm_count} vers` : '—'}
                      </span>
                      <span className="block text-[9px] text-[hsl(var(--ds-forest))]/70">
                        {signs.join(' · ') || (s.life_test ? LIFE_TEST_LABELS[s.life_test] : '')}
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="analyze-print-root relative bg-[hsl(var(--ds-cream))] border border-[hsl(var(--ds-line))] shadow-[0_10px_40px_-15px_rgba(22,48,32,0.15)] p-8 md:p-14 overflow-hidden print:shadow-none print:border-0"
    >
      {/* Cartouche impression */}
      {showFirst && (
        <div className={printOnly ? 'block mb-8' : 'hidden print:block mb-8'}>
          <div className="border-t-2 border-b-2 border-[hsl(var(--ds-gold))] py-6 text-center">
            <div className="text-[10px] font-bold tracking-[0.4em] uppercase text-[hsl(var(--ds-forest))]/70">
              Diagnostic Propriété · Étape 2
            </div>
            <h1 className="mt-3 font-serif italic text-4xl text-[hsl(var(--ds-forest-deep))] leading-tight">
              {propertyName ?? 'Analyse du sol'}
            </h1>
            <div className="mt-3 text-[11px] tracking-[0.25em] uppercase text-[hsl(var(--ds-forest))]/70">
              Validé le {dateStr} · Fréquence du Vivant
            </div>
          </div>
        </div>
      )}

      {printSection === 'second' && (
        <div className="mb-10 border-b border-[hsl(var(--ds-gold))]/70 pb-5">
          <div className="text-[10px] font-bold tracking-[0.35em] uppercase text-[hsl(var(--ds-forest))]/70">
            Diagnostic Propriété · Étape 2 · Suite
          </div>
          <h2 className="mt-2 font-serif italic text-3xl text-[hsl(var(--ds-forest-deep))] leading-tight">
            {propertyName ?? 'Analyse du sol'}
          </h2>
          <div className="mt-2 text-[10px] tracking-[0.25em] uppercase text-[hsl(var(--ds-forest))]/60">
            Prélèvements · lectures agronomiques · Fréquence du Vivant
          </div>
        </div>
      )}

      {/* Sceau daté (écran) */}
      {!printOnly && (
        <div className="absolute top-6 right-6 md:top-8 md:right-8 w-32 h-32 flex items-center justify-center rotate-12 pointer-events-none z-10 print:hidden">
          <svg className="absolute inset-0 w-full h-full text-[hsl(var(--ds-forest-deep))]" viewBox="0 0 100 100">
            <defs>
              <path
                id="analyze-seal-circle"
                d="M 15,50 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0"
                fill="transparent"
              />
            </defs>
            <text className="fill-current" style={{ fontSize: '7px', letterSpacing: '2px', fontWeight: 700 }}>
              <textPath href="#analyze-seal-circle">
                ANALYSE DU SOL • FRÉQUENCE DU VIVANT •
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
              Étape 2
            </span>
          </div>
        </div>
      )}

      {/* Header écran */}
      {!printOnly && (
        <header className="mb-6 md:mb-8 border-b border-[hsl(var(--ds-line))] pb-6 pr-32 print:hidden">
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]">
            Étape 2 — Terminée
          </span>
          <h2 className="mt-2 font-serif italic text-4xl md:text-5xl text-[hsl(var(--ds-forest-deep))] leading-tight">
            {propertyName ? `Le sol — ${propertyName}` : 'Analyse du sol'}
          </h2>
          <p className="mt-3 text-sm md:text-base text-[hsl(var(--ds-forest-deep))]/70 max-w-xl">
            Lecture agronomique du sol par prélèvement : structure, texture, acidité, vie
            biologique. Socle technique du projet de plantation.
          </p>
        </header>
      )}

      {showFirst && (
        <>
          <SoilSamplesPlan
            parcelles={parcelles}
            samples={r.samples}
            propertyName={propertyName}
            printOnly={printOnly}
            onEdit={() => onEditBlock('prelevements')}
          />



          {/* Lecture dominante */}
          <div className="mb-8 border-l-2 border-[hsl(var(--ds-gold))] pl-4 print-avoid-break">
            <div className="text-[9px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/70">
              Lecture dominante
            </div>
            <p className="mt-1.5 font-serif italic text-2xl md:text-3xl text-[hsl(var(--ds-forest-deep))] leading-snug">
              {r.sentence}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip tone="muted">{r.samples.length} prélèvements</Chip>
              <Chip tone="muted">{r.placedSamples} géolocalisés</Chip>
              {r.ph.average != null && <Chip tone="muted">pH moyen {r.ph.average.toFixed(1)}</Chip>}
              {r.life.averageWorms != null && (
                <Chip tone="muted">{r.life.averageWorms.toFixed(1)} vers / bêchée</Chip>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <Section number={1} title="État du terrain" blockId="terrain" onEditBlock={onEditBlock} printOnly={printOnly}>
              {r.terrainLabel ? (
                <>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    <Chip>{r.terrainLabel}</Chip>
                  </div>
                  <p className="text-[hsl(var(--ds-forest-deep))]/85 leading-relaxed">
                    {r.terrainReading}
                  </p>
                </>
              ) : (
                <Empty />
              )}
            </Section>

            <Section
              number={2}
              title="Prélèvements"
              blockId="prelevements"
              onEditBlock={onEditBlock}
              printOnly={printOnly}
              warn={r.samples.length === 0}
            >
              <div className="mb-3 flex flex-wrap gap-1.5">
                {r.samples.map((s) => (
                  <Chip key={s.id}>
                    <span className="font-bold">{s.label}</span>
                    <span className="opacity-70">{s.location?.trim() || 'sans repère'}</span>
                  </Chip>
                ))}
                {r.samples.length === 0 && <Empty />}
              </div>
              <p className="text-[hsl(var(--ds-forest-deep))]/85 leading-relaxed">
                {r.placedSamples} prélèvement{r.placedSamples > 1 ? 's' : ''} positionné
                {r.placedSamples > 1 ? 's' : ''} sur la carte cadastrale du site.
              </p>
            </Section>

            <Section
              number={3}
              title="Structure du sol"
              blockId="structure"
              onEditBlock={onEditBlock}
              printOnly={printOnly}
              warn={r.structure.dominant === 'compacte'}
            >
              {r.structure.dominant ? (
                <>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    <Chip>{RESULT_SHORT[r.structure.dominant]}</Chip>
                    <Chip tone="muted">{r.structure.filled} / {r.samples.length} testés</Chip>
                    {r.structure.contrasted && <Chip tone="muted">Sol contrasté</Chip>}
                  </div>
                  <p className="text-[hsl(var(--ds-forest-deep))]/85 leading-relaxed">
                    {r.readings.find((x) => x.key === 'structure')?.text}
                  </p>
                </>
              ) : (
                <Empty />
              )}
            </Section>

            <Section
              number={4}
              title="Texture du sol"
              blockId="texture"
              onEditBlock={onEditBlock}
              printOnly={printOnly}
            >
              {r.texture.dominant ? (
                <>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    <Chip>{TEXTURE_SHORT[r.texture.dominant]}</Chip>
                    <Chip tone="muted">{r.texture.filled} / {r.samples.length} testés</Chip>
                    {r.texture.contrasted && <Chip tone="muted">Texture contrastée</Chip>}
                  </div>
                  <p className="text-[hsl(var(--ds-forest-deep))]/85 leading-relaxed">
                    {r.readings.find((x) => x.key === 'texture')?.text}
                  </p>
                </>
              ) : (
                <Empty />
              )}
            </Section>
          </div>
        </>
      )}

      {showSecond && (
        <div
          className={`${printSection === 'all' ? 'print-break-before mt-8' : 'mt-0'} grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8`}
        >
          <Section
            number={5}
            title="Acidité"
            blockId="ph"
            onEditBlock={onEditBlock}
            printOnly={printOnly}
            warn={r.ph.dominant === 'tres_acide' || r.ph.dominant === 'basique'}
          >
            {phClass ? (
              <>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <Chip>{phClass.label}</Chip>
                  {r.ph.average != null && <Chip tone="muted">Moyenne {r.ph.average.toFixed(1)}</Chip>}
                  {r.ph.min != null && r.ph.max != null && (
                    <Chip tone="muted">
                      {r.ph.min.toFixed(1)} → {r.ph.max.toFixed(1)}
                    </Chip>
                  )}
                </div>
                <p className="text-[hsl(var(--ds-forest-deep))]/85 leading-relaxed">
                  {phClass.nutrients} {phClass.advice}
                </p>
              </>
            ) : (
              <Empty />
            )}
          </Section>

          <Section
            number={6}
            title="Vie du sol"
            blockId="life"
            onEditBlock={onEditBlock}
            printOnly={printOnly}
            warn={r.life.dominant === 'discrete'}
          >
            {lifeClass ? (
              <>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <Chip>{lifeClass.label}</Chip>
                  {r.life.averageScore != null && (
                    <Chip tone="muted">Indice {r.life.averageScore.toFixed(1)}/100</Chip>
                  )}
                  <Chip tone="muted">{r.life.union.length} indices relevés</Chip>
                </div>
                <p className="text-[hsl(var(--ds-forest-deep))]/85 leading-relaxed">
                  {lifeClass.reading} {lifeClass.advice}
                </p>
              </>
            ) : (
              <Empty />
            )}
          </Section>

          {/* Tableau des prélèvements — pleine largeur */}
          <div className="md:col-span-2 mt-4 pt-8 border-t border-[hsl(var(--ds-line))] print-avoid-break">
            <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
              <div>
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]">
                  07. Registre des prélèvements
                </span>
                <h3 className="mt-1 font-serif italic text-3xl text-[hsl(var(--ds-forest-deep))]">
                  Le sol, point par point
                </h3>
              </div>
              {r.incomplete.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-3 h-3" /> {r.incomplete.join(' · ')} à compléter
                </span>
              )}
            </div>
            {samplesTable}
          </div>

          {/* Note de synthèse */}
          {(state.synthesis ?? '').trim().length > 0 && (
            <div className="md:col-span-2 print-avoid-break">
              <Section
                number={8}
                title="Note de synthèse"
                blockId="synthesis"
                onEditBlock={onEditBlock}
                printOnly={printOnly}
              >
                <p className="font-serif italic text-lg text-[hsl(var(--ds-forest-deep))] leading-relaxed whitespace-pre-line">
                  {state.synthesis}
                </p>
              </Section>
            </div>
          )}
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
              Observations verrouillées · prêtes pour le rapport client
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                if (onPrint) {
                  onPrint();
                  return;
                }
                document.body.classList.add('analyze-printing');
                const cleanup = () => {
                  document.body.classList.remove('analyze-printing');
                  window.removeEventListener('afterprint', cleanup);
                };
                window.addEventListener('afterprint', cleanup);
                setTimeout(() => window.print(), 50);
              }}
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
            {onNextStep && (
              <button
                onClick={onNextStep}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] text-xs font-semibold uppercase tracking-widest hover:bg-[hsl(var(--ds-forest-deep))] transition-colors rounded"
              >
                J'identifie <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </footer>
      )}
    </motion.article>
  );
};
