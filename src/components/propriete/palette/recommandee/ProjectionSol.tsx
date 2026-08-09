import React from 'react';
import { Droplets, Layers, Sprout, FlaskConical } from 'lucide-react';
import StrateColumn from './StrateColumn';
import SpeciesCard from './SpeciesCard';
import { AXIS_LABEL, type SiteProfile } from '@/lib/paletteEngine';
import type { ProjectedSpecies, ProjectedStrate } from '@/lib/paletteProjections';

interface Props {
  strates: ProjectedStrate[];
  profile: SiteProfile;
  onOpen?: (sp: ProjectedSpecies) => void;
}

const AXES: Array<{ key: 'eau' | 'texture' | 'nutrition' | 'ph'; icon: React.ElementType; label: string }> = [
  { key: 'eau', icon: Droplets, label: 'Eau' },
  { key: 'texture', icon: Layers, label: 'Texture' },
  { key: 'nutrition', icon: Sprout, label: 'Nutrition' },
  { key: 'ph', icon: FlaskConical, label: 'pH' },
];

const qualify = (key: string, v: number) => {
  const low = v <= -1.2;
  const high = v >= 1.2;
  switch (key) {
    case 'eau':
      return low ? 'Sec l’été' : high ? 'Frais toute l’année' : 'Humidité moyenne';
    case 'texture':
      return low ? 'Léger, filtrant' : high ? 'Lourd, argileux' : 'Limoneux équilibré';
    case 'nutrition':
      return low ? 'Pauvre' : high ? 'Riche en azote' : 'Moyennement pourvu';
    default:
      return low ? 'Acide' : high ? 'Calcaire' : 'Neutre';
  }
};

/** Projection 1 — le sol commande, la palette obéit. */
const ProjectionSol: React.FC<Props> = ({ strates, profile, onOpen }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {AXES.map(({ key, icon: Icon, label }) => (
        <div
          key={key}
          className="rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 px-3 py-2.5"
        >
          <div className="flex items-center gap-1.5 text-[hsl(var(--ds-forest))]">
            <Icon className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]">{label}</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-[hsl(var(--ds-forest-deep))]">
            {qualify(key, profile[key])}
          </p>
          {!profile.known[key] && (
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ds-gold))]">
              Non documenté
            </p>
          )}
        </div>
      ))}
    </div>

    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {strates.map((block, i) => (
        <StrateColumn key={block.strate} block={block} index={i}>
          {block.species.map((sp, j) => (
            <SpeciesCard
              key={sp.species.id}
              sp={sp}
              index={j}
              onOpen={onOpen}
              metric={`${sp.rank}%`}
              gauge={sp.rank}
              note={
                sp.worstGap > 1.5
                  ? `Vigilance sur ${AXIS_LABEL[sp.worstAxis]} · ${sp.species.reason}`
                  : sp.species.reason
              }
            />
          ))}
        </StrateColumn>
      ))}
    </div>
  </div>
);

export default ProjectionSol;
