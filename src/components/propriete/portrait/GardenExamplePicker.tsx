/**
 * Galerie « Le jardin qui vous ressemble » — choix / changement d'un
 * jardin-exemple depuis le Portrait. Mobile d'abord : filtres en puces
 * défilantes, grille 1 colonne, actions collées en bas.
 */
import React, { useMemo, useState } from 'react';
import { Check, ImageOff, Loader2, Maximize2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useOnboardingGallery, type GardenExample } from '@/hooks/onboarding/useOnboardingConfig';
import { useSaveGardenExample } from '@/hooks/propriete/usePropertyIntention';
import GardenExampleViewer from '@/components/onboarding/GardenExampleViewer';

interface Props {
  proprieteId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Exemple actuellement retenu, pour pré-sélection. */
  currentId?: string | null;
  /** Famille de jardin à pré-filtrer (ex. « nourricier » après la question du rêve). */
  initialTypeSlug?: string | null;
}

export const GardenExamplePicker: React.FC<Props> = ({
  proprieteId, open, onOpenChange, currentId, initialTypeSlug,
}) => {
  const { types, examples, loading } = useOnboardingGallery();
  const save = useSaveGardenExample(proprieteId);
  const [typeId, setTypeId] = useState<string | 'all'>('all');
  const [selected, setSelected] = useState<string | null>(currentId ?? null);
  const [viewing, setViewing] = useState<number | null>(null);

  React.useEffect(() => {
    if (open) setSelected(currentId ?? null);
  }, [open, currentId]);

  const visibleTypes = useMemo(
    () => [...types].filter((t) => t.visible !== false).sort((a, b) => a.position - b.position),
    [types],
  );

  // Ouverture depuis la question « Quel jardin vous fait rêver ? » : on montre
  // d'emblée la famille rêvée, sans obliger à retrouver le filtre.
  React.useEffect(() => {
    if (!open) return;
    const wanted = initialTypeSlug ? visibleTypes.find((t) => t.slug === initialTypeSlug) : null;
    setTypeId(wanted ? wanted.id : 'all');
  }, [open, initialTypeSlug, visibleTypes]);

  const items = useMemo(
    () =>
      examples
        .filter((e) => e.publie !== false)
        .filter((e) => typeId === 'all' || e.type_id === typeId)
        .sort((a, b) => a.position - b.position),
    [examples, typeId],
  );

  const current = items.find((e) => e.id === selected) ?? examples.find((e) => e.id === selected) ?? null;
  const currentTypeLabel = typeId === 'all'
    ? undefined
    : visibleTypes.find((t) => t.id === typeId)?.titre;

  const commit = async (example: GardenExample | null) => {
    try {
      const slug = example ? visibleTypes.find((t) => t.id === example.type_id)?.slug ?? null : null;
      await save.mutateAsync({
        example: example
          ? {
              id: example.id,
              stableId: example.stable_id ?? null,
              titre: example.titre ?? null,
              sousTitre: example.sous_titre ?? null,
              intention: example.user_intent ?? example.description ?? null,
              keywords: example.keywords ?? [],
              vignette: example.thumbnail_url ?? example.image_url ?? null,
              aiProfile: example.ai_profile ?? null,
              typeId: example.type_id ?? null,
              typeSlug: slug,
            }
          : null,
        // Choisir l'image renseigne « Quel jardin vous fait rêver ? ».
        // Un refus n'efface jamais une réponse déjà donnée.
        answers: slug ? { style: slug } : undefined,
      });
      toast.success(example ? 'Jardin-exemple mis à jour' : 'Choix enregistré : aucun ne vous ressemble');
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible d'enregistrer ce choix");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 p-0 sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-border/70 p-4 sm:p-5">
          <div>
            <h2 className="font-serif italic text-lg text-foreground">Le jardin qui vous ressemble</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Ce repère nourrit la palette végétale et les conseils de l'IA de jardin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filtres par type */}
        <div className="-mx-0 flex gap-2 overflow-x-auto border-b border-border/70 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => setTypeId('all')}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors',
              typeId === 'all'
                ? 'border-amber-500/60 bg-amber-500/10 text-foreground'
                : 'border-border/70 text-muted-foreground hover:text-foreground',
            )}
          >
            Tous
          </button>
          {visibleTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypeId(t.id)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors',
                typeId === t.id
                  ? 'border-amber-500/60 bg-amber-500/10 text-foreground'
                  : 'border-border/70 text-muted-foreground hover:text-foreground',
              )}
            >
              {t.titre}
            </button>
          ))}
        </div>

        {/* Grille */}
        <div className="max-h-[55vh] overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucun jardin-exemple publié pour ce type.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((e, idx) => {
                const on = e.id === selected;
                const img = e.thumbnail_url ?? e.image_url;
                return (
                  <div key={e.id} className="relative">
                    <button
                      type="button"
                      onClick={() => setSelected(e.id)}
                      aria-pressed={on}
                      className={cn(
                        'group block w-full overflow-hidden rounded-2xl border text-left transition-all',
                        on
                          ? 'border-amber-500 ring-2 ring-amber-500/40'
                          : 'border-border/70 hover:border-amber-500/50',
                      )}
                    >
                      <div className="relative h-32 w-full bg-muted/40">
                        {img ? (
                          <img
                            src={img}
                            alt={e.image_alt ?? e.titre}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <ImageOff className="h-5 w-5" />
                          </div>
                        )}
                        {on && (
                          <span className="absolute right-2 top-2 rounded-full bg-amber-500 p-1 text-white shadow">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5 p-3">
                        <p className="text-sm font-medium text-foreground">{e.titre}</p>
                        {e.sous_titre && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{e.sous_titre}</p>
                        )}
                        {(e.keywords?.length ?? 0) > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {e.keywords!.slice(0, 3).map((k) => (
                              <Badge key={k} variant="secondary" className="text-[10px] font-normal">
                                {k}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Regarder avant de choisir : la loupe n'engage aucune sélection. */}
                    {img && (
                      <button
                        type="button"
                        onClick={(ev) => { ev.stopPropagation(); setViewing(idx); }}
                        aria-label={`Voir « ${e.titre} » en grand`}
                        className="absolute left-2 top-2 rounded-full bg-black/55 p-1.5 text-white backdrop-blur transition-colors hover:bg-black/75"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {current?.user_intent && (
            <p className="mt-4 rounded-2xl border-l-2 border-amber-500/50 bg-card/60 px-4 py-3 text-sm text-foreground/80">
              {current.user_intent}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <Button
            variant="ghost"
            className="justify-start text-muted-foreground sm:order-1"
            disabled={save.isPending}
            onClick={() => commit(null)}
          >
            Aucun ne me ressemble
          </Button>
          <div className="flex gap-2 sm:order-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              className="flex-1"
              disabled={!current || save.isPending}
              onClick={() => current && commit(current)}
            >
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Valider ce jardin
            </Button>
          </div>
        </div>
      </DialogContent>

      <GardenExampleViewer
        examples={items}
        index={viewing}
        onNavigate={setViewing}
        onClose={() => setViewing(null)}
        typeLabel={currentTypeLabel}
      />
    </Dialog>
  );
};

export default GardenExamplePicker;
