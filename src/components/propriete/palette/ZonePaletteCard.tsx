import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Leaf, ShieldCheck, Sparkles, ChevronDown } from 'lucide-react';
import {
  STRATE_LABEL,
  type PaletteStrate,
  type PaletteSpecies,
} from '@/lib/plantPaletteKb';
import type { ScoredSpecies, StrateRecommendation, ZoneAmbiance } from '@/lib/paletteEngine';
import { ZONE_AMBIANCES } from '@/lib/paletteEngine';
import { zoneSignature } from './zoneSignature';

const STRATE_TINT: Record<PaletteStrate, string> = {
  arbre: '#2f5d3a',
  arbuste: '#4f7a44',
  grimpante: '#6b7c5a',
  herbacee: '#b08d57',
  couvre_sol: '#8a6d3b',
};

const STRATE_SHORT: Record<PaletteStrate, string> = {
  arbre: 'Arb',
  arbuste: 'Arbu',
  grimpante: 'Grim',
  herbacee: 'Herb',
  couvre_sol: 'Sol',
};


const ScoreDot: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 80 ? '#2f7d4f' : score >= 60 ? '#b08d57' : '#c07a3a';
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold tabular-nums" style={{ color }}>
      <span className="w-1.5 h-1.5 rounded-full print-exact" style={{ backgroundColor: color }} />
      {score}
    </span>
  );
};

