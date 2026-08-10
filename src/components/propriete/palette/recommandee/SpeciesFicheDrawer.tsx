import React from 'react';
import { speciesLatinBase } from '@/lib/speciesLatinBase';
import { motion } from 'framer-motion';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SpeciesThumb } from '@/components/species/SpeciesThumb';
import { useSpeciesThumb } from '@/hooks/useSpeciesThumb';
import { DISPLAY_STRATE_LABEL, foodTraits, climateTraits, MONTH_FULL, type ProjectedSpecies, type ProjectionId } from '@/lib/paletteProjections';
import type { SiteProfile } from '@/lib/paletteEngine';
import { gbifUrl, inaturalistUrl, telaBotanicaUrl } from '@/lib/paletteSources';
import { cn } from '@/lib/utils';

interface Props {
  sp: ProjectedSpecies | null;
  profile: SiteProfile;
  projection: ProjectionId;
  horizon: number;
  onClose: () => void;
}

/** Pastille de verdict : couleur + icône, même grammaire que « J'identifie ». */
const EcoVerdictChip: React.FC<{ match: AxisMatch; label: string }> = ({ match, label }) => {
  const token = VERDICT_TOKEN[match];
  if (match === 'na') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-[hsl(var(--ds-verdict-na))]/60 px-2 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--ds-verdict-na))]">
        {iconFor(match, 'w-3 h-3')} {label}
      </span>
    );
  }
  const solid = match === 'oui';
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.12em]"
      style={
        solid
          ? { background: `hsl(var(${token}))`, color: 'hsl(var(--ds-cream))' }
          : {
              background: `hsl(var(${token}) / 0.14)`,
              color: `hsl(var(${token}))`,
              boxShadow: `inset 0 0 0 1px hsl(var(${token}) / 0.45)`,
            }
      }
    >
      {iconFor(match, 'w-3 h-3')} {label}
    </span>
  );
};


