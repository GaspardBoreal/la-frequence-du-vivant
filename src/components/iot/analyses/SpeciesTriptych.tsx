import React from 'react';
import { Apple, Carrot, Flower2, Info } from 'lucide-react';
import { useInatThumbs } from '@/hooks/propriete/useInatThumbs';
import { usePaletteAlreadyOnSite } from '@/hooks/propriete/usePaletteAlreadyOnSite';
import { speciesLatinBase } from '@/lib/speciesLatinBase';
import type { PaletteFit } from '@/hooks/iot/useIotAnalyses';
import SpeciesTile from './SpeciesTile';

const COLUMNS = [
  {
    key: 'nourricier' as const,
    title: 'Arbres & arbustes nourriciers',
    hint: 'La charpente comestible du lieu, plantée une fois pour des décennies.',
    icon: Apple,
  },
  {
    key: 'potager' as const,
    title: 'Légumes nourriciers',
    hint: 'Ce que la saison mesurée permet de semer ou de repiquer maintenant.',
    icon: Carrot,
  },
  {
    key: 'ornemental' as const,
    title: 'Végétaux ornementaux',
    hint: 'Fleurissement, structure et ressources pour les pollinisateurs.',
    icon: Flower2,
  },
];

/**
 * Trois familles d'usage, cinq espèces chacune : ce que le micro-climat mesuré
 * autour de cette sonde rend possible, illustré par iNaturalist et confronté à
 * ce qui pousse déjà sur la propriété.
 */
const SpeciesTriptych: React.FC<{ fit: PaletteFit; proprieteId?: string }> = ({ fit, proprieteId }) => {
  const all = React.useMemo(
    () => Object.values(fit.groups).flat(),
    [fit.groups],
  );
  const { map } = useInatThumbs(all.map((r) => speciesLatinBase(r.latin)));
  const { isOnSite } = usePaletteAlreadyOnSite(proprieteId);

  if (all.length === 0) return null;

  return (
    <section className="mt-4">
      <div className="mb-3 flex flex-wrap items-baseline gap-2">
        <h4 className="text-sm font-semibold">Quinze espèces qui aiment ce coin</h4>
        <span className="text-[11px] text-muted-foreground">
          {fit.fromClimate
            ? 'Lecture indirecte : profil déduit du climat mesuré, à confirmer par une sonde de sol.'
            : 'Profil déduit des mesures de la sonde et du registre de sol.'}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {COLUMNS.map((col) => {
          const rows = fit.groups[col.key] ?? [];
          const Icon = col.icon;
          return (
            <div key={col.key} className="rounded-2xl border border-border/50 bg-card/40 p-3">
              <header className="mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {col.title}
                </div>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{col.hint}</p>
              </header>
              <div className="space-y-2">
                {rows.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border/60 p-3 text-[11px] text-muted-foreground">
                    Aucune espèce de cette famille ne convient au profil mesuré.
                  </p>
                ) : (
                  rows.map((r) => (
                    <SpeciesTile
                      key={r.id}
                      row={r}
                      thumb={map.get(speciesLatinBase(r.latin))}
                      onSite={isOnSite(r.id, r.latin)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(fit.missing.length > 0 || fit.referenceTempC != null) && (
        <p className="mt-3 flex items-start gap-1.5 rounded-xl border border-dashed border-border/60 bg-background/40 p-2 text-[11px] text-muted-foreground">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          <span>
            {fit.referenceTempC != null &&
              `Fenêtres potagères calculées sur ${fit.referenceTempC.toFixed(0)} °C mesurés. `}
            {fit.missing.length > 0 && `Manque pour affiner : ${fit.missing.join(' · ')}.`}
          </span>
        </p>
      )}
    </section>
  );
};

export default SpeciesTriptych;
