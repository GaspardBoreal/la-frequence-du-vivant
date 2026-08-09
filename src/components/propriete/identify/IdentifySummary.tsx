import React from 'react';
import { SoilFloraScales } from '@/components/propriete/identify/scales/SoilFloraScales';
import type { TextureKey } from '@/lib/soilFloraScales';
import { motion } from 'framer-motion';
import { Check, Pencil, Printer, RotateCcw, Leaf, AlertTriangle, Gauge, Sparkles } from 'lucide-react';
import type { PropertyFloraState } from '@/hooks/propriete/usePropertyFlora';
import { FamilyIcon, IcgRing } from '@/components/propriete/identify/FloraPictos';
import {
  VerdictChip,
  LevelGauge,
  VERDICT_TOKEN,
  CONCORDANCE_GUIDE,
  CONCORDANCE_REMEDES,
} from '@/components/propriete/identify/ConcordanceParts';
import {
  PLANT_INDICATORS,
  FAMILY_META,
  ECO_AXES,
  ECO_SOURCE,
  LEVEL_LABEL,
  READ_LEVEL_LABEL,
  poleScore,
  computePoleScores,
  computeConcordanceDetail,
  narratePoleScores,
  type PlantFamily,
  type SoilLite,
  type EcoAxis,
  type EcoPoleKey,
  type ConcordanceRow,
  ICG_BAND_LABEL,
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
  /** p1 = cortège + pôles, p2 = concordance, p3 = narration + notes + sources */
  printSection?: 'all' | 'p1' | 'p2' | 'p3';
  /** Répartition des textures des prélèvements ; à défaut, déduite de la texture dominante */
  textureCounts?: Record<TextureKey, number>;
}

const num = (n: number) => String(n).padStart(2, '0');

/** Repli quand le détail des prélèvements n'est pas transmis */
const fallbackTextureCounts = (soil: SoilLite): Record<TextureKey, number> => {
  const t = soil.texture;
  if (t === 'argile') return { argile: 1, limon: 0, sable: 0 };
  if (t === 'limon') return { argile: 0, limon: 1, sable: 0 };
  if (t === 'sable') return { argile: 0, limon: 0, sable: 1 };
  return { argile: 0, limon: 0, sable: 0 };
};

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

/* ------------------------------------------------------------------ *
 *  Rendus « écran verrouillé » — au niveau de richesse de l'édition   *
 * ------------------------------------------------------------------ */

const PAIRS: Array<{ axis: EcoAxis; left: EcoPoleKey; right: EcoPoleKey; question: string }> = [
  { axis: 'eau', left: 'eau_frais', right: 'eau_sec', question: 'Le sol retient-il l’eau ?' },
  {
    axis: 'texture',
    left: 'tex_argile_limon',
    right: 'tex_limon_sable',
    question: 'Quelle granulométrie domine ?',
  },
  { axis: 'nutri', left: 'nutri_riche', right: 'nutri_pauvre', question: 'Le milieu est-il nourrissant ?' },
  { axis: 'ph', left: 'ph_calcaire', right: 'ph_acide', question: 'Quelle réaction chimique ?' },
];

const LEVELS = ['tres_faible', 'faible', 'moyen', 'fort', 'tres_fort'] as const;

