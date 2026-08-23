/**
 * Sous-menu « Vignette » de l'onglet Exemples : tous les exemples dépliés
 * en un seul mur, triés dans l'ordre des types (position du type, puis
 * position de l'exemple), avec pagination 2 · 4 · 8 · 16 (8 par défaut).
 *
 * La pagination vit dans l'URL (`ep` / `eps`) pour rester partageable.
 * Clic sur une vignette : visionneuse plein écran calée sur la page courante.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PaginationControls from '@/components/admin/marche-events/PaginationControls';
import GardenExampleViewer from '@/components/onboarding/GardenExampleViewer';
import ExampleVignette from '@/components/onboarding/admin/ExampleVignette';
import type { GardenExample, GardenType } from '@/hooks/onboarding/useOnboardingConfig';

const SIZE_OPTIONS = [2, 4, 8, 16];
const DEFAULT_SIZE = 8;

interface Props {
  types: GardenType[];
  examples: GardenExample[];
  onEdit: (example: GardenExample) => void;
  onDelete: (example: GardenExample) => void;
}

interface FlatItem {
  example: GardenExample;
  type?: GardenType;
}

const ExamplesVignetteView: React.FC<Props> = ({ types, examples, onEdit, onDelete }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const flat = useMemo<FlatItem[]>(
    () =>
      [...types]
        .sort((a, b) => a.position - b.position)
        .flatMap((t) =>
          examples
            .filter((e) => e.type_id === t.id)
            .sort((a, b) => a.position - b.position)
            .map((e) => ({ example: e, type: t })),
        ),
    [types, examples],
  );

  const rawSize = Number(searchParams.get('eps'));
  const pageSize = SIZE_OPTIONS.includes(rawSize) ? rawSize : DEFAULT_SIZE;
  const rawPage = Number(searchParams.get('ep'));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const pageCount = Math.max(1, Math.ceil(flat.length / pageSize));
  const safePage = Math.min(page, pageCount);

  // Si la page courante devient vide (suppression, taille changée), on revient
  // à la dernière page existante plutôt que d'afficher un vide.
  useEffect(() => {
    if (page !== safePage) {
      const next = new URLSearchParams(searchParams);
      if (safePage === 1) next.delete('ep');
      else next.set('ep', String(safePage));
      setSearchParams(next, { replace: true });
    }
  }, [page, safePage, searchParams, setSearchParams]);

  const setParam = (key: string, value: number, def: number) => {
    const next = new URLSearchParams(searchParams);
    if (value === def) next.delete(key);
    else next.set(key, String(value));
    setSearchParams(next, { replace: true });
  };

  const pageItems = flat.slice((safePage - 1) * pageSize, safePage * pageSize);
  const current = viewerIndex !== null ? pageItems[viewerIndex] : null;

  if (flat.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun exemple pour l’instant — importez un lot ou ajoutez-en un depuis la vue « Type ».</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {flat.length} vignette(s) · présentées dans l’ordre des types
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {pageItems.map(({ example, type }, i) => (
          <ExampleVignette
            key={example.id}
            example={example}
            type={type}
            onOpen={() => setViewerIndex(i)}
            onEdit={() => onEdit(example)}
            onDelete={() => onDelete(example)}
          />
        ))}
      </div>

      <PaginationControls
        page={safePage}
        pageSize={pageSize}
        total={flat.length}
        pageSizeOptions={SIZE_OPTIONS}
        onPageChange={(p) => setParam('ep', p, 1)}
        onPageSizeChange={(s) => {
          const next = new URLSearchParams(searchParams);
          if (s === DEFAULT_SIZE) next.delete('eps');
          else next.set('eps', String(s));
          next.delete('ep');
          setSearchParams(next, { replace: true });
        }}
      />

      <GardenExampleViewer
        examples={pageItems.map((i) => i.example)}
        index={viewerIndex}
        onNavigate={setViewerIndex}
        onClose={() => setViewerIndex(null)}
        typeLabel={current?.type?.titre}
      />
    </div>
  );
};

export default ExamplesVignetteView;
