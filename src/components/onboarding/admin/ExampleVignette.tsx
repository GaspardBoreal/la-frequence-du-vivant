/**
 * Vignette d'exemple de jardin — tuile partagée par les vues « Vignette »
 * et « Boussole » de l'admin onboarding.
 *
 * Clic sur la tuile : visionneuse plein écran. Les actions d'édition sont
 * en surimpression, toujours visibles sur mobile (pas de survol), révélées
 * au survol sur bureau. Mention discrète : nom de l'exemple (type).
 */
import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GardenExample, GardenType } from '@/hooks/onboarding/useOnboardingConfig';

interface Props {
  example: GardenExample;
  type?: GardenType;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  /** Terme à surligner dans le titre (recherche « nom contient »). */
  highlight?: string;
}

const Highlighted: React.FC<{ text: string; term?: string }> = ({ text, term }) => {
  const t = term?.trim();
  if (!t) return <>{text}</>;
  const i = text.toLowerCase().indexOf(t.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-primary/25 px-0.5 text-inherit">{text.slice(i, i + t.length)}</mark>
      {text.slice(i + t.length)}
    </>
  );
};

const ExampleVignette: React.FC<Props> = ({ example, type, onOpen, onEdit, onDelete, highlight }) => {
  const src = example.thumbnail_url || example.image_url;
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-card transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left"
        aria-label={`Agrandir ${example.titre}`}
      >
        <div className="aspect-[3/2] w-full overflow-hidden bg-muted">
          {src ? (
            <img
              src={src}
              alt={example.image_alt ?? example.titre}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Sans photo
            </div>
          )}
        </div>
        <div className="px-2.5 py-2">
          <p className="truncate text-[13px] font-medium leading-tight">
            <Highlighted text={example.titre} term={highlight} />
          </p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {type ? `(${type.titre})` : ' '}
          </p>
        </div>
      </button>

      {!example.publie && (
        <Badge variant="outline" className="absolute left-2 top-2 bg-background/80 text-[10px]">
          masqué
        </Badge>
      )}

      <div className="absolute right-1.5 top-1.5 flex gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <Button size="icon" variant="secondary" className="h-7 w-7" onClick={onEdit} aria-label={`Modifier ${example.titre}`}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="secondary" className="h-7 w-7" onClick={onDelete} aria-label={`Supprimer ${example.titre}`}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );
};

export default ExampleVignette;