/** Section 02 enrichie : les 4 critères, deux pôles opposés par carte */
const RichPoles: React.FC<{
  scores: ReturnType<typeof computePoleScores>;
  plantCount: number;
}> = ({ scores, plantCount }) => {
  if (plantCount === 0) return <Empty />;
  return (
    <div className="space-y-4">


      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {PAIRS.map((pair) => {
          const l = poleScore(scores, pair.left);
          const r = poleScore(scores, pair.right);
          const color = `hsl(var(${ECO_AXES[pair.axis].token}))`;
          const dominant = l.points === r.points ? null : l.points > r.points ? l : r;
          return (
            <div
              key={pair.axis}
              className="rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 p-3"
            >
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold tracking-[0.24em] uppercase" style={{ color }}>
                  {ECO_AXES[pair.axis].label}
                </span>
                <span className="text-[10px] italic text-[hsl(var(--ds-forest-deep))]/60">
                  {pair.question}
                </span>
              </div>

              {[l, r].map((s) => (
                <div key={s.pole.key} className="mb-2 last:mb-0">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold text-[hsl(var(--ds-forest-deep))]">
                      {s.pole.label}
                    </span>
                    <span className="tabular-nums text-[hsl(var(--ds-forest-deep))]/70">
                      {s.points} pt{s.points > 1 ? 's' : ''} · {s.contributors} plante
                      {s.contributors > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex gap-[3px]">
                    {LEVELS.map((lv, li) => {
                      const active = LEVELS.indexOf(s.level) >= li && s.points > 0;
                      return (
                        <span
                          key={lv}
                          className="h-2.5 flex-1 rounded-full"
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
            </div>
          );
        })}
      </div>

      <div className="text-[10px] italic text-[hsl(var(--ds-forest-deep))]/60 text-right">
        Intensité forte = 3 points, moyenne = 2, faible = 1 · calcul basé sur {plantCount} plante
        {plantCount > 1 ? 's' : ''} cochée{plantCount > 1 ? 's' : ''}.
      </div>
    </div>
  );
};

/** Section 03 enrichie : anneau + fiabilité + tableau à jauges */
const RichConcordance: React.FC<{
  detail: ReturnType<typeof computeConcordanceDetail>;
}> = ({ detail }) => {
  const { rows, points, max, icg, band, counts, reliability, evaluated } = detail;
  const isAxisStart = (r: ConcordanceRow, i: number) => i === 0 || rows[i - 1].axis !== r.axis;
  const bandToken = band === 'bonne' ? 'oui' : band === 'moyenne' ? 'partiel' : 'non';

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start gap-5">
        <div className="flex-shrink-0 w-full md:w-[212px] text-center">
          <IcgRing value={icg} band={band} still />
          <div
            className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{
              background: `hsl(var(--ds-verdict-${bandToken}) / 0.14)`,
              color: `hsl(var(--ds-verdict-${bandToken}))`,
            }}
          >
            {ICG_BAND_LABEL[band]}
          </div>
          <div className="mt-1.5 text-[10px] leading-relaxed text-[hsl(var(--ds-forest-deep))]/70">
            <span className="font-semibold">
              {points} / {max} points
            </span>{' '}
            → ICG {icg} %
            <br />
            {counts.oui} oui · {counts.partiel} partiel · {counts.non} non · {counts.na} non évalué
          </div>

          <div className="mt-3 rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 px-3 py-2 text-left">
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--ds-forest))]">
              <Gauge className="w-3 h-3" /> Fiabilité {reliability} %
            </div>
            <div className="mt-1 h-[6px] w-full rounded-full bg-[hsl(var(--ds-line))]/60 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${reliability}%`, background: 'hsl(var(--ds-eco-eau))' }}
              />
            </div>
            <p className="mt-1 text-[10px] leading-snug text-[hsl(var(--ds-forest-deep))]/70">
              {evaluated} ligne{evaluated > 1 ? 's' : ''} sur 8 réellement évaluée
              {evaluated > 1 ? 's' : ''}.
              {counts.na > 0
                ? ' Un ICG bas peut venir des données manquantes de l’Étape 2, pas d’une divergence réelle.'
                : ' Toutes les données du sol sont renseignées.'}
            </p>
          </div>
        </div>

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
                  <tr
                    key={r.key}
                    className="transition-colors hover:bg-[hsl(var(--ds-cream))]/70"
                    style={{
                      background: i % 2 === 1 ? 'hsl(var(--ds-cream) / 0.35)' : undefined,
                      borderTop: start && i > 0 ? '1px solid hsl(var(--ds-line))' : undefined,
                    }}
                  >
                    <td className="py-1.5 pr-2.5" style={{ paddingLeft: 0 }}>
                      <div className="flex">
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-2">
        {CONCORDANCE_GUIDE.map((g) => (
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
        Calcul officiel de la méthode : 4 critères × 2 niveaux = 8 lignes, soit un maximum fixe de 16
        points (OUI 2 · PARTIEL 1 · NON 0). ICG = (score obtenu ÷ 16) × 100. Une ligne non évaluée ne
        réduit jamais le maximum : elle abaisse l'indice et la fiabilité, pour ne jamais surestimer un
        diagnostic incomplet.
      </p>

      {icg < 60 && (
        <div className="rounded-2xl border border-[hsl(var(--ds-verdict-non))]/40 bg-[hsl(var(--ds-verdict-non))]/[0.08] p-3">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.24em] uppercase text-[hsl(var(--ds-verdict-non))]">
            <AlertTriangle className="w-3.5 h-3.5" /> En cas de faible cohérence
          </div>
          <ul className="mt-1.5 space-y-1 text-[11.5px] text-[hsl(var(--ds-forest-deep))]/85">
            {CONCORDANCE_REMEDES.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="text-[hsl(var(--ds-verdict-non))]">—</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/** Section 04 enrichie : le texte adopté présenté comme un manuscrit */
const RichNarration: React.FC<{ text: string }> = ({ text }) => {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  
  return (
    <div className="relative rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 px-5 py-4">
      <span className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r bg-[hsl(var(--ds-gold))]" />
      <div className="space-y-3 pl-3">
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className={`font-serif italic text-[17px] leading-relaxed text-[hsl(var(--ds-forest-deep))] ${
              i === 0
                ? 'first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:font-serif first-letter:not-italic first-letter:text-[46px] first-letter:leading-[0.8] first-letter:text-[hsl(var(--ds-gold))]'
                : ''
            }`}
          >
            {p}
          </p>
        ))}
      </div>
      <div className="mt-3 pl-3 flex items-center gap-1.5 text-[10px] italic text-[hsl(var(--ds-forest-deep))]/55">
        <Sparkles className="w-3 h-3 text-[hsl(var(--ds-gold))]" />
        Un texte auto-généré à partir de vos observations, relu et validé par le propriétaire.

      </div>
    </div>
  );
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
  textureCounts,
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
  const showP3 = printSection === 'all' || printSection === 'p3';
  const isSuite = printSection === 'p2';
  const isNarrationPage = printSection === 'p3';
  const gridCols = printOnly
    ? 'grid grid-cols-2 gap-x-8 gap-y-6'
    : 'grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8';

  // En impression, la colonne « Cortège révélé » déborde de la page A4 :
  // les strates hautes (lianes, arbres) basculent sur la page 2 (« suite »).
  const ALL_FAMILIES: PlantFamily[] = ['herbacee', 'arbuste', 'liane', 'arbre'];
  const P1_FAMILIES: PlantFamily[] = printOnly ? ['herbacee', 'arbuste'] : ALL_FAMILIES;
  const P2_FAMILIES: PlantFamily[] = printOnly ? ['liane', 'arbre'] : [];
  const familyList = (families: PlantFamily[]) =>
    families
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
                {p.latin && <span className="italic opacity-60 text-xs">{p.latin}</span>}
              </Chip>
            ))}
          </div>
        </div>
      ));
  const hasP2Cortege = P2_FAMILIES.some((f) => byFamily.has(f));

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

      {isNarrationPage && (
        <div className="mb-8 border-b border-[hsl(var(--ds-gold))]/70 pb-5">
          <div className="text-[10px] font-bold tracking-[0.35em] uppercase text-[hsl(var(--ds-forest))]/70">
            Diagnostic Propriété · Étape 3 · Narration
          </div>
          <h2 className="mt-2 font-serif italic text-3xl text-[hsl(var(--ds-forest-deep))] leading-tight">
            {propertyName ?? 'La flore en place'}
          </h2>
          <div className="mt-2 text-[10px] tracking-[0.25em] uppercase text-[hsl(var(--ds-forest))]/60">
            Ce que la flore raconte · Fréquence du Vivant
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
                  {familyList(P1_FAMILIES)}
                  {hasP2Cortege && (
                    <div className="text-[9px] uppercase tracking-[0.2em] text-[hsl(var(--ds-forest))]/50">
                      Lianes &amp; arbres — voir page suivante
                    </div>
                  )}
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
              {!printOnly ? (
                <RichPoles scores={scores} plantCount={plants.length} />
              ) : (
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
              )}

            </Section>
          </div>
        </>
      )}

      {showP2 && (
        <div className={`${printSection === 'all' ? 'print-break-before mt-8' : 'mt-0'} space-y-8`}>
          {hasP2Cortege && (
            <Section
              number={1}
              title="Cortège révélé · suite (strates hautes)"
              blockId="cortege"
              onEditBlock={onEditBlock}
              printOnly={printOnly}
            >
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">{familyList(P2_FAMILIES)}</div>
            </Section>
          )}
          <Section

            number={3}
            title="Concordance sol ↔ flore"
            blockId="concordance"
            onEditBlock={onEditBlock}
            printOnly={printOnly}
            warn={!soilAvailable}
          >
            <SoilFloraScales
              detail={detail}
              hasFlora={(state.observed_plants?.length ?? 0) > 0}
              soilAvailable={soilAvailable}
              textureCounts={textureCounts ?? fallbackTextureCounts(soil)}
              print={printOnly}
              className="mb-4"
            />
            {!soilAvailable ? (
              <p className="text-sm italic text-[hsl(var(--ds-forest-deep))]/60">
                L'étape 2 « J'analyse le sol » n'est pas encore renseignée : la concordance
                reste en attente.
              </p>
            ) : !printOnly ? (
              <RichConcordance detail={detail} />
            ) : (
              <div className="flex flex-col md:flex-row gap-6 items-start">

                <div className="shrink-0 text-center">
                  <IcgRing value={detail.icg} size={112} band={detail.band} still={printOnly} />
                  <div className="mt-1 text-[9px] uppercase tracking-[0.2em] font-bold text-[hsl(var(--ds-forest))]/80">
                    {ICG_BAND_LABEL[detail.band]}
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.2em] text-[hsl(var(--ds-forest))]/60">
                    {detail.points} / {detail.max} points
                  </div>
                  <div className="mt-0.5 text-[9px] text-[hsl(var(--ds-forest-deep))]/55">
                    Fiabilité {detail.reliability} % · {detail.evaluated}/8 lignes évaluées
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
        </div>
      )}

      {showP3 && (
        <div className={`${printSection === 'all' ? 'mt-8' : 'mt-0'} space-y-8`}>
          {printOnly && sentence && (
            <div className="identify-narration-exergue print-avoid-break">
              <div className="text-[9px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/70">
                Lecture dominante
              </div>
              <p className="mt-1.5 font-serif italic text-xl text-[hsl(var(--ds-forest-deep))] leading-snug">
                {sentence}
              </p>
            </div>
          )}

          <Section
            number={4}
            title="Ce que la flore raconte"
            blockId="narration"
            onEditBlock={onEditBlock}
            printOnly={printOnly}
            warn={!(state.flora_conclusion ?? '').trim()}
          >
            {(state.flora_conclusion ?? '').trim() ? (
              printOnly ? (
                <div className="identify-narration-print">
                  <div className="identify-narration-body">
                    {(state.flora_conclusion ?? '')
                      .trim()
                      .split(/\n{2,}/)
                      .filter((p) => p.trim())
                      .map((para, i) => (
                        <p key={i} className={i === 0 ? 'identify-narration-lead' : undefined}>
                          {para.trim()}
                        </p>
                      ))}
                  </div>
                  <div className="identify-narration-trace">
                    Texte auto-généré à partir des observations du site, relu et validé par le
                    propriétaire · Fréquence du Vivant
                  </div>
                </div>
              ) : (
                <RichNarration text={(state.flora_conclusion ?? '').trim()} />
              )
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
