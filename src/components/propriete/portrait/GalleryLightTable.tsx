import React, { useMemo, useState } from 'react';
import { Check, Filter, MapPin, User, X } from 'lucide-react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
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
import {
  type GalleryCandidate,
  GALLERY_MAX,
} from '@/hooks/propriete/usePropertyGallery';

interface Props {
  candidates: GalleryCandidate[];
  selectedKeys: string[];
  onToggle: (key: string) => void;
  onReorder: (orderedKeys: string[]) => void;
}

const keyOf = (c: Pick<GalleryCandidate, 'source_table' | 'source_id'>) =>
  `${c.source_table}::${c.source_id}`;

export const GalleryLightTable: React.FC<Props> = ({
  candidates,
  selectedKeys,
  onToggle,
  onReorder,
}) => {
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [filterAuthor, setFilterAuthor] = useState<string>('all');
  const [onlyGps, setOnlyGps] = useState(false);

  const events = useMemo(() => {
    const map = new Map<string, string>();
    candidates.forEach((c) => {
      if (c.event_id && c.event_title) map.set(c.event_id, c.event_title);
    });
    return Array.from(map, ([id, title]) => ({ id, title }));
  }, [candidates]);

  const authors = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => c.author_name && set.add(c.author_name));
    return Array.from(set).sort();
  }, [candidates]);

  const filtered = useMemo(
    () =>
      candidates.filter((c) => {
        if (filterEvent !== 'all' && c.event_id !== filterEvent) return false;
        if (filterAuthor !== 'all' && c.author_name !== filterAuthor) return false;
        if (onlyGps && (c.lat == null || c.lng == null)) return false;
        return true;
      }),
    [candidates, filterEvent, filterAuthor, onlyGps]
  );

  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const selectedCandidates = useMemo(
    () => selectedKeys
      .map((k) => candidates.find((c) => keyOf(c) === k))
      .filter(Boolean) as GalleryCandidate[],
    [candidates, selectedKeys],
  );

  const atMax = selectedKeys.length >= GALLERY_MAX;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = selectedKeys.indexOf(String(active.id));
    const newIdx = selectedKeys.indexOf(String(over.id));
    if (oldIdx < 0 || newIdx < 0) return;
    onReorder(arrayMove(selectedKeys, oldIdx, newIdx));
  };

  return (
    <div className="space-y-6">
      {/* Compteur circulaire */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <CircularCounter value={selectedKeys.length} max={GALLERY_MAX} />
          <div>
            <div className="text-sm font-semibold text-foreground">
              {selectedKeys.length} / {GALLERY_MAX} photographies
            </div>
            <div className="text-xs text-muted-foreground">
              {atMax
                ? 'Maximum atteint — désélectionnez pour changer'
                : 'Composez votre portrait — 12 clichés maximum'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            className="text-xs bg-background border border-border rounded-md px-2 py-1"
          >
            <option value="all">Toutes les marches</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
          {authors.length > 0 && (
            <select
              value={filterAuthor}
              onChange={(e) => setFilterAuthor(e.target.value)}
              className="text-xs bg-background border border-border rounded-md px-2 py-1"
            >
              <option value="all">Tous les auteurs</option>
              {authors.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          )}
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={onlyGps}
              onChange={(e) => setOnlyGps(e.target.checked)}
              className="accent-amber-600"
            />
            <MapPin className="w-3 h-3" /> GPS
          </label>
        </div>
      </div>

      {/* Bandeau ordre — glisser-déposer */}
      {selectedCandidates.length > 0 && (
        <div className="rounded-xl bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-500/20 p-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-800 dark:text-amber-300 mb-2">
            Fil narratif · glissez pour réordonner
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={selectedKeys} strategy={rectSortingStrategy}>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {selectedCandidates.map((c, i) => (
                  <SortableChip key={keyOf(c)} id={keyOf(c)} c={c} index={i} onRemove={() => onToggle(keyOf(c))} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Table lumineuse — planche contact */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 bg-neutral-900/95 dark:bg-black/70 rounded-2xl p-3">
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-neutral-400 text-sm">
            Aucune photographie disponible pour ces filtres.
          </div>
        )}
        {filtered.map((c) => {
          const k = keyOf(c);
          const selected = selectedSet.has(k);
          const disabled = !selected && atMax;
          return (
            <button
              key={k}
              onClick={() => !disabled && onToggle(k)}
              disabled={disabled}
              className={`relative aspect-square overflow-hidden rounded-lg group transition ${
                disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <img
                src={c.url}
                alt=""
                loading="lazy"
                className={`w-full h-full object-cover transition duration-500 ${
                  selected ? 'saturate-100' : 'saturate-[.35] sepia-[.35] group-hover:saturate-100 group-hover:sepia-0'
                }`}
              />
              {selected && (
                <div className="absolute inset-0 ring-4 ring-amber-500 ring-inset rounded-lg" />
              )}
              <div className="absolute top-1.5 right-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow ${
                    selected
                      ? 'bg-amber-500 text-white'
                      : 'bg-black/40 text-white/70 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {selected ? <Check className="w-3.5 h-3.5" /> : '+'}
                </div>
              </div>
              {c.author_name && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                  <div className="text-[10px] text-white/90 flex items-center gap-1 truncate">
                    <User className="w-2.5 h-2.5" /> {c.author_name}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const SortableChip: React.FC<{
  id: string;
  c: GalleryCandidate;
  index: number;
  onRemove: () => void;
}> = ({ id, c, index, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 shadow ring-1 ring-amber-600/40 touch-none cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <img src={c.url} alt="" className="w-full h-full object-cover" />
      <div className="absolute top-0 left-0 bg-amber-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-br-md">
        {index + 1}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-0 right-0 bg-black/60 hover:bg-red-600 text-white p-0.5 rounded-bl-md"
        aria-label="Retirer"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

const CircularCounter: React.FC<{ value: number; max: number }> = ({ value, max }) => {
  const pct = Math.min(1, value / max);
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
      <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
      <circle
        cx="24" cy="24" r={r} fill="none"
        stroke="currentColor" strokeWidth="3" strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`}
        className="text-amber-500 transition-all duration-500"
      />
      <text
        x="24" y="24" textAnchor="middle" dominantBaseline="central"
        className="rotate-90 origin-center fill-foreground text-[11px] font-bold"
        transform="rotate(90 24 24)"
      >
        {value}
      </text>
    </svg>
  );
};
