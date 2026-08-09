import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { SiteProfile } from '@/lib/paletteEngine';
import {
  PROJECTIONS,
  projectPalette,
  type ProjectionId,
} from '@/lib/paletteProjections';
import ProjectionSol from './ProjectionSol';
import ProjectionGardeManger from './ProjectionGardeManger';
import ProjectionClimat from './ProjectionClimat';
import PaletteSources from './PaletteSources';
import SpeciesFicheDrawer from './SpeciesFicheDrawer';
import { useSpeciesThumbs } from '@/hooks/useSpeciesThumb';
import { flatten, type ProjectedSpecies } from '@/lib/paletteProjections';

interface Props {
  profile: SiteProfile;
  /** Espèces écartées à l'étape précédente. */
  exclude?: string[];
  loading?: boolean;
  error?: string | null;
}

/**
 * Section 2 de l'étape « Palette végétale » : quatre strates, trois lectures.
 */
const PaletteRecommandee: React.FC<Props> = ({ profile, exclude, loading, error }) => {
  const [projection, setProjection] = React.useState<ProjectionId>('sol');
  const [horizon, setHorizon] = React.useState(0.5);

  const strates = React.useMemo(
    () => projectPalette(profile, projection, { exclude, horizon }),
    [profile, projection, exclude, horizon],
  );

  const [fiche, setFiche] = React.useState<ProjectedSpecies | null>(null);

  // Un seul appel batch pour toutes les vignettes visibles (cache serveur).
  const latins = React.useMemo(() => flatten(strates).map((s) => s.species.latin), [strates]);
  useSpeciesThumbs(latins);

  const active = PROJECTIONS.find((p) => p.id === projection)!;

  if (error) {
    return (
      <div className="rounded-3xl border border-[hsl(var(--ds-gold))]/60 bg-[hsl(var(--ds-gold))]/10 p-5 text-sm text-[hsl(var(--ds-forest-deep))]">
        La palette n’a pas pu être composée : {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2 rounded-3xl border border-[hsl(var(--ds-line))] p-3.5">
            <Skeleton className="h-3 w-24" />
            {[0, 1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-14 w-full rounded-2xl" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (profile.confidence === 0 || strates.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/40 p-8 text-center">
        <p className="text-sm font-semibold text-[hsl(var(--ds-forest-deep))]">
          Pas encore assez d’Observations pour composer la palette.
        </p>
        <p className="mt-1 text-[12px] text-[hsl(var(--ds-forest-deep))]/65">
          Complétez « J’analyse » et « J’identifie » : le sol mesuré et le cortège observé nourrissent
          les trois projections.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sélecteur de projection */}
      <div className="flex flex-wrap gap-2">
        {PROJECTIONS.map((p) => {
          const on = p.id === projection;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setProjection(p.id)}
              aria-pressed={on}
              className={cn(
                'relative rounded-full px-4 py-2 text-[12px] font-semibold transition',
                on
                  ? 'text-[hsl(var(--ds-cream))]'
                  : 'border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/60',
              )}
            >
              {on && (
                <motion.span
                  layoutId="palette-projection-pill"
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-[hsl(var(--ds-forest))]"
                />
              )}
              <span className="relative">{p.label}</span>
            </button>
          );
        })}
      </div>

      <p className="px-1 text-[13px] italic text-[hsl(var(--ds-forest-deep))]/70">{active.tagline}</p>

      <AnimatePresence mode="wait">
        <motion.div
          key={projection}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {projection === 'sol' && (
            <ProjectionSol strates={strates} profile={profile} onOpen={setFiche} />
          )}
          {projection === 'garde_manger' && (
            <ProjectionGardeManger strates={strates} onOpen={setFiche} />
          )}
          {projection === 'climat' && (
            <ProjectionClimat
              strates={strates}
              horizon={horizon}
              onHorizonChange={setHorizon}
              onOpen={setFiche}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <PaletteSources />

      <SpeciesFicheDrawer
        sp={fiche}
        profile={profile}
        projection={projection}
        horizon={horizon}
        onClose={() => setFiche(null)}
      />
    </div>
  );
};

export default PaletteRecommandee;
