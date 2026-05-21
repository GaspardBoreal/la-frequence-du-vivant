import React from 'react';
import { ArrowUp, ArrowDown, RefreshCcw } from 'lucide-react';
import type { TrophicStar } from '@/hooks/useTrophicChain';
import type { BeamCounts } from './useTrophicBeams';

export type Beam = 'eat' | 'eaten' | 'recycle' | null;

interface Props {
  selected: TrophicStar;
  counts: BeamCounts;
  activeBeam: Beam;
  onToggleBeam: (beam: Exclude<Beam, null>) => void;
}

/**
 * Overlay flottant : chips compteurs filtrant les 3 faisceaux trophiques
 * autour d'une espèce sélectionnée (mangeurs ↑, proies ↓, recycleurs ⟲).
 */
export const TrophicBeamOverlay: React.FC<Props> = ({ selected, counts, activeBeam, onToggleBeam }) => {
  const total = counts.eat + counts.eaten + counts.recycle;
  return (
    <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2">
      <div className="text-[11px] px-2.5 py-1.5 rounded-full bg-background/85 backdrop-blur border border-border text-foreground/90 leading-tight">
        <span className="font-semibold">{selected.commonName || selected.scientificName}</span>
        <span className="text-muted-foreground"> · {total} liens probables</span>
      </div>
      <button
        type="button"
        onClick={() => onToggleBeam('eaten')}
        className={`text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded-full border backdrop-blur transition-colors ${
          activeBeam === 'eaten' ? 'bg-foreground text-background border-foreground' : 'bg-background/80 border-border hover:bg-background'
        }`}
        title="Espèces qui mangent cette espèce"
      >
        <ArrowUp className="w-3 h-3" /> {counts.eaten} mangeurs
      </button>
      <button
        type="button"
        onClick={() => onToggleBeam('eat')}
        className={`text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded-full border backdrop-blur transition-colors ${
          activeBeam === 'eat' ? 'bg-foreground text-background border-foreground' : 'bg-background/80 border-border hover:bg-background'
        }`}
        title="Espèces dont cette espèce se nourrit"
      >
        <ArrowDown className="w-3 h-3" /> {counts.eat} proies
      </button>
      <button
        type="button"
        onClick={() => onToggleBeam('recycle')}
        className={`text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded-full border backdrop-blur transition-colors ${
          activeBeam === 'recycle' ? 'bg-foreground text-background border-foreground' : 'bg-background/80 border-border hover:bg-background'
        }`}
        title="Décomposeurs qui recyclent cette espèce"
      >
        <RefreshCcw className="w-3 h-3" /> {counts.recycle} recycleurs
      </button>
    </div>
  );
};
