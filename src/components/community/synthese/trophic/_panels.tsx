import React from 'react';
import { Info, Sparkles } from 'lucide-react';
import {
  TROPHIC_LEVELS,
  DECOMPOSER_META,
  getLevelMeta,
  probablePreyGroups,
  type TrophicGroup,
} from '@/lib/trophicClassification';
import type { TrophicChainResult, TrophicStar } from '@/hooks/useTrophicChain';
import { SpeciesName } from '@/components/species/SpeciesName';

export const DefaultPanel: React.FC<{
  chain: TrophicChainResult;
  onLevelClick: (g: TrophicGroup) => void;
  intro?: string;
}> = ({ chain, onLevelClick, intro }) => (
  <>
    <div className="flex items-center gap-2 text-foreground">
      <Sparkles className="w-4 h-4 text-primary" />
      <h3 className="text-sm font-semibold">Lecture trophique</h3>
    </div>
    <p className="text-xs text-muted-foreground leading-relaxed">
      {intro ??
        'Survolez une espèce, cliquez pour isoler sa chaîne, ou explorez un niveau pour découvrir son rôle.'}
    </p>
    <div className="space-y-1.5 pt-1">
      {[...TROPHIC_LEVELS, DECOMPOSER_META].map((l) => {
        const c = chain.counts[l.group];
        return (
          <button
            key={l.group}
            onClick={() => onLevelClick(l.group)}
            className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted/60 text-left transition"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: `hsl(var(${l.token}))` }}
              />
              <span className="text-xs font-medium text-foreground truncate">{l.label}</span>
            </span>
            <span className={`text-xs tabular-nums ${c === 0 ? 'text-muted-foreground/50' : 'text-foreground'}`}>
              {c}
            </span>
          </button>
        );
      })}
    </div>

    {chain.unclassified.length > 0 && (
      <div className="pt-2 border-t border-border text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Info className="w-3 h-3" />
          {chain.unclassified.length} espèce{chain.unclassified.length > 1 ? 's' : ''} non classée
          {chain.unclassified.length > 1 ? 's' : ''} (curation à venir)
        </span>
      </div>
    )}
  </>
);

export const LevelPanel: React.FC<{ group: TrophicGroup; chain: TrophicChainResult }> = ({ group, chain }) => {
  const meta = getLevelMeta(group);
  if (!meta) return null;
  const stars = chain.byGroup[group];
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(var(${meta.token}))` }} />
        <h3 className="text-sm font-semibold text-foreground">{meta.label}</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{meta.description}</p>
      <p className="text-[11px] text-muted-foreground italic">Exemples : {meta.examples}</p>
      <div className="pt-2 border-t border-border">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
          {stars.length} espèce{stars.length > 1 ? 's' : ''} sur ce territoire
        </p>
        {stars.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Aucune espèce détectée à ce niveau — un signal écologique fort à surveiller.
          </p>
        ) : (
          <ul className="space-y-1 max-h-72 overflow-y-auto">
            {stars.slice(0, 50).map((s) => (
              <li key={s.scientificName} className="text-xs text-foreground flex items-baseline gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
                  style={{ backgroundColor: `hsl(var(${meta.token}))` }}
                />
                <SpeciesName scientificName={s.scientificName} commonName={s.commonName} size="sm" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export const SelectedStarPanel: React.FC<{
  star: TrophicStar;
  chain: TrophicChainResult;
  onLevelClick: (g: TrophicGroup) => void;
}> = ({ star, chain, onLevelClick }) => {
  const meta = getLevelMeta(star.group);
  if (!meta) return null;
  const preyGroups = probablePreyGroups(star.group);
  return (
    <>
      <div className="flex items-start gap-3">
        {star.photoUrl && (
          <img src={star.photoUrl} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
        )}
        <div className="min-w-0">
          <SpeciesName scientificName={star.scientificName} commonName={star.commonName} showScientific size="md" />
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(var(${meta.token}))` }} />
            <span className="text-[11px] text-muted-foreground">{meta.label}</span>
          </div>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
            {star.source === 'kb' ? 'Attribution curée' : `Heuristique : ${star.rationale ?? 'règle taxonomique'}`}
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border">{meta.description}</p>
      {preyGroups.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Se nourrit de</p>
          <div className="flex flex-wrap gap-1.5">
            {preyGroups.map((g) => {
              const m = getLevelMeta(g);
              if (!m) return null;
              return (
                <button
                  key={g}
                  onClick={() => onLevelClick(g)}
                  className="text-[11px] px-2 py-0.5 rounded-full border hover:bg-muted/60"
                  style={{ borderColor: `hsl(var(${m.token}) / 0.5)`, color: `hsl(var(${m.token}))` }}
                >
                  {m.label} ({chain.counts[g]})
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
