import React from 'react';
import { ExternalLink, Loader2, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KINGDOM_LABELS_FR, type KingdomKey } from '@/lib/kingdomLabels';
import { ECO_FUNCTIONS } from '@/lib/ecologicalFunctions';
import { SpeciesThumb } from '@/components/species/SpeciesThumb';
import { SpeciesName } from '@/components/species/SpeciesName';
import type { PropertyBiodiversityKpis } from '@/hooks/propriete/usePropertyBiodiversityKpis';
import {
  useProprieteModuleDetail, useProprieteEvenements, type ModuleKey,
} from '@/hooks/propriete/useProprieteModuleDetail';

export type DialogKey = ModuleKey | 'vivant' | 'allies';

/** Onglet de l'espace jardinier correspondant à chaque module. */
const TAB_OF: Record<ModuleKey, string> = {
  observations: 'observe',
  sol: 'analyze',
  flore: 'identify',
  palette: 'palette',
  atelier: 'palette',
  tours: 'tour',
  clinique: 'clinique',
  capteurs: 'capteurs',
};

const INTRO: Record<DialogKey, { titre: string; sous: string; vide: string }> = {
  vivant: {
    titre: 'Le vivant recensé',
    sous: 'Espèces distinctes observées lors des marches rattachées à ce jardin.',
    vide: 'Aucune marche rattachée : rattachez un événement pour faire apparaître le vivant recensé.',
  },
  allies: {
    titre: 'Les alliés du jardin',
    sous: 'Espèces qui rendent un service écologique au jardin.',
    vide: 'Aucune espèce porteuse de fonction écologique pour l’instant.',
  },
  observations: {
    titre: 'Observations',
    sous: 'Ce que le jardinier a noté sur le terrain, question par question.',
    vide: 'Le carnet d’observation n’a pas encore été rempli.',
  },
  sol: {
    titre: 'Analyse du sol',
    sous: 'Prélèvements enregistrés dans le registre de sol.',
    vide: 'Aucun prélèvement enregistré dans le registre de sol.',
  },
  flore: {
    titre: 'Identification',
    sous: 'Plantes bio-indicatrices relevées et lecture de concordance.',
    vide: 'Aucune plante bio-indicatrice relevée pour l’instant.',
  },
  palette: {
    titre: 'Palette végétale',
    sous: 'Zones composées et espèces écartées.',
    vide: 'La palette végétale n’a pas encore été commencée.',
  },
  atelier: {
    titre: 'Atelier du jardin',
    sous: 'Objets et ouvrages dessinés sur le plan.',
    vide: 'Aucun ouvrage n’a encore été dessiné.',
  },
  tours: {
    titre: 'Tour de jardin',
    sous: 'Tours réalisés et carnets de terrain édités.',
    vide: 'Aucun tour de jardin n’a encore été réalisé.',
  },
  clinique: {
    titre: 'Clinique du jardin',
    sous: 'Consultations ouvertes sur les végétaux du jardin.',
    vide: 'Aucune consultation n’a encore été ouverte.',
  },
  capteurs: {
    titre: 'Capteurs et sondes',
    sous: 'Sondes installées et dernières remontées connues.',
    vide: 'Aucune sonde n’est rattachée à ce jardin.',
  },
};

const Ligne: React.FC<{ titre: string; contexte?: string | null; meta?: string | null }> = ({
  titre, contexte, meta,
}) => (
  <li className="flex items-start justify-between gap-3 border-b border-border/60 py-2.5 last:border-0">
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-foreground">{titre}</p>
      {contexte && <p className="mt-0.5 text-xs text-muted-foreground">{contexte}</p>}
    </div>
    {meta && (
      <span className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground/80">{meta}</span>
    )}
  </li>
);

const Vide: React.FC<{ texte: string }> = ({ texte }) => (
  <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm italic text-muted-foreground">
    {texte}
  </p>
);

/** Sous-vue : les espèces d'un règne ou d'une fonction écologique. */
type Focus = { kind: 'kingdom'; value: KingdomKey } | { kind: 'function'; value: string };

