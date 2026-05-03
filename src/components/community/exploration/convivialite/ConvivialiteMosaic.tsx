import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Flag, Trash2, X, GripVertical, ArrowUpDown, Check, Pencil, User } from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ConvivialitePhoto } from '@/hooks/useConvivialitePhotos';
import { useExplorationMarcheurs } from '@/hooks/useExplorationMarcheurs';
import MediaAttributionSheet from '@/components/community/insights/curation/MediaAttributionSheet';

interface Props {
  photos: ConvivialitePhoto[];
  explorationId?: string;
  currentUserId?: string;
  isAdmin?: boolean;
  canReorder?: boolean;
  /** Whether the current user can reattribute photo credits. */
  canReattribute?: boolean;
  onReport: (photo: ConvivialitePhoto) => void;
  onDelete: (photo: ConvivialitePhoto) => void;
  onReorder?: (orderedIds: string[]) => void;
}

const ConvivialiteMosaic: React.FC<Props> = ({
  photos,
  explorationId,
  currentUserId,
  isAdmin,
  canReorder = false,
  canReattribute = false,
  onReport,
  onDelete,
  onReorder,
}) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [attributionOpen, setAttributionOpen] = useState(false);
  const { data: marcheurs = [] } = useExplorationMarcheurs(canReattribute ? explorationId : undefined);
  const [editMode, setEditMode] = useState(false);
  const [orderedPhotos, setOrderedPhotos] = useState<ConvivialitePhoto[]>(photos);
  const initialIds = useMemo(() => photos.map((p) => p.id).join('|'), [photos]);

  // Re-sync local order with props quand on n'est PAS en mode édition
  useEffect(() => {
    if (!editMode) setOrderedPhotos(photos);
  }, [photos, editMode, initialIds]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length));
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, photos.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setOrderedPhotos((items) => {
      const oldIndex = items.findIndex((p) => p.id === active.id);
      const newIndex = items.findIndex((p) => p.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleEnterEdit = () => {
    setOrderedPhotos(photos);
    setEditMode(true);
  };

  const handleCancel = () => {
    setOrderedPhotos(photos);
    setEditMode(false);
  };

  const handleSave = () => {
    if (onReorder) onReorder(orderedPhotos.map((p) => p.id));
    setEditMode(false);
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-20 text-white/60">
        <p className="text-sm">Le mur attend ses premiers instants.</p>
        <p className="text-xs mt-2 text-white/40">Les Ambassadeurs et Sentinelles tisseront ici la mémoire vivante du collectif.</p>
      </div>
    );
  }

  const lightboxPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <>
      {/* Barre d'actions */}
      {canReorder && (
        <div className="mb-4 flex items-center justify-end gap-2">
          {!editMode ? (
            <button
              onClick={handleEnterEdit}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition border border-white/10"
              title="Réorganiser les photos du mur"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Réorganiser</span>
            </button>
          ) : (
            <>
              <span className="text-white/60 text-xs hidden sm:inline mr-1">
                Glissez-déposez pour ordonner
              </span>
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 text-xs font-medium transition"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium transition"
              >
                <Check className="w-3.5 h-3.5" />
                Enregistrer l'ordre
              </button>
            </>
          )}
        </div>
      )}

      {editMode ? (
        // ----- MODE ÉDITION : grille régulière + dnd-kit -----
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedPhotos.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {orderedPhotos.map((photo, idx) => (
                <SortableTile key={photo.id} photo={photo} index={idx} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        // ----- MODE LECTURE : mosaïque colonnes CSS classique -----
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
          {photos.map((photo, i) => {
            const canDelete = isAdmin || photo.user_id === currentUserId;
            return (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.6) }}
                className="mb-3 break-inside-avoid relative group cursor-pointer"
                onClick={() => setLightboxIndex(i)}
              >
                <img
                  src={photo.url}
                  alt={`Instant partagé par ${photo.author_prenom || 'un marcheur'}`}
                  loading="lazy"
                  className="w-full rounded-xl shadow-lg shadow-black/40 transition-transform duration-300 group-hover:scale-[1.02] group-hover:shadow-emerald-500/20"
                  style={photo.width && photo.height ? { aspectRatio: `${photo.width} / ${photo.height}` } : undefined}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition flex items-end justify-between text-white text-[11px]">
                  <span className="font-medium drop-shadow">
                    {photo.author_prenom} {photo.author_nom}
                  </span>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onReport(photo)}
                      className="w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur flex items-center justify-center"
                      title="Signaler"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => onDelete(photo)}
                        className="w-7 h-7 rounded-full bg-black/50 hover:bg-red-500/80 backdrop-blur flex items-center justify-center"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {lightboxPhoto && lightboxIndex !== null && !editMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              onClick={() => setLightboxIndex(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length)); }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length)); }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <motion.img
              key={lightboxPhoto.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              src={lightboxPhoto.url}
              alt=""
              onClick={(e) => e.stopPropagation()}
              className="max-w-[92vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/90 text-sm text-center">
              <div className="font-semibold">{lightboxPhoto.author_prenom} {lightboxPhoto.author_nom}</div>
              <div className="text-white/60 text-xs">
                {new Date(lightboxPhoto.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const SortableTile: React.FC<{ photo: ConvivialitePhoto; index: number }> = ({ photo, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative aspect-square rounded-xl overflow-hidden border-2 select-none ${
        isDragging ? 'border-emerald-400 shadow-2xl shadow-emerald-500/40 scale-105' : 'border-white/10'
      }`}
    >
      <img
        src={photo.url}
        alt=""
        loading="lazy"
        draggable={false}
        className="w-full h-full object-cover pointer-events-none"
      />
      {/* Overlay sombre + numéro d'ordre */}
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-emerald-500/90 text-white text-xs font-bold flex items-center justify-center shadow-lg">
        {index + 1}
      </div>
      {/* Poignée drag (toute la tuile est draggable) */}
      <button
        {...attributes}
        {...listeners}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing flex items-end justify-end p-2"
        aria-label={`Réorganiser la photo ${index + 1}`}
      >
        <span className="w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white">
          <GripVertical className="w-4 h-4" />
        </span>
      </button>
    </div>
  );
};

export default ConvivialiteMosaic;
