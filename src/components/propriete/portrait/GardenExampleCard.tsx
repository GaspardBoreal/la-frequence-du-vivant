import React, { useState } from 'react';
import { ChevronDown, ExternalLink, ImageOff, Images, Maximize2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGardenExample } from '@/hooks/propriete/useGardenExample';
import type { StoredGardenExample } from '@/hooks/propriete/usePropertyIntention';
import type { GardenExample } from '@/hooks/onboarding/useOnboardingConfig';
import GardenExampleViewer from '@/components/onboarding/GardenExampleViewer';
import { GardenExamplePicker } from './GardenExamplePicker';

interface Props {
  /** Copie figée au moment du choix, telle que versée par le parcours d'accueil. */
  stored: StoredGardenExample | null;
  /** Identifiant du jardin, pour enregistrer un nouveau choix. */
  proprieteId?: string;
  /** L'utilisateur peut-il changer le jardin-exemple ? */
  canEdit?: boolean;
  /** Libellé de la famille de jardin associée (réponse « Quel jardin vous fait rêver ? »). */
  styleLabel?: string | null;
  /** Incrémenter cette valeur ouvre la galerie (ex. après avoir répondu au rêve). */
  openPickerSignal?: number;
  /** Famille à pré-filtrer à l'ouverture pilotée. */
  pickerTypeSlug?: string | null;
}


const prettyKey = (k: string) =>
  k.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

const renderValue = (v: unknown): string => {
  if (Array.isArray(v)) return v.map((x) => String(x)).join(' · ');
  if (v && typeof v === 'object') {
    return Object.entries(v as Record<string, unknown>)
      .map(([k, val]) => `${prettyKey(k)} ${val}`)
      .join(' · ');
  }
  return String(v);
};

/**
 * « Le jardin qui vous ressemble » — l'image retenue à l'écran de galerie du
 * parcours d'accueil, avec ses métadonnées relues à la source (la fiche
 * `onboarding_garden_examples` peut avoir évolué depuis le choix).
 */
