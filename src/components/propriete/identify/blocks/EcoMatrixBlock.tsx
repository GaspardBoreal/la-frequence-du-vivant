import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Check, Sparkles, HelpCircle, Table2, LayoutGrid } from 'lucide-react';
import { AnalyzeCard } from '@/components/propriete/analyze/AnalyzeCard';
import {
  PLANT_INDICATORS,
  FAMILY_META,
  ECO_POLES,
  ECO_AXES,
  poleIntensity,
  computePoleScores,
  type PlantFamily,
  type PlantIndicator,
} from '@/lib/plantIndicatorKb';
import { EcoDot, EcoDotLegend } from '../EcoDot';
import { EcoSourceNote } from '../EcoSourceNote';
import { usePropertyFloraMatched } from '@/hooks/propriete/usePropertyFloraMatched';
import type { FloraMatch } from '@/lib/plantIndicatorMatcher';

const FAMILY_ORDER: PlantFamily[] = ['herbacee', 'arbuste', 'liane', 'arbre'];

const PEDAGO = [
  {
    titre: 'Comment lire ce tableau ?',
    texte:
      "Chaque ligne est une plante, chaque colonne une condition du sol. La taille de la pastille indique la force de l’indication : pleine (forte), demi (moyenne), anneau (faible), point (neutre).",
  },
  {
    titre: 'Comment l’utiliser ?',
    texte:
      "Cochez les plantes réellement observées sur le site. Repérez ensuite les colonnes où les pastilles cochées sont les plus nombreuses et les plus fortes : ce sont les tendances du lieu.",
  },
  {
    titre: 'À retenir',
    texte:
      "Une plante isolée ne prouve rien. Trois à cinq plantes convergentes sur une même colonne constituent un indice solide ; les contradictions signalent souvent une mosaïque de milieux.",
  },
];

