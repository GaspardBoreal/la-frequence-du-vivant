import React, { useEffect, useState } from 'react';
import { X, User, Calendar, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { GalleryPhoto } from '@/hooks/propriete/usePropertyGallery';

interface Props {
  photos: GalleryPhoto[];
  onReorder?: (photos: GalleryPhoto[]) => void;
}

// Ratio d'aire (col-span × row-span) par index — grille asymétrique jusqu'à 12 photos.
const TILE_CLASSES = [
  'col-span-2 row-span-2', // 0 hero
  'col-span-2 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-2',
  'col-span-1 row-span-1',
  'col-span-2 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-2 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
];

const SortableTile: React.FC<{
  photo: GalleryPhoto;
  index: number;
  draggable: boolean;
  onOpen: () => void;
}> = ({ photo, index, draggable, onOpen }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
    disabled: !draggable,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative overflow-hidden rounded-2xl group ${TILE_CLASSES[index] ?? 'col-span-1 row-span-1'} bg-muted`}
    >
      <button onClick={onOpen} className="absolute inset-0 w-full h-full">
        <img
          src={photo.url}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition" />
        <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 group-hover:opacity-100 transition text-left">
          {photo.author_name && (
            <div className="text-[10px] text-white/90 flex items-center gap-1 truncate">
              <User className="w-2.5 h-2.5" /> {photo.author_name}
            </div>
          )}
          {photo.photo_date && (
            <div className="text-[10px] text-white/70 flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />
              {new Date(photo.photo_date).toLocaleDateString('fr-FR')}
            </div>
          )}
        </div>
      </button>

      {draggable && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1.5 left-1.5 z-10 cursor-grab active:cursor-grabbing rounded p-1 bg-black/50 backdrop-blur opacity-0 group-hover:opacity-100 transition"
          title="Glisser pour réordonner"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5 text-white/90" />
        </div>
      )}
    </div>
  );
};

export const GalleryBento: React.FC<Props> = ({ photos, onReorder }) => {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [localPhotos, setLocalPhotos] = useState<GalleryPhoto[]>(photos);

  useEffect(() => setLocalPhotos(photos), [photos]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localPhotos.findIndex((p) => p.id === active.id);
    const newIndex = localPhotos.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = [...localPhotos];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    setLocalPhotos(reordered);
    onReorder?.(reordered);
  };

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') setLightbox((i) => (i! + 1) % localPhotos.length);
      if (e.key === 'ArrowLeft') setLightbox((i) => (i! - 1 + localPhotos.length) % localPhotos.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, localPhotos.length]);

  if (localPhotos.length === 0) return null;

  const draggable = !!onReorder;

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localPhotos.map((p) => p.id)} strategy={rectSortingStrategy}>
          <div
            className="grid grid-cols-4 auto-rows-[110px] md:auto-rows-[150px] gap-2 md:gap-3"
            style={{ gridAutoFlow: 'dense' }}
          >
            {localPhotos.map((p, i) => (
              <SortableTile
                key={p.id}
                photo={p}
                index={i}
                draggable={draggable}
                onOpen={() => setLightbox(i)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {lightbox !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
          >
            <X className="w-6 h-6" />
          </button>
          <button
            className="absolute left-4 text-white/70 hover:text-white p-2"
            onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i! - 1 + localPhotos.length) % localPhotos.length); }}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <img
            src={localPhotos[lightbox].url}
            alt=""
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-4 text-white/70 hover:text-white p-2"
            onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i! + 1) % localPhotos.length); }}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-xs flex items-center gap-3 bg-black/40 backdrop-blur px-4 py-2 rounded-full">
            <span>{lightbox + 1} / {localPhotos.length}</span>
            {localPhotos[lightbox].author_name && (
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> {localPhotos[lightbox].author_name}</span>
            )}
            {localPhotos[lightbox].photo_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(localPhotos[lightbox].photo_date!).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
};
