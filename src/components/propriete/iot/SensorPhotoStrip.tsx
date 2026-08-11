import React from 'react';
import { Camera, Star, Trash2, Pencil, Check, X, GripVertical, Loader2 } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import {
  useCapteurPhotos, useCapteurPhotoUpload, useCapteurPhotoMutations, type CapteurPhoto,
} from '@/hooks/iot/useCapteurPhotos';
import SensorPhotoViewer from './SensorPhotoViewer';

interface Props {
  capteurId: string;
  proprieteId: string;
  healthColor?: string;
  readOnly?: boolean;
}

const Thumb: React.FC<{
  photo: CapteurPhoto;
  cover: boolean;
  readOnly?: boolean;
  onOpen: () => void;
  onCover: () => void;
  onCaption: () => void;
  onDelete: () => void;
}> = ({ photo, cover, readOnly, onOpen, onCover, onCaption, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60"
    >
      <button type="button" onClick={onOpen} className="block h-full w-full">
        {photo.url ? (
          <img src={photo.url} alt={photo.caption ?? 'Capteur en situation'} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[10px] opacity-50">…</span>
        )}
      </button>

      {cover && (
        <span className="pointer-events-none absolute left-1 top-1 rounded-full bg-[hsl(var(--ds-forest-deep))]/85 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[hsl(var(--ds-cream))]">
          Couverture
        </span>
      )}

      {!readOnly && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-0.5 bg-black/45 px-1 py-0.5 opacity-0 transition group-hover:opacity-100">
          <button type="button" {...attributes} {...listeners} aria-label="Déplacer" className="cursor-grab text-white/80 hover:text-white">
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onCover} aria-label="Mettre en couverture" className="text-white/80 hover:text-white">
            <Star className={`h-3.5 w-3.5 ${cover ? 'fill-current text-amber-300' : ''}`} />
          </button>
          <button type="button" onClick={onCaption} aria-label="Légender" className="text-white/80 hover:text-white">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onDelete} aria-label="Retirer" className="text-red-300 hover:text-red-200">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

/** « En situation » : le petit reportage photo d'un capteur. */
export const SensorPhotoStrip: React.FC<Props> = ({ capteurId, proprieteId, healthColor, readOnly }) => {
  const { data: photos = [] } = useCapteurPhotos(capteurId);
  const { items, upload, busy } = useCapteurPhotoUpload(capteurId, proprieteId);
  const { caption, reorder, remove } = useCapteurPhotoMutations(capteurId);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [order, setOrder] = React.useState<string[]>([]);
  React.useEffect(() => setOrder(photos.map((p) => p.id)), [photos]);
  const ordered = React.useMemo(
    () => order.map((id) => photos.find((p) => p.id === id)).filter(Boolean) as CapteurPhoto[],
    [order, photos],
  );

  const [viewer, setViewer] = React.useState<number | null>(null);
  const [editing, setEditing] = React.useState<CapteurPhoto | null>(null);
  const [draft, setDraft] = React.useState('');
  const [toDelete, setToDelete] = React.useState<CapteurPhoto | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const commitOrder = (ids: string[]) => {
    setOrder(ids);
    reorder.mutate(ids);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = order.indexOf(active.id as string);
    const to = order.indexOf(over.id as string);
    if (from < 0 || to < 0) return;
    commitOrder(arrayMove(order, from, to));
  };

  return (
    <section className="mt-4">
      <div className="flex items-center gap-2">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.24em] text-[hsl(var(--ds-forest))]">En situation</h3>
        <span className="h-px flex-1" style={{ backgroundColor: healthColor ?? 'hsl(var(--ds-line))', opacity: 0.4 }} />
        {!readOnly && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ds-forest))]/40 px-2.5 py-1 text-[11px] text-[hsl(var(--ds-forest-deep))] hover:bg-white/70 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            Ajouter des photos
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture={undefined}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (files.length) upload(files, photos.length);
        }}
      />

      {ordered.length === 0 && items.length === 0 && (
        <p className="mt-2 rounded-2xl border border-dashed border-[hsl(var(--ds-line))] bg-white/40 px-3 py-4 text-center text-xs italic text-[hsl(var(--ds-forest))]/70">
          Montrer cette sonde en situation — une photo du piquet dans le sol vaut mille relevés.
        </p>
      )}

      {ordered.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={order} strategy={horizontalListSortingStrategy}>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {ordered.map((p, i) => (
                <Thumb
                  key={p.id}
                  photo={p}
                  cover={i === 0}
                  readOnly={readOnly}
                  onOpen={() => setViewer(i)}
                  onCover={() => commitOrder([p.id, ...order.filter((id) => id !== p.id)])}
                  onCaption={() => { setEditing(p); setDraft(p.caption ?? ''); }}
                  onDelete={() => setToDelete(p)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {items.length > 0 && (
        <ul className="mt-2 space-y-1">
          {items.map((it) => (
            <li key={it.key} className="flex items-center gap-2 text-[11px] text-[hsl(var(--ds-forest-deep))]">
              <span className="flex-1 truncate">{it.name}</span>
              {it.status === 'error' ? (
                <span className="text-red-600">{it.error}</span>
              ) : (
                <span className="w-24 overflow-hidden rounded-full bg-[hsl(var(--ds-line))]">
                  <span
                    className="block h-1 rounded-full bg-[hsl(var(--ds-forest-deep))] transition-all"
                    style={{ width: `${it.size ? Math.round((it.sent / it.size) * 100) : 5}%` }}
                  />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <div className="mt-2 flex items-center gap-1.5">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Légende de la photo"
            className="h-8 bg-white/70 text-xs"
            autoFocus
          />
          <button
            type="button"
            onClick={() => { caption.mutate({ id: editing.id, caption: draft.trim() || null }); setEditing(null); }}
            className="rounded-full bg-[hsl(var(--ds-forest-deep))] p-1.5 text-[hsl(var(--ds-cream))]"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => setEditing(null)} className="rounded-full border p-1.5">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <SensorPhotoViewer photos={ordered} index={viewer} onClose={() => setViewer(null)} onNavigate={setViewer} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="z-[4301]" overlayClassName="z-[4300]">
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer cette photo ?</AlertDialogTitle>
            <AlertDialogDescription>Le cliché sera supprimé définitivement du dossier du capteur.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (toDelete) remove.mutate(toDelete); setToDelete(null); }}
              className="bg-red-600 hover:bg-red-700"
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default SensorPhotoStrip;