export const GardenExampleCard: React.FC<Props> = ({
  stored, proprieteId, canEdit = false, styleLabel, openPickerSignal = 0, pickerTypeSlug,
}) => {
  const { data: live } = useGardenExample(stored?.id ?? null);
  const [openMeta, setOpenMeta] = useState(false);
  const [picking, setPicking] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [forcedSlug, setForcedSlug] = useState<string | null>(null);

  const editable = canEdit && !!proprieteId;

  // Ouverture pilotée depuis la question « Quel jardin vous fait rêver ? ».
  React.useEffect(() => {
    if (openPickerSignal > 0 && editable) {
      setForcedSlug(pickerTypeSlug ?? null);
      setPicking(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPickerSignal]);

  const picker = editable ? (
    <GardenExamplePicker
      proprieteId={proprieteId!}
      open={picking}
      onOpenChange={(v) => { setPicking(v); if (!v) setForcedSlug(null); }}
      currentId={stored?.id ?? null}
      initialTypeSlug={forcedSlug}
    />
  ) : null;

  if (!stored || stored.refused) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 p-5">
        <div className="flex items-start gap-3">
          <ImageOff className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {stored?.refused
                ? 'Aucun jardin-exemple ne vous ressemblait.'
                : 'Aucun jardin-exemple retenu pour ce jardin.'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              L'image choisie sert de repère à la palette végétale et à l'IA de jardin.
            </p>
            {editable && (
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setPicking(true)}>
                <Images className="mr-2 h-4 w-4" />
                Choisir un jardin-exemple
              </Button>
            )}
          </div>
        </div>
        {picker}
      </div>
    );
  }


  const titre = live?.titre ?? stored.titre ?? 'Jardin-exemple';
  const sousTitre = live?.sous_titre ?? stored.sousTitre;
  const intention = live?.user_intent ?? stored.intention;
  const image = live?.thumbnail_url ?? live?.image_url ?? stored.vignette;
  const keywords = (live?.keywords?.length ? live.keywords : stored.keywords) ?? [];
  const aiProfile = live?.ai_profile ?? stored.aiProfile;
  const changed = Boolean(live && stored.titre && live.titre && live.titre !== stored.titre);

  // Image en grand : on réutilise la visionneuse du parcours d'accueil.
  const viewerItem = {
    id: stored.id ?? 'stored',
    titre,
    sous_titre: sousTitre ?? null,
    user_intent: intention ?? null,
    image_url: live?.image_url ?? stored.vignette ?? null,
    image_alt: live?.image_alt ?? null,
  } as unknown as GardenExample;

  return (
    <section className="rounded-2xl border border-border/70 bg-card overflow-hidden">
      <div className="grid sm:grid-cols-[minmax(0,220px)_1fr]">
        {image ? (
          <button
            type="button"
            onClick={() => setZoom(true)}
            aria-label={`Voir « ${titre} » en grand`}
            className="group relative block h-44 w-full overflow-hidden sm:h-full"
          >
            <img
              src={image}
              alt={live?.image_alt ?? `Jardin-exemple retenu : ${titre}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute right-2 top-2 rounded-full bg-black/55 p-1.5 text-white backdrop-blur">
              <Maximize2 className="h-3.5 w-3.5" />
            </span>
          </button>
        ) : (
          <div className="flex h-44 items-center justify-center bg-muted/40 text-muted-foreground sm:h-full">
            <ImageOff className="h-6 w-6" />
          </div>
        )}

        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-amber-600">
              <Sparkles className="h-4 w-4" /> Le jardin qui vous ressemble
            </div>
            {editable && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setPicking(true)}>
                <Images className="mr-1.5 h-3.5 w-3.5" />
                Changer
              </Button>
            )}
          </div>

          {styleLabel && (
            <Badge variant="outline" className="border-amber-500/40 text-[11px] text-amber-700 dark:text-amber-300">
              {styleLabel}
            </Badge>
          )}



          <div>
            <h3 className="font-serif italic text-lg text-foreground">{titre}</h3>
            {sousTitre && <p className="text-sm text-muted-foreground">{sousTitre}</p>}
          </div>

          {intention && <p className="text-sm text-foreground/80">{intention}</p>}

          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {keywords.slice(0, 12).map((k) => (
                <Badge key={k} variant="secondary" className="text-[11px] font-normal">
                  {k}
                </Badge>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {stored.chosenAt && (
              <>Choisi le {new Date(stored.chosenAt).toLocaleDateString('fr-FR')}</>
            )}
            {changed && <> — la fiche de référence a été mise à jour depuis</>}
          </p>

          {(aiProfile || live?.image_alt || live?.source_url) && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setOpenMeta((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openMeta ? 'rotate-180' : ''}`} />
                Métadonnées de l'image
              </button>

              {openMeta && (
                <dl className="mt-3 space-y-2 rounded-xl bg-muted/40 p-3 text-xs">
                  {stored.stableId && (
                    <div>
                      <dt className="text-muted-foreground">Référence</dt>
                      <dd className="text-foreground font-mono text-[11px]">{stored.stableId}</dd>
                    </div>
                  )}
                  {live?.image_alt && (
                    <div>
                      <dt className="text-muted-foreground">Description de l'image</dt>
                      <dd className="text-foreground">{live.image_alt}</dd>
                    </div>
                  )}
                  {live?.image_url && (
                    <div>
                      <dt className="text-muted-foreground">Fichier</dt>
                      <dd>
                        <a
                          href={live.image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline break-all"
                        >
                          Ouvrir l'image d'origine <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </dd>
                    </div>
                  )}
                  {live?.source_url && (
                    <div>
                      <dt className="text-muted-foreground">Source</dt>
                      <dd>
                        <a
                          href={live.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline break-all"
                        >
                          {live.source_url} <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </dd>
                    </div>
                  )}
                  {aiProfile &&
                    Object.entries(aiProfile).map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-muted-foreground">{prettyKey(k)}</dt>
                        <dd className="text-foreground">{renderValue(v)}</dd>
                      </div>
                    ))}
                </dl>
              )}
            </div>
          )}
        </div>
      </div>
      {picker}
      <GardenExampleViewer
        examples={[viewerItem]}
        index={zoom ? 0 : null}
        onNavigate={() => {}}
        onClose={() => setZoom(false)}
        typeLabel={styleLabel ?? undefined}
      />

    </section>
  );

};

export default GardenExampleCard;
