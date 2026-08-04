import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Camera,
  Plus,
  Trash2,
  UploadCloud,
  Video,
  X,
  Loader2,
  Pencil,
  GripVertical,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  useTestMediaMutations,
  useTestMediaUpload,
  sortTestMedias,
  MAX_VIDEO_BYTES,
  formatBytes,
  type TestMedia,
  type UploadTarget,
} from '@/hooks/propriete/usePropertyTestMedias';
import { soilTestAccent, soilTestLabel } from './soilTestCatalog';
import { TestMediaViewer } from './TestMediaViewer';
import { TestMediaUploadProgress } from './TestMediaUploadProgress';

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

export const TestMediaDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  target: UploadTarget;
  medias: TestMedia[];
  readOnly?: boolean;
}> = ({ open, onClose, target, medias: rawMedias, readOnly = false }) => {
  const { upload, progress } = useTestMediaUpload(target);
  const { remove, patch, reorder } = useTestMediaMutations(target.proprieteId);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [viewer, setViewer] = React.useState<number | null>(null);
  const [editing, setEditing] = React.useState<string | null>(null);
  const accent = soilTestAccent(target.testId);

  const medias = React.useMemo(() => sortTestMedias(rawMedias), [rawMedias]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const commitOrder = (ids: string[]) =>
    reorder.mutate({ sampleId: target.sampleId, testId: target.testId, ids });

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = medias.map((m) => m.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    commitOrder(next);
  };

  const move = (id: string, delta: number) => {
    const ids = medias.map((m) => m.id);
    const from = ids.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= ids.length) return;
    commitOrder(arrayMove(ids, from, to));
  };

  const onFiles = (files: FileList | null) => {
    if (!files || readOnly) return;
    upload(Array.from(files));
  };


  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto p-0 bg-[hsl(var(--ds-cream))]"
      >
        {/* Bandeau */}
        <div
          className="relative px-5 pt-6 pb-5 text-[hsl(var(--ds-cream))]"
          style={{
            background: `linear-gradient(135deg, hsl(${accent}) 0%, hsl(var(--ds-forest-deep)) 100%)`,
          }}
        >
          <SheetHeader className="space-y-1 text-left">
            <div className="text-[9px] font-bold tracking-[0.24em] uppercase opacity-80">
              Preuves de terrain
            </div>
            <SheetTitle className="text-[hsl(var(--ds-cream))] font-serif text-2xl leading-tight">
              {(target.sampleLocation || '').trim() || `Prélèvement ${target.sampleLabel ?? ''}`}
            </SheetTitle>
            <div className="text-xs opacity-90">{soilTestLabel(target.testId)}</div>
          </SheetHeader>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 text-[11px] font-semibold">
            <Camera className="w-3.5 h-3.5" />
            {medias.length} média{medias.length > 1 ? 's' : ''}
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Zone de dépôt */}
          {!readOnly && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                onFiles(e.dataTransfer.files);
              }}
              onClick={() => inputRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                dragging
                  ? 'border-[hsl(var(--ds-gold))] bg-[hsl(var(--ds-gold))]/10 scale-[1.01]'
                  : 'border-[hsl(var(--ds-forest))]/30 bg-white/50 hover:bg-white/80'
              }`}
            >
              <motion.div
                animate={{ y: dragging ? -3 : 0 }}
                className="mx-auto w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: `hsl(${accent} / 0.14)` }}
              >
                <UploadCloud className="w-5 h-5" style={{ color: `hsl(${accent})` }} />
              </motion.div>
              <div className="mt-2 text-[13px] font-semibold text-[hsl(var(--ds-forest-deep))]">
                Déposez vos photos ou vidéos
              </div>
              <div className="text-[11px] text-[hsl(var(--ds-forest-deep))]/60 mt-0.5">
                JPG · PNG · HEIC · MP4 / MOV (60 Mo max) — plusieurs fichiers possibles
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  onFiles(e.target.files);
                  e.currentTarget.value = '';
                }}
              />
            </div>
          )}

          {progress && (
            <div className="flex items-center gap-2 rounded-xl bg-white/70 border border-[hsl(var(--ds-line))] px-3 py-2 text-[12px] text-[hsl(var(--ds-forest-deep))]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Envoi {progress.done}/{progress.total}…
            </div>
          )}

          {/* Grille */}
          {medias.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[hsl(var(--ds-forest))]/25 p-6 text-center text-[12.5px] text-[hsl(var(--ds-forest-deep))]/70">
              Aucune preuve visuelle pour l’instant.
            </div>
          ) : (
            <>
              {!readOnly && medias.length > 1 && (
                <div className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--ds-forest-deep))]/60">
                  <GripVertical className="w-3.5 h-3.5" />
                  Glissez les vignettes pour définir l’ordre d’affichage et d’impression.
                </div>
              )}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
              >
                <SortableContext
                  items={medias.map((m) => m.id)}
                  strategy={rectSortingStrategy}
                  disabled={readOnly}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <AnimatePresence initial={false}>
                      {medias.map((m, i) => (
                        <SortableTile
                          key={m.id}
                          media={m}
                          index={i}
                          total={medias.length}
                          readOnly={readOnly}
                          editing={editing === m.id}
                          onOpen={() => setViewer(i)}
                          onToggleEdit={() => setEditing(editing === m.id ? null : m.id)}
                          onCaption={(caption) => {
                            patch.mutate({ id: m.id, caption });
                            setEditing(null);
                          }}
                          onRemove={() => remove.mutate(m)}
                          onMove={(d) => move(m.id, d)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </SortableContext>
              </DndContext>
            </>
          )}
        </div>

        <TestMediaViewer
          medias={medias}
          index={viewer}
          onClose={() => setViewer(null)}
          onNavigate={setViewer}
        />
      </SheetContent>
    </Sheet>
  );
};

/** Vignette classable (glisser-déposer + flèches tactiles). */
const SortableTile: React.FC<{
  media: TestMedia;
  index: number;
  total: number;
  readOnly: boolean;
  editing: boolean;
  onOpen: () => void;
  onToggleEdit: () => void;
  onCaption: (caption: string | null) => void;
  onRemove: () => void;
  onMove: (delta: number) => void;
}> = ({
  media: m,
  index,
  total,
  readOnly,
  editing,
  onOpen,
  onToggleEdit,
  onCaption,
  onRemove,
  onMove,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: m.id,
    disabled: readOnly,
  });

  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`group relative rounded-xl overflow-hidden bg-white border shadow-sm ${
        isDragging
          ? 'z-20 border-[hsl(var(--ds-gold))] shadow-xl ring-2 ring-[hsl(var(--ds-gold))]/50'
          : 'border-[hsl(var(--ds-line))]'
      }`}
    >
      <button onClick={onOpen} className="block w-full aspect-square bg-[hsl(var(--ds-forest))]/8">
        {m.media_type === 'video' ? (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="w-7 h-7 text-[hsl(var(--ds-forest))]/60" />
          </div>
        ) : (
          <img
            src={m.url}
            alt={m.caption ?? 'Preuve de terrain'}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        )}
      </button>

      {/* Rang */}
      <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[hsl(var(--ds-gold))] text-[10px] font-bold text-[hsl(var(--ds-forest-deep))] flex items-center justify-center shadow">
          {index + 1}
        </span>
        <span className="rounded-full bg-black/55 text-white text-[9px] px-1.5 py-0.5 backdrop-blur-sm">
          {fmt(m.created_at)}
        </span>
      </div>

      {!readOnly && (
        <>
          {/* Poignée de glissement */}
          <button
            {...attributes}
            {...listeners}
            aria-label="Déplacer"
            className="absolute bottom-9 left-1.5 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-[hsl(var(--ds-forest-deep))] cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity touch-none"
          >
            <GripVertical className="w-3 h-3" />
          </button>

          {/* Flèches tactiles */}
          {total > 1 && (
            <div className="absolute bottom-9 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              <button
                onClick={() => onMove(-1)}
                disabled={index === 0}
                aria-label="Reculer"
                className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-[hsl(var(--ds-forest-deep))] disabled:opacity-30"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                onClick={() => onMove(1)}
                disabled={index === total - 1}
                aria-label="Avancer"
                className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-[hsl(var(--ds-forest-deep))] disabled:opacity-30"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onToggleEdit}
              aria-label="Légender"
              className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-[hsl(var(--ds-forest-deep))]"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={onRemove}
              aria-label="Supprimer"
              className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-red-600"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </>
      )}

      <div className="px-2 py-1.5">
        {editing && !readOnly ? (
          <input
            autoFocus
            defaultValue={m.caption ?? ''}
            placeholder="Légende…"
            onBlur={(e) => onCaption(e.target.value.trim() || null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            className="w-full bg-transparent text-[11px] outline-none border-b border-[hsl(var(--ds-forest))]/30 text-[hsl(var(--ds-forest-deep))]"
          />
        ) : (
          <div className="text-[11px] text-[hsl(var(--ds-forest-deep))]/70 truncate">
            {m.caption || (m.media_type === 'video' ? 'Vidéo' : 'Photo')}
          </div>
        )}
      </div>
    </motion.div>
  );
};


/** Pastille compacte à poser dans une ligne de prélèvement. */
export const TestMediaBadge: React.FC<{
  target: UploadTarget;
  medias: TestMedia[];
  readOnly?: boolean;
}> = ({ target, medias, readOnly }) => {
  const [open, setOpen] = React.useState(false);
  const accent = soilTestAccent(target.testId);
  const first = sortTestMedias(medias).find((m) => m.media_type === 'photo');

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Preuves de terrain"
        className="relative flex-shrink-0 w-11 h-11 rounded-full overflow-hidden border-2 transition-transform hover:scale-105"
        style={{
          borderColor: medias.length ? `hsl(${accent})` : 'hsl(var(--ds-forest) / 0.3)',
          borderStyle: medias.length ? 'solid' : 'dashed',
          background: medias.length ? undefined : 'hsl(var(--ds-cream))',
        }}
      >
        {first?.url ? (
          <img src={first.url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="w-full h-full flex items-center justify-center">
            {medias.length ? (
              <Video className="w-4 h-4" style={{ color: `hsl(${accent})` }} />
            ) : (
              <Plus className="w-4 h-4 text-[hsl(var(--ds-forest))]/50" />
            )}
          </span>
        )}
        {medias.length > 0 && (
          <span className="absolute -bottom-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[hsl(var(--ds-gold))] text-[9px] font-bold text-[hsl(var(--ds-forest-deep))] flex items-center justify-center shadow">
            {medias.length}
          </span>
        )}
      </button>
      {open && (
        <TestMediaDrawer
          open={open}
          onClose={() => setOpen(false)}
          target={target}
          medias={medias}
          readOnly={readOnly}
        />
      )}
    </>
  );
};

export const TestMediaCloseIcon = X;
