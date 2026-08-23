/**
 * Galerie de sélection d'un modèle de jardin.
 *
 * Ligne de types (pastilles à image) puis grille d'exemples (vignettes 360×240).
 * Le tap sur une vignette sélectionne ; l'icône « agrandir » ouvre la
 * visionneuse plein écran. Mobile first, aucune dépendance au registre
 * embarqué dans le code — tout vient de la galerie éditoriale.
 */
import { useMemo, useState } from 'react';
import { Expand, Leaf, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboardingGallery, type GardenExample } from '@/hooks/onboarding/useOnboardingConfig';
import GardenExampleViewer from '@/components/onboarding/GardenExampleViewer';

export interface GardenStyleSelection {
  typeStableId: string;
  typeSlug: string;
  exampleStableId: string;
  exampleTitle: string;
  thumbnail: string | null;
}

interface Props {
  /** Type présélectionné (stable_id, ex. « jardin_nourricier »). */
  defaultTypeStableId?: string;
  selected?: GardenStyleSelection | null;
  onSelect: (selection: GardenStyleSelection | null) => void;
}

export default function GardenExampleGallery({ defaultTypeStableId, selected, onSelect }: Props) {
  const { types, examples, loading } = useOnboardingGallery();
  const visibleTypes = useMemo(() => types.filter((t) => t.visible), [types]);

  const [activeTypeId, setActiveTypeId] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const activeType = useMemo(() => {
    if (activeTypeId) return visibleTypes.find((t) => t.id === activeTypeId) ?? null;
    if (defaultTypeStableId) {
      const byStable = visibleTypes.find((t) => t.stable_id === defaultTypeStableId);
      if (byStable) return byStable;
      const bySlug = visibleTypes.find(
        (t) => t.slug === defaultTypeStableId || `jardin_${t.slug}` === defaultTypeStableId,
      );
      if (bySlug) return bySlug;
    }
    return visibleTypes[0] ?? null;
  }, [activeTypeId, defaultTypeStableId, visibleTypes]);

  const typeExamples = useMemo(
    () =>
      activeType
        ? examples.filter((e) => e.type_id === activeType.id && e.publie)
        : [],
    [activeType, examples],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-emerald-100/60">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Chargement des modèles…</span>
      </div>
    );
  }
  if (visibleTypes.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Ligne des types */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {visibleTypes.map((t) => {
          const active = activeType?.id === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTypeId(t.id)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-xs transition-colors',
                active
                  ? 'border-emerald-300 bg-emerald-400/20 text-emerald-50'
                  : 'border-white/15 bg-white/5 text-emerald-100/70 hover:bg-white/10',
              )}
            >
              {t.image_url ? (
                <img src={t.image_url} alt="" className="h-7 w-7 rounded-full object-cover" loading="lazy" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20">
                  <Leaf className="h-3.5 w-3.5 text-emerald-300" />
                </span>
              )}
              <span className="max-w-[9rem] truncate">{t.titre}</span>
            </button>
          );
        })}
      </div>

      {/* Grille d'exemples */}
      {typeExamples.length === 0 ? (
        <p className="py-4 text-center text-xs text-emerald-100/50">
          Aucun modèle publié pour ce type pour l'instant.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {typeExamples.map((ex, i) => {
            const isSelected = selected?.exampleStableId === ex.stable_id;
            return (
              <div
                key={ex.id}
                className={cn(
                  'group relative overflow-hidden rounded-xl border text-left transition-all',
                  isSelected
                    ? 'border-emerald-300 ring-2 ring-emerald-300/60'
                    : 'border-white/10 hover:border-emerald-300/50',
                )}
              >
                <button
                  type="button"
                  onClick={() =>
                    onSelect(
                      isSelected
                        ? null
                        : {
                            typeStableId: activeType?.stable_id ?? activeType?.slug ?? '',
                            typeSlug: activeType?.slug ?? '',
                            exampleStableId: ex.stable_id ?? ex.id,
                            exampleTitle: ex.titre,
                            thumbnail: ex.thumbnail_url ?? ex.image_url,
                          },
                    )
                  }
                  className="block w-full"
                  aria-pressed={isSelected}
                >
                  <div className="aspect-[3/2] w-full overflow-hidden bg-black/30">
                    {(ex.thumbnail_url ?? ex.image_url) && (
                      <img
                        src={ex.thumbnail_url ?? ex.image_url ?? ''}
                        alt={ex.image_alt ?? ex.titre}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="space-y-0.5 p-2">
                    <p className="truncate text-xs font-semibold text-white">{ex.titre}</p>
                    {ex.sous_titre && (
                      <p className="line-clamp-2 text-[10px] leading-snug text-emerald-100/60">
                        {ex.sous_titre}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <span className="absolute left-2 top-2 rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-bold text-emerald-950">
                      Choisi
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setViewerIndex(i)}
                  aria-label={`Agrandir « ${ex.titre} »`}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white opacity-90 backdrop-blur transition-opacity hover:bg-black/75 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Expand className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <GardenExampleViewer
        examples={typeExamples}
        index={viewerIndex}
        onNavigate={setViewerIndex}
        onClose={() => setViewerIndex(null)}
        typeLabel={activeType?.titre}
      />
    </div>
  );
}