export const SpeciesRow: React.FC<{
  entry: ScoredSpecies;
  selected: boolean;
  onToggle?: () => void;
  compact?: boolean;
}> = ({ entry, selected, onToggle, compact }) => {
  const sp: PaletteSpecies = entry.species;
  return (
    <div
      className={[
        'group relative rounded-2xl border p-3 transition-all print-avoid-break',
        selected
          ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))]/[0.06]'
          : 'border-[hsl(var(--ds-line))] bg-white/50 hover:border-[hsl(var(--ds-gold))]/60',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        {onToggle && (
          <button
            onClick={onToggle}
            aria-label={selected ? 'Retirer de la palette' : 'Retenir cette espèce'}
            className={[
              'mt-0.5 w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all',
              selected
                ? 'bg-[hsl(var(--ds-forest))] border-[hsl(var(--ds-forest))] text-white'
                : 'border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest))] hover:border-[hsl(var(--ds-forest))]',
            ].join(' ')}
          >
            {selected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        )}
        <div className="min-w-0 flex-1">
          {/* Ligne 1 — identité */}
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-serif text-[15px] text-[hsl(var(--ds-forest-deep))]">{sp.fr}</span>
            <span className="italic text-[12px] text-[hsl(var(--ds-forest))]/70">{sp.latin}</span>
            <span className="ml-auto flex items-center gap-2">
              <ScoreDot score={entry.score} />
            </span>
          </div>
          {/* Ligne 2 — raison écologique */}
          <p className="mt-1 text-[12px] leading-snug text-[hsl(var(--ds-forest-deep))]/80">
            {sp.reason}
          </p>
          {/* Ligne 3 — service rendu */}
          <p className="mt-0.5 text-[12px] leading-snug italic text-[hsl(var(--ds-gold))]">
            {sp.service}
          </p>
          {/* Origine */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className="text-[9px] font-bold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full print-exact"
              style={
                sp.origin === 'indigene'
                  ? { backgroundColor: '#e6f0e4', color: '#2f5d3a' }
                  : { backgroundColor: '#f2e9d8', color: '#8a6d3b' }
              }
            >
              {sp.origin === 'indigene' ? 'Indigène' : 'Horticole'}
            </span>
            {sp.vegetalLocal && (
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 print-exact bg-[#dff0e6] text-[#1e6b45]">
                <ShieldCheck className="w-2.5 h-2.5" /> Végétal local
              </span>
            )}
            {!compact &&
              sp.services.slice(0, 3).map((s) => (
                <span
                  key={s}
                  className="text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-full border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest))]/75"
                >
                  {s}
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface Props {
  index: number;
  name: string;
  color: string;
  ambiance: ZoneAmbiance;
  intention?: string | null;
  recommendations: StrateRecommendation[];
  selectedIds: string[];
  onAmbianceChange?: (a: ZoneAmbiance) => void;
  onIntentionChange?: (v: string) => void;
  onToggleSpecies?: (id: string) => void;
  onRename?: (v: string) => void;
  readOnly?: boolean;
}

export const ZonePaletteCard: React.FC<Props> = ({
  index,
  name,
  color,
  ambiance,
  intention,
  recommendations,
  selectedIds,
  onAmbianceChange,
  onIntentionChange,
  onToggleSpecies,
  onRename,
  readOnly,
}) => {
  const letter = String.fromCharCode(65 + index);
  const selected = new Set(selectedIds);
  const selectedCount = recommendations
    .flatMap((r) => r.species)
    .filter((s) => selected.has(s.species.id)).length;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45 }}
      className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] overflow-hidden print-avoid-break"
    >
      <header className="flex items-start gap-4 p-5 border-b border-[hsl(var(--ds-line))]/70">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center font-serif text-lg text-white shrink-0 print-exact"
          style={{ backgroundColor: color }}
        >
          {letter}
        </div>
        <div className="min-w-0 flex-1">
          {readOnly || !onRename ? (
            <div className="font-serif italic text-xl text-[hsl(var(--ds-forest-deep))]">{name}</div>
          ) : (
            <input
              value={name}
              onChange={(e) => onRename(e.target.value)}
              className="w-full bg-transparent font-serif italic text-xl text-[hsl(var(--ds-forest-deep))] outline-none border-b border-transparent focus:border-[hsl(var(--ds-gold))]"
            />
          )}
          <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[hsl(var(--ds-forest))]/70">
            Emplacement {letter} · {selectedCount} espèce{selectedCount > 1 ? 's' : ''} retenue
            {selectedCount > 1 ? 's' : ''}
          </div>
        </div>
      </header>

      {!readOnly && (
        <div className="px-5 py-3 border-b border-[hsl(var(--ds-line))]/60 flex flex-wrap gap-1.5">
          {ZONE_AMBIANCES.map((a) => (
            <button
              key={a.id}
              title={a.hint}
              onClick={() => onAmbianceChange?.(a.id)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                ambiance === a.id
                  ? 'bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] border-[hsl(var(--ds-forest))]'
                  : 'bg-transparent text-[hsl(var(--ds-forest-deep))] border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/50'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {!readOnly && (
        <div className="px-5 pt-3">
          <input
            value={intention ?? ''}
            onChange={(e) => onIntentionChange?.(e.target.value)}
            placeholder="Intention de cet emplacement (ombrer la terrasse, cacher la route, nourrir les abeilles…)"
            className="w-full rounded-xl border border-[hsl(var(--ds-line))] bg-white/60 px-3 py-2 text-[12px] text-[hsl(var(--ds-forest-deep))] outline-none focus:border-[hsl(var(--ds-gold))] placeholder:text-[hsl(var(--ds-forest))]/40"
          />
        </div>
      )}
      {readOnly && intention && (
        <p className="px-5 pt-3 text-[12px] italic text-[hsl(var(--ds-forest-deep))]/75">
          « {intention} »
        </p>
      )}

      <div className="p-5 space-y-4">
        {recommendations.map((r) => {
          const list = readOnly
            ? r.species.filter((s) => selected.has(s.species.id))
            : r.species;
          if (list.length === 0) return null;
          return (
            <section key={r.strate} className="print-avoid-break">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center print-exact"
                  style={{ backgroundColor: `${STRATE_TINT[r.strate]}22`, color: STRATE_TINT[r.strate] }}
                >
                  <Leaf className="w-3 h-3" />
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.26em]"
                  style={{ color: STRATE_TINT[r.strate] }}
                >
                  {STRATE_LABEL[r.strate]}
                </span>
                <span className="flex-1 h-px print-exact" style={{ backgroundColor: `${STRATE_TINT[r.strate]}33` }} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                {list.map((entry) => (
                  <SpeciesRow
                    key={entry.species.id}
                    entry={entry}
                    selected={selected.has(entry.species.id)}
                    onToggle={readOnly ? undefined : () => onToggleSpecies?.(entry.species.id)}
                    compact={readOnly}
                  />
                ))}
              </div>
            </section>
          );
        })}
        {readOnly && selectedCount === 0 && (
          <p className="text-xs italic text-[hsl(var(--ds-forest-deep))]/55 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Aucune espèce retenue pour cet emplacement.
          </p>
        )}
      </div>
    </motion.article>
  );
};

export default ZonePaletteCard;
