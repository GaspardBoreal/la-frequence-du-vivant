/**
 * Pellicule photo d'un ouvrage, intégrée à l'inspecteur de l'Atelier.
 * Ajout multiple, réordonnancement (glisser ou flèches), légende, suppression,
 * filtre par saison / millésime et ouverture de la visionneuse plein écran.
 */
import React from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Camera, ImagePlus, Trash2, Maximize2, Loader2 } from 'lucide-react';
import type { ObjetPhoto } from '@/hooks/propriete/useObjetPhotos';
import { SEASONS, seasonOf, yearOf, formatPhotoDate } from './seasons';
import OuvragePhotoViewer from './OuvragePhotoViewer';

interface Props {
  title: string;
  photos: ObjetPhoto[];
  readOnly?: boolean;
  uploading?: { done: number; total: number } | null;
  onUpload: (files: File[]) => void;
  onRemove: (photo: ObjetPhoto) => void;
  onCaption: (photoId: string, caption: string) => void;
  onReorder: (orderedIds: string[]) => void;
}

const Thumb: React.FC<{
  photo: ObjetPhoto;
  index: number;
  readOnly?: boolean;
  sortable: boolean;
  onOpen: () => void;
  onRemove: () => void;
}> = ({ photo, index, readOnly, sortable, onOpen, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
    disabled: !sortable,
  });
  const season = SEASONS.find((s) => s.key === seasonOf(photo));

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
      }}
      className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[hsl(var(--ds-line))] bg-black/5"
      {...attributes}
      {...listeners}
      title={`${season?.label ?? ''} · ${formatPhotoDate(photo)}`}
    >
      {photo.url ? (
        <img
          src={photo.url}
          alt={photo.caption || `Photo ${index + 1}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[9px] opacity-50">…</div>
      )}

      <span className="absolute left-0.5 top-0.5 rounded bg-black/60 px-1 text-[8px] font-semibold text-white">
        {index + 1}
      </span>
      <span className="absolute bottom-0.5 left-0.5 text-[10px] drop-shadow">{season?.glyph}</span>

      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        aria-label="Agrandir"
        className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Maximize2 className="h-4 w-4 text-white" />
      </button>

      {!readOnly && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Supprimer la photo"
          className="absolute right-0.5 top-0.5 rounded bg-red-600/85 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Trash2 className="h-2.5 w-2.5 text-white" />
        </button>
      )}
    </div>
  );
};

export const ObjetPhotoStrip: React.FC<Props> = ({
  title,
  photos,
  readOnly,
  uploading,
  onUpload,
  onRemove,
  onCaption,
  onReorder,
}) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [season, setSeason] = React.useState<string>('all');
  const [year, setYear] = React.useState<string>('all');
  const [viewer, setViewer] = React.useState<number | null>(null);

  const years = React.useMemo(
    () => Array.from(new Set(photos.map(yearOf))).sort((a, b) => b - a),
    [photos],
  );

  const visible = React.useMemo(
    () =>
      photos.filter(
        (p) =>
          (season === 'all' || seasonOf(p) === season) &&
          (year === 'all' || String(yearOf(p)) === year),
      ),
    [photos, season, year],
  );

  const sortable = !readOnly && season === 'all' && year === 'all';
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = visible.map((p) => p.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(ids, from, to));
  };

  return (
    <div className="rounded-lg border border-[hsl(var(--ds-line))] bg-white/50 p-2">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Camera className="h-3.5 w-3.5 text-[hsl(var(--ds-forest))]" />
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
          Carnet photo
        </span>
        <span className="text-[10px] opacity-50">
          {photos.length === 0 ? '—' : `${photos.length} vue${photos.length > 1 ? 's' : ''}`}
        </span>
        {!readOnly && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={!!uploading}
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-[hsl(var(--ds-line))] px-2 py-0.5 text-[10px] transition-colors hover:border-[hsl(var(--ds-forest))]/60 hover:bg-[hsl(var(--ds-forest))]/5 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> {uploading.done}/{uploading.total}
              </>
            ) : (
              <>
                <ImagePlus className="h-3 w-3" /> Ajouter
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (files.length) onUpload(files);
        }}
      />

      {photos.length > 1 && (
        <div className="mb-1.5 flex flex-wrap items-center gap-1">
          {[{ key: 'all', label: 'Tout', glyph: '·' }, ...SEASONS].map((s: any) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSeason(s.key)}
              className={`rounded-full border px-1.5 py-0.5 text-[9px] transition-colors ${
                season === s.key
                  ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))]/10 font-semibold'
                  : 'border-[hsl(var(--ds-line))] opacity-70 hover:opacity-100'
              }`}
            >
              {s.glyph} {s.label}
            </button>
          ))}
          {years.length > 1 && (
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="ml-auto rounded border border-[hsl(var(--ds-line))] bg-white/70 px-1 py-0.5 text-[9px]"
            >
              <option value="all">Tous millésimes</option>
              {years.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="py-2 text-center text-[10px] italic opacity-50">
          {photos.length === 0
            ? 'Aucune photo — documentez cet ouvrage saison après saison.'
            : 'Aucune photo pour ce filtre.'}
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={visible.map((p) => p.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {visible.map((p, i) => (
                <Thumb
                  key={p.id}
                  photo={p}
                  index={i}
                  readOnly={readOnly}
                  sortable={sortable}
                  onOpen={() => setViewer(i)}
                  onRemove={() => onRemove(p)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {sortable && visible.length > 1 && (
        <p className="text-[9px] italic opacity-45">Glissez les vignettes pour ordonner le récit.</p>
      )}

      {viewer !== null && visible[viewer] && !readOnly && (
        <input
          className="mt-1.5 w-full rounded-md border border-[hsl(var(--ds-line))] bg-white/70 px-2 py-1 text-[10px] outline-none focus:border-[hsl(var(--ds-forest))]/50"
          defaultValue={visible[viewer].caption ?? ''}
          key={visible[viewer].id}
          placeholder="Légende de la vue sélectionnée…"
          onBlur={(e) => onCaption(visible[viewer].id, e.target.value)}
        />
      )}

      {viewer !== null && (
        <OuvragePhotoViewer
          photos={visible}
          index={viewer}
          title={title}
          onIndex={setViewer}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
};

export default ObjetPhotoStrip;