export const EcoMatrixBlock: React.FC<{
  observed: string[];
  onToggle: (id: string) => void;
  index?: number;
  proprieteId?: string;
}> = ({ observed, onToggle, index = 0, proprieteId }) => {
  const [query, setQuery] = React.useState('');
  const [family, setFamily] = React.useState<PlantFamily | 'all'>('all');
  const [onlyChecked, setOnlyChecked] = React.useState(false);

  const { matches } = usePropertyFloraMatched(proprieteId);

  const matchById = useMemo(() => {
    const m = new Map<string, FloraMatch>();
    for (const x of matches) m.set(x.plant.id, x);
    return m;
  }, [matches]);

  const scores = useMemo(() => computePoleScores(observed), [observed]);
  const maxPoints = Math.max(1, ...scores.map((s) => s.points));

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAMILY_ORDER.map((fam) => ({
      fam,
      plants: PLANT_INDICATORS.filter((p) => {
        if (p.famille !== fam) return false;
        if (family !== 'all' && p.famille !== family) return false;
        if (onlyChecked && !observed.includes(p.id)) return false;
        if (!q) return true;
        return p.nom.toLowerCase().includes(q) || (p.latin ?? '').toLowerCase().includes(q);
      }),
    })).filter((g) => g.plants.length > 0);
  }, [query, family, onlyChecked, observed]);

  const total = groups.reduce((n, g) => n + g.plants.length, 0);

  return (
    <AnalyzeCard
      number={1}
      category="Tableau de lecture écologique"
      title="Cochez les plantes présentes sur le site"
      subtitle="Huit colonnes, quatre critères. Chaque pastille dit avec quelle force la plante indique cette condition de sol."
      index={index}
    >
      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--ds-forest))]/60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une plante…"
            className="w-full pl-9 pr-3 py-2 rounded-full text-sm border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 outline-none focus:border-[hsl(var(--ds-forest))]"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['all', ...FAMILY_ORDER] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFamily(f as PlantFamily | 'all')}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                family === f
                  ? 'bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] border-[hsl(var(--ds-forest))]'
                  : 'bg-transparent text-[hsl(var(--ds-forest-deep))] border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/50'
              }`}
            >
              {f === 'all' ? 'Toutes' : FAMILY_META[f as PlantFamily].label}
            </button>
          ))}
          <button
            onClick={() => setOnlyChecked((v) => !v)}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
              onlyChecked
                ? 'bg-[hsl(var(--ds-gold))]/25 border-[hsl(var(--ds-gold))] text-[hsl(var(--ds-earth))]'
                : 'border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/50'
            }`}
          >
            Cochées ({observed.length})
          </button>
        </div>
      </div>

      {/* ===== Vue tableau (md+) ===== */}
      <div className="hidden md:block rounded-2xl border border-[hsl(var(--ds-line))] overflow-hidden">
        <div className="max-h-[620px] overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-20">
              <tr className="bg-[hsl(var(--ds-cream))]">
                <th className="w-[34%] px-3 py-2 text-[10px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-forest))] border-b border-[hsl(var(--ds-line))]">
                  Plante
                </th>
                {(['eau', 'texture', 'nutri', 'ph'] as const).map((axis) => (
                  <th
                    key={axis}
                    colSpan={2}
                    className="px-1 py-1 text-center text-[9px] font-bold tracking-[0.24em] uppercase border-b border-l border-[hsl(var(--ds-line))]"
                    style={{ color: `hsl(var(${ECO_AXES[axis].token}))` }}
                  >
                    {ECO_AXES[axis].label}
                  </th>
                ))}
              </tr>
              <tr className="bg-[hsl(var(--ds-cream))]">
                <th className="px-3 py-1 border-b border-[hsl(var(--ds-line))]" />
                {ECO_POLES.map((pole, i) => {
                  const s = scores.find((x) => x.pole.key === pole.key)!;
                  const dominant = s.points > 0 && s.points >= maxPoints * 0.75;
                  return (
                    <th
                      key={pole.key}
                      className={`px-1 pb-1.5 pt-0.5 text-center text-[9.5px] font-semibold border-b border-[hsl(var(--ds-line))] ${
                        i % 2 === 0 ? 'border-l border-[hsl(var(--ds-line))]' : ''
                      }`}
                      style={{
                        color: `hsl(var(${ECO_AXES[pole.axis].token}))`,
                        background: dominant ? `hsl(var(${ECO_AXES[pole.axis].token}) / 0.12)` : undefined,
                      }}
                    >
                      <span className="block leading-tight">{pole.short}</span>
                      <motion.span
                        animate={dominant ? { opacity: [0.6, 1, 0.6] } : { opacity: 0.55 }}
                        transition={dominant ? { duration: 2.4, repeat: Infinity } : undefined}
                        className="block text-[9px] font-bold mt-0.5"
                      >
                        {s.points} pt{s.points > 1 ? 's' : ''}
                      </motion.span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <React.Fragment key={g.fam}>
                  <tr>
                    <td
                      colSpan={9}
                      className="px-3 py-1.5 bg-[hsl(var(--ds-forest))]/8 text-[10px] font-bold tracking-[0.24em] uppercase text-[hsl(var(--ds-forest-deep))]"
                    >
                      {FAMILY_META[g.fam].label}
                      <span className="ml-2 font-normal normal-case tracking-normal italic opacity-60">
                        {FAMILY_META[g.fam].hint}
                      </span>
                    </td>
                  </tr>
                  {g.plants.map((p) => (
                    <MatrixRow
                      key={p.id}
                      plant={p}
                      checked={observed.includes(p.id)}
                      onToggle={() => onToggle(p.id)}
                      match={matchById.get(p.id)}
                    />
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Vue cartes (mobile) ===== */}
      <div className="md:hidden space-y-4">
        {groups.map((g) => (
          <section key={g.fam}>
            <div className="text-[10px] font-bold tracking-[0.24em] uppercase text-[hsl(var(--ds-forest))] mb-1.5">
              {FAMILY_META[g.fam].label}
            </div>
            <div className="space-y-2">
              {g.plants.map((p) => (
                <MatrixCard
                  key={p.id}
                  plant={p}
                  checked={observed.includes(p.id)}
                  onToggle={() => onToggle(p.id)}
                  match={matchById.get(p.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {total === 0 && (
        <div className="text-center text-[11px] italic text-[hsl(var(--ds-forest-deep))]/60 py-6">
          Aucune plante ne correspond à cette recherche.
        </div>
      )}

      {/* Légende + encarts pédagogiques */}
      <div className="mt-4 rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 p-3">
        <div className="text-[9px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/70 mb-1.5">
          Légende des intensités
        </div>
        <EcoDotLegend />
      </div>

      <div className="mt-3 grid md:grid-cols-3 gap-3">
        {PEDAGO.map((p, i) => (
          <motion.div
            key={p.titre}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.06 * i }}
            className="rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 p-3"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase text-[hsl(var(--ds-forest))]">
              {i === 0 ? <Table2 className="w-3.5 h-3.5" /> : i === 1 ? <LayoutGrid className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              {p.titre}
            </div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-[hsl(var(--ds-forest-deep))]/80">{p.texte}</p>
          </motion.div>
        ))}
      </div>

      <EcoSourceNote />
    </AnalyzeCard>
  );
};

const PlantIdentity: React.FC<{ plant: PlantIndicator; match?: FloraMatch; checked: boolean }> = ({
  plant,
  match,
  checked,
}) => (
  <span className="flex items-center gap-2 min-w-0">
    <span
      className={`inline-flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-colors ${
        checked
          ? 'bg-[hsl(var(--ds-forest))] border-[hsl(var(--ds-forest))] text-white'
          : 'border-[hsl(var(--ds-line))] bg-white/60'
      }`}
    >
      {checked && <Check className="w-3 h-3" strokeWidth={3} />}
    </span>
    <span className="min-w-0">
      <span className="block text-[12px] font-semibold text-[hsl(var(--ds-forest-deep))] leading-tight truncate">
        {plant.nom}
      </span>
      {plant.latin && (
        <span className="block text-[10px] italic text-[hsl(var(--ds-forest-deep))]/55 truncate">{plant.latin}</span>
      )}
    </span>
    {match && match.confidence === 'high' && (
      <span
        title={`Observée ${match.observations}× par les marcheurs`}
        className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-700 px-1.5 py-0.5 text-[9px] font-semibold shrink-0"
      >
        <Sparkles className="w-2.5 h-2.5" /> {match.observations}×
      </span>
    )}
    {match && (match.confidence === 'medium' || match.confidence === 'low') && (
      <span
        title="Signal faible — à confirmer"
        className="ml-auto inline-flex items-center rounded-full bg-amber-500/15 text-amber-700 px-1.5 py-0.5 text-[9px] font-semibold shrink-0"
      >
        <HelpCircle className="w-2.5 h-2.5" />
      </span>
    )}
  </span>
);

const MatrixRow: React.FC<{
  plant: PlantIndicator;
  checked: boolean;
  onToggle: () => void;
  match?: FloraMatch;
}> = ({ plant, checked, onToggle, match }) => (
  <tr
    onClick={onToggle}
    className={`cursor-pointer transition-colors border-b border-[hsl(var(--ds-line))]/50 ${
      checked ? 'bg-[hsl(var(--ds-forest))]/8' : 'hover:bg-[hsl(var(--ds-forest))]/4'
    }`}
  >
    <td className="px-3 py-1.5">
      <PlantIdentity plant={plant} match={match} checked={checked} />
    </td>
    {ECO_POLES.map((pole, i) => (
      <td
        key={pole.key}
        className={`px-1 py-1.5 text-center ${i % 2 === 0 ? 'border-l border-[hsl(var(--ds-line))]/60' : ''}`}
      >
        <EcoDot
          axis={pole.axis}
          value={poleIntensity(plant, pole)}
          delay={i * 0.015}
          title={`${plant.nom} · ${pole.label}`}
        />
      </td>
    ))}
  </tr>
);

const MatrixCard: React.FC<{
  plant: PlantIndicator;
  checked: boolean;
  onToggle: () => void;
  match?: FloraMatch;
}> = ({ plant, checked, onToggle, match }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`w-full text-left rounded-2xl border p-3 transition-all ${
      checked
        ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))]/8'
        : 'border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60'
    }`}
  >
    <PlantIdentity plant={plant} match={match} checked={checked} />
    <div className="mt-2 grid grid-cols-4 gap-y-2">
      {ECO_POLES.map((pole) => (
        <div key={pole.key} className="flex flex-col items-center gap-0.5">
          <EcoDot axis={pole.axis} value={poleIntensity(plant, pole)} size={16} />
          <span
            className="text-[8.5px] leading-none text-center"
            style={{ color: `hsl(var(${ECO_AXES[pole.axis].token}))` }}
          >
            {pole.short}
          </span>
        </div>
      ))}
    </div>
  </button>
);