/** Fiche espèce : identité, écologie confrontée au site, services, sources. */
const SpeciesFicheDrawer: React.FC<Props> = ({ sp, profile, projection, horizon, onClose }) => {
  const latin = sp?.species.latin ?? '';
  const thumbLatin = speciesLatinBase(latin);
  const { data: thumb } = useSpeciesThumb(sp ? thumbLatin : undefined);

  const food = sp ? foodTraits(sp.species) : null;
  const climate = sp ? climateTraits(sp.species, horizon) : null;

  return (
    <Sheet open={!!sp} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] sm:max-w-[440px]"
      >
        {sp && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="text-[hsl(var(--ds-forest-deep))]">
                {sp.species.fr}
              </SheetTitle>
              <p className="text-[12px] italic text-[hsl(var(--ds-forest-deep))]/60">
                {sp.species.latin}
              </p>
            </SheetHeader>

            {/* Photo */}
            <div className="mt-4 overflow-hidden rounded-2xl border border-[hsl(var(--ds-line))]">
              <div className="aspect-[16/10] w-full">
                <SpeciesThumb
                  scientificName={latin}
                  commonName={sp.species.fr}
                  kingdom="Plantae"
                  size="lg"
                  className="!h-full !w-full !rounded-none [&_img]:!h-full [&_img]:!w-full [&_img]:!rounded-none [&>div]:!h-full [&>div]:!w-full [&>div]:!rounded-none"
                />
              </div>
              <p className="bg-[hsl(var(--ds-forest))]/8 px-3 py-1.5 text-[10px] text-[hsl(var(--ds-forest-deep))]/60">
                {thumb?.photo_attribution
                  ? `Photo : ${thumb.photo_attribution}`
                  : 'Photo de référence — iNaturalist / GBIF'}
              </p>
            </div>

            {/* Identité */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {[
                DISPLAY_STRATE_LABEL[sp.display],
                sp.species.origin === 'indigene' ? 'Indigène' : 'Horticole',
                ...(sp.species.vegetalLocal ? ['Filière Végétal local'] : []),
              ].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-[hsl(var(--ds-line))] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--ds-forest-deep))]/75"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Écologie confrontée au site */}
            <section className="mt-5">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--ds-forest))]/80">
                Écologie face à votre sol
              </h4>
              <div className="mt-2 space-y-2.5">
                {AXES.map(({ key, label, low, high }) => {
                  const plant = toCran(sp.species.optima[key]);
                  const site = toCran(profile[key]);
                  const d = Math.abs(plant - site);
                  return (
                    <div key={key}>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ds-forest-deep))]/70">
                          {label}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-bold uppercase tracking-[0.12em]',
                            d <= 1
                              ? 'text-[hsl(var(--ds-forest))]'
                              : d === 2
                                ? 'text-[hsl(var(--ds-gold))]'
                                : 'text-[hsl(var(--ds-forest-deep))]/50',
                          )}
                        >
                          {profile.known[key] ? gapWord(d) : 'Sol non documenté'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((c) => (
                          <div
                            key={c}
                            className={cn(
                              'relative h-2.5 flex-1 rounded-full',
                              c === plant
                                ? 'bg-[hsl(var(--ds-forest))]'
                                : 'bg-[hsl(var(--ds-forest))]/12',
                            )}
                          >
                            {c === site && (
                              <motion.span
                                layout
                                className="absolute -top-1 left-1/2 h-4.5 w-[2px] -translate-x-1/2 rounded-full bg-[hsl(var(--ds-gold))]"
                                style={{ height: '18px' }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-0.5 flex justify-between text-[9px] uppercase tracking-[0.12em] text-[hsl(var(--ds-forest-deep))]/40">
                        <span>{low}</span>
                        <span>{high}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] text-[hsl(var(--ds-forest-deep))]/55">
                Barre pleine : optimum de l’espèce. Trait doré : lecture de votre sol.
              </p>
            </section>

            {/* Lecture de la projection courante */}
            {projection === 'garde_manger' && food && (
              <section className="mt-5 rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-forest))]/6 p-3">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--ds-forest))]/80">
                  Au garde-manger
                </h4>
                <p className="mt-1 text-sm font-semibold text-[hsl(var(--ds-forest-deep))]">
                  {food.yieldLabel || 'Pas de production documentée'}
                </p>
                {food.months.length > 0 && (
                  <p className="mt-1 text-[12px] text-[hsl(var(--ds-forest-deep))]/70">
                    {food.months.map((m) => MONTH_FULL[m - 1]).join(' · ')}
                  </p>
                )}
              </section>
            )}

            {projection === 'climat' && climate && (
              <section className="mt-5 rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-forest))]/6 p-3">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--ds-forest))]/80">
                  Tenue à l’horizon {Math.round(2026 + horizon * 24)}
                </h4>
                <p className="mt-1 text-sm font-semibold text-[hsl(var(--ds-forest-deep))]">
                  {climate.hold}% — {climate.note}
                </p>
              </section>
            )}

            {/* Raison et services */}
            <section className="mt-5 space-y-2">
              <p className="text-[13px] leading-relaxed text-[hsl(var(--ds-forest-deep))]/80">
                {sp.species.reason}
              </p>
              <p className="text-[13px] leading-relaxed text-[hsl(var(--ds-forest-deep))]/80">
                {sp.species.service}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {sp.species.services.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-[hsl(var(--ds-forest))]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--ds-forest-deep))]/70"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>

            {sp.species.caution && (
              <p className="mt-4 flex gap-2 rounded-2xl border border-[hsl(var(--ds-gold))]/60 bg-[hsl(var(--ds-gold))]/12 p-3 text-[12px] text-[hsl(var(--ds-forest-deep))]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--ds-gold))]" />
                {sp.species.caution}
              </p>
            )}

            {/* Liens sortants */}
            <section className="mb-8 mt-5">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--ds-forest))]/80">
                Consulter les sources
              </h4>
              <div className="mt-2 grid gap-1.5">
                {[
                  { label: 'iNaturalist', href: inaturalistUrl(latin) },
                  { label: 'Tela Botanica', href: telaBotanicaUrl(latin) },
                  { label: 'GBIF', href: gbifUrl(latin) },
                ].map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-[hsl(var(--ds-line))] px-3 py-2 text-[12px] font-semibold text-[hsl(var(--ds-forest-deep))] transition hover:border-[hsl(var(--ds-forest))]/60 hover:bg-[hsl(var(--ds-forest))]/6"
                  >
                    {l.label}
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </a>
                ))}
              </div>
            </section>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default SpeciesFicheDrawer;