const SpeciesGrid: React.FC<{
  especes: PropertyBiodiversityKpis['species'];
}> = ({ especes }) => {
  if (especes.length === 0) return <Vide texte="Aucune espèce dans cette vue pour l’instant." />;
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {especes.map((s, i) => (
        <li
          key={`${s.scientificName}-${i}`}
          style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
          className="animate-fade-in flex items-center gap-3 rounded-xl border border-border bg-gradient-to-br from-card to-muted/25 p-2.5"
        >
          <SpeciesThumb scientificName={s.scientificName} kingdom={s.kingdom} size="md" />
          <div className="min-w-0 flex-1">
            <SpeciesName
              scientificName={s.scientificName}
              showScientific
              truncate
              size="sm"
            />
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {s.functions.slice(0, 4).map((f) => {
                const meta = ECO_FUNCTIONS.find((x) => x.value === f);
                return meta ? (
                  <span
                    key={f}
                    title={meta.service}
                    className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
                  >
                    {meta.emoji} {meta.shortLabel}
                  </span>
                ) : null;
              })}
            </div>
          </div>
          {s.count > 0 && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
              {s.count}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
};

interface Props {
  proprieteId: string;
  slug?: string | null;
  openKey: DialogKey | null;
  onClose: () => void;
  bio: PropertyBiodiversityKpis;
}

/**
 * Fenêtre de détail d'une carte du tableau de bord. Se ferme sur la synthèse
 * (aucune navigation), et propose des accès vers les données associées.
 */
const ProprieteModuleDialog: React.FC<Props> = ({ proprieteId, slug, openKey, onClose, bio }) => {
  const isBio = openKey === 'vivant' || openKey === 'allies';
  const moduleKey = !openKey || isBio ? null : (openKey as ModuleKey);

  const detail = useProprieteModuleDetail(proprieteId, moduleKey);
  const events = useProprieteEvenements(proprieteId, openKey === 'vivant');

  // Sous-vue « espèces » ouverte depuis un règne ou une fonction écologique.
  const [focus, setFocus] = React.useState<Focus | null>(null);
  React.useEffect(() => { setFocus(null); }, [openKey]);

  if (!openKey) return null;
  const intro = INTRO[openKey];

  const focusEspeces = !focus
    ? []
    : focus.kind === 'kingdom'
      ? bio.species.filter((s) => s.kingdom === focus.value)
      : bio.species.filter((s) => s.functions.includes(focus.value as never));

  const focusTitre = !focus
    ? null
    : focus.kind === 'kingdom'
      ? KINGDOM_LABELS_FR[focus.value]
      : (() => {
          const m = ECO_FUNCTIONS.find((x) => x.value === focus.value);
          return m ? `${m.emoji} ${m.shortLabel}` : 'Fonction écologique';
        })();

  const lienJardinier = slug
    ? `/propriete/${slug}${moduleKey ? `?tab=${TAB_OF[moduleKey]}` : ''}`
    : null;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[88vh] max-w-2xl gap-4 overflow-hidden p-0">
        <DialogHeader className="space-y-1 border-b border-border px-5 pb-4 pt-5 text-left">
          {focus && (
            <button
              type="button"
              onClick={() => setFocus(null)}
              className="mb-1 inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Revenir à la synthèse
            </button>
          )}
          <DialogTitle className="text-lg">{focusTitre ?? intro.titre}</DialogTitle>
          <DialogDescription>
            {focus
              ? `${focusEspeces.length} espèce${focusEspeces.length > 1 ? 's' : ''} — ${intro.titre.toLowerCase()}`
              : intro.sous}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[58vh] px-5">
          <div className="pb-4">
            {isBio && focus ? (
              <SpeciesGrid especes={focusEspeces} />
            ) : isBio ? (
              !bio.hasEvents ? (
                <Vide texte={INTRO.vivant.vide} />
              ) : bio.isLoading ? (
                <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Lecture du vivant…
                </p>
              ) : openKey === 'vivant' ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(Object.keys(bio.byKingdom) as KingdomKey[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        disabled={bio.byKingdom[k] === 0}
                        onClick={() => setFocus({ kind: 'kingdom', value: k })}
                        className={cn(
                          'rounded-xl border border-border bg-muted/20 p-3 text-left transition-colors',
                          bio.byKingdom[k] === 0
                            ? 'opacity-50'
                            : 'hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        )}
                      >
                        <p className="text-2xl font-semibold tabular-nums text-foreground">{bio.byKingdom[k]}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          {KINGDOM_LABELS_FR[k]}
                          {bio.byKingdom[k] > 0 && <ChevronRight className="h-3 w-3" />}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Marches rattachées
                    </p>
                    {events.isLoading ? (
                      <p className="text-sm text-muted-foreground">Lecture des marches…</p>
                    ) : (events.data?.length ?? 0) === 0 ? (
                      <Vide texte="Aucune marche rattachée." />
                    ) : (
                      <ul>
                        {events.data!.map((e) => (
                          <Ligne
                            key={e.id}
                            titre={e.title || 'Marche sans titre'}
                            contexte={e.lieu}
                            meta={e.date_marche ? new Date(e.date_marche).toLocaleDateString('fr-FR') : null}
                          />
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Espèces les plus observées
                    </p>
                    {bio.species.length === 0 ? (
                      <Vide texte="Collecte en attente sur ces marches." />
                    ) : (
                      <ul>
                        {bio.species.slice(0, 15).map((s, i) => (
                          <Ligne
                            key={`${s.scientificName}-${i}`}
                            titre={s.scientificName || 'Espèce sans nom scientifique'}
                            contexte={KINGDOM_LABELS_FR[s.kingdom]}
                            meta={s.count ? `${s.count} observation${s.count > 1 ? 's' : ''}` : null}
                          />
                        ))}
                      </ul>
                    )}
                    {bio.species.length > 15 && (
                      <p className="pt-2 text-xs text-muted-foreground">
                        et {bio.species.length - 15} autre{bio.species.length - 15 > 1 ? 's' : ''} espèce
                        {bio.species.length - 15 > 1 ? 's' : ''}…
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <p className="text-2xl font-semibold tabular-nums text-foreground">{bio.alliesCount}</p>
                      <p className="text-xs text-muted-foreground">alliés</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <p className="text-2xl font-semibold tabular-nums text-foreground">{bio.alliesShare} %</p>
                      <p className="text-xs text-muted-foreground">du vivant recensé</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <p className="text-2xl font-semibold tabular-nums text-foreground">{bio.fertilityScore}</p>
                      <p className="text-xs text-muted-foreground">indice de fertilité</p>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    L’indice de fertilité pondère chaque fonction écologique selon sa contribution au sol
                    et au cycle du vivant : plus les fonctions présentes sont nombreuses et complémentaires,
                    plus l’indice monte.
                  </p>

                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Toutes les fonctions écologiques
                    </p>
                    {ECO_FUNCTIONS.filter((f) => bio.functionCounts[f.value] > 0).length === 0 ? (
                      <Vide texte={intro.vide} />
                    ) : (
                      <ul>
                        {ECO_FUNCTIONS
                          .map((f) => ({ f, n: bio.functionCounts[f.value] }))
                          .filter((x) => x.n > 0)
                          .sort((a, b) => b.n - a.n)
                          .map(({ f, n }) => (
                            <Ligne
                              key={f.value}
                              titre={`${f.emoji} ${f.shortLabel}`}
                              contexte={f.service}
                              meta={`${n} espèce${n > 1 ? 's' : ''}`}
                            />
                          ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Origine des étiquettes
                    </p>
                    <ul>
                      <Ligne titre="Validées par un curateur" meta={String(bio.sources.curated)} />
                      <Ligne titre="Issues de la base partagée" meta={String(bio.sources.kb)} />
                      <Ligne titre="Reconnues automatiquement" meta={String(bio.sources.auto)} />
                    </ul>
                  </div>
                </div>
              )
            ) : detail.isLoading ? (
              <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Lecture des données…
              </p>
            ) : detail.error ? (
              <p className="py-6 text-sm text-destructive">
                Détail indisponible : {(detail.error as Error).message}
              </p>
            ) : (
              <div className="space-y-3">
                {detail.data?.resume && (
                  <p className="rounded-xl bg-muted/40 p-3 text-sm text-foreground/80">{detail.data.resume}</p>
                )}
                {(detail.data?.rows.length ?? 0) === 0 ? (
                  <Vide texte={intro.vide} />
                ) : (
                  <ul>
                    {detail.data!.rows.map((r) => (
                      <Ligne key={r.id} titre={r.titre} contexte={r.contexte} meta={r.meta} />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 pb-5 pt-4">
          {openKey === 'vivant' && (
            <a
              href="#sec-evenements"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowRight className="h-3.5 w-3.5" /> Voir les événements rattachés
            </a>
          )}
          {lienJardinier && (
            <Link
              to={lienJardinier}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Ouvrir dans l’espace jardinier
            </Link>
          )}
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'ml-auto rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground',
              'transition-opacity hover:opacity-90',
            )}
          >
            Revenir à la synthèse
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProprieteModuleDialog;
