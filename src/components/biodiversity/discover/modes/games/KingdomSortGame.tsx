import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, LifeBuoy } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { pickWithPhotos, displayName, shuffle, photoUrl } from './gameUtils';
import GameCardImage from './GameCardImage';
import KingdomSortOnboarding, { useKingdomSortOnboarding } from './KingdomSortOnboarding';
import ZoomLoupeButton from './ZoomLoupeButton';
import ZoomLightbox from './ZoomLightbox';

interface Props {
  species: BiodiversitySpecies[];
  photoBy: Map<string, string>;
}

type Kingdom = 'Animalia' | 'Plantae' | 'Fungi';
const KINGDOMS: { key: Kingdom; label: string; emoji: string; color: string }[] = [
  { key: 'Animalia', label: 'Faune',      emoji: '🦋', color: 'bg-rose-200 border-rose-700/20' },
  { key: 'Plantae',  label: 'Flore',      emoji: '🌿', color: 'bg-emerald-200 border-emerald-700/20' },
  { key: 'Fungi',    label: 'Champignon', emoji: '🍄', color: 'bg-amber-200 border-amber-700/20' },
];

const vibrate = (ms: number) => {
  try { (navigator as any).vibrate?.(ms); } catch { /* noop */ }
};

// ------------------------- Draggable Card -------------------------
const DraggableCard: React.FC<{
  s: BiodiversitySpecies;
  photoBy: Map<string, string>;
  selected: boolean;
  onTap: () => void;
  onZoom: () => void;
}> = ({ s, photoBy, selected, onTap, onZoom }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: s.id });
  return (
    <motion.div
      ref={setNodeRef}
      layout
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('[data-no-dnd="true"]')) return;
        // Only treat as tap when no drag occurred
        e.stopPropagation();
        onTap();
      }}
      whileHover={{ scale: 1.03 }}
      animate={selected ? { scale: 1.08, y: -4 } : { scale: 1, y: 0 }}
      className={`group w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 bg-white shadow-[3px_3px_0_rgba(59,42,26,0.15)] relative touch-none select-none ${
        selected
          ? 'border-amber-500 ring-4 ring-amber-300/70'
          : 'border-[#3B2A1A]/20'
      } ${isDragging ? 'opacity-30' : 'cursor-grab active:cursor-grabbing'}`}
      role="button"
      aria-pressed={selected}
      aria-label={`Carte ${displayName(s)}${selected ? ', sélectionnée' : ''}`}
    >
      <GameCardImage species={s} photoBy={photoBy} className="w-full h-full object-cover pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 text-[10px] bg-black/55 text-white px-1 py-0.5 truncate text-center pointer-events-none">
        {displayName(s)}
      </div>
      <ZoomLoupeButton position="top-left" onActivate={onZoom} />
    </motion.div>
  );
};

// ------------------------- Droppable Zone -------------------------
const DroppableZone: React.FC<{
  k: (typeof KINGDOMS)[number];
  count: number;
  isTapTarget: boolean;
  onTapDrop: () => void;
  children: React.ReactNode;
}> = ({ k, count, isTapTarget, onTapDrop, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `zone-${k.key}` });
  return (
    <div
      ref={setNodeRef}
      onClick={() => isTapTarget && onTapDrop()}
      role="region"
      aria-label={`Zone ${k.label}, ${count} carte${count > 1 ? 's' : ''} placée${count > 1 ? 's' : ''}`}
      className={`min-h-[180px] rounded-2xl border-2 ${k.color} p-3 shadow-[4px_4px_0_rgba(59,42,26,0.12)] transition-all ${
        isOver ? 'ring-4 ring-emerald-500/70 scale-[1.02]' :
        isTapTarget ? 'ring-4 ring-amber-400/80 animate-pulse cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{k.emoji}</span>
        <span style={{ fontFamily: '"Caveat", cursive', fontSize: 24 }}>{k.label}</span>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
};

// ------------------------- Main Game -------------------------
const KingdomSortGame: React.FC<Props> = ({ species, photoBy }) => {
  const [round, setRound] = useState(0);
  const [placed, setPlaced] = useState<Record<string, Kingdom>>({});
  const [feedback, setFeedback] = useState<Record<string, 'ok' | 'ko'>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [zoomCard, setZoomCard] = useState<BiodiversitySpecies | null>(null);
  const onboarding = useKingdomSortOnboarding();

  useEffect(() => { setZoomCard(null); }, [round]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const items = useMemo(() => {
    const eligible = species.filter((s) => s.kingdom !== 'Other');
    return pickWithPhotos(shuffle(eligible), photoBy, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [species, photoBy, round]);

  const reset = () => {
    setPlaced({}); setFeedback({}); setSelectedId(null); setRound((r) => r + 1);
  };

  const place = (s: BiodiversitySpecies, k: Kingdom) => {
    const ok = s.kingdom === k;
    setPlaced((p) => ({ ...p, [s.id]: k }));
    setFeedback((f) => ({ ...f, [s.id]: ok ? 'ok' : 'ko' }));
    setSelectedId(null);
    vibrate(ok ? 20 : 40);
    setToast(ok ? `🎉 Bien vu !` : `Oups, pas la bonne maison…`);
    window.setTimeout(() => setToast(null), 1200);
  };

  const onDragStart = (e: DragStartEvent) => {
    if (zoomCard) return;
    setActiveId(String(e.active.id));
    vibrate(10);
  };
  const onDragEnd = (e: DragEndEvent) => {
    const id = String(e.active.id);
    setActiveId(null);
    if (!e.over) return;
    const zoneKey = String(e.over.id).replace('zone-', '') as Kingdom;
    const s = items.find((x) => x.id === id);
    if (s) place(s, zoneKey);
  };

  const onTapCard = (s: BiodiversitySpecies) => {
    if (placed[s.id]) return;
    setSelectedId((cur) => (cur === s.id ? null : s.id));
    vibrate(10);
  };

  const onTapZone = (k: Kingdom) => {
    if (!selectedId) return;
    const s = items.find((x) => x.id === selectedId);
    if (s) place(s, k);
  };

  const remaining = items.filter((s) => !placed[s.id]);
  const score = Object.values(feedback).filter((v) => v === 'ok').length;
  const activeSpecies = activeId ? items.find((x) => x.id === activeId) : null;

  return (
    <div className="relative" onClick={() => setSelectedId(null)}>
      <KingdomSortOnboarding open={onboarding.open} onClose={onboarding.close} />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <p className="text-xl" style={{ fontFamily: '"Caveat", cursive' }}>
          Score : <strong>{score}</strong> / {items.length}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onboarding.reopen(); }}
            className="inline-flex items-center gap-1 text-amber-900 px-3 py-1.5 rounded-full bg-amber-100/70 border border-amber-300/50 text-sm"
            aria-label="Revoir la règle"
          >
            <LifeBuoy className="h-4 w-4" /> Règle
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); reset(); }}
            className="inline-flex items-center gap-1 text-amber-900 px-3 py-1.5 rounded-full bg-amber-100/70 border border-amber-300/50 text-sm"
          >
            <RotateCw className="h-4 w-4" /> Rejouer
          </button>
        </div>
      </div>

      {/* Consigne permanente */}
      <div
        className="mb-3 px-3 py-2 rounded-xl bg-white/70 border border-[#3B2A1A]/10 text-[#3B2A1A] text-center"
        style={{ fontFamily: '"Patrick Hand", cursive', fontSize: 16 }}
      >
        {selectedId
          ? '👉 Touche maintenant la maison où ranger cette carte'
          : 'Glisse une carte vers sa maison, ou touche-la puis touche la bonne maison.'}
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        {/* Items à classer */}
        <div
          className="flex flex-wrap gap-3 mb-6 min-h-[120px] p-3 rounded-2xl bg-white/70 border-2 border-dashed border-[#3B2A1A]/20"
          onClick={(e) => e.stopPropagation()}
        >
          {remaining.length === 0 ? (
            <p className="m-auto text-xl text-[#3B2A1A]/60" style={{ fontFamily: '"Caveat", cursive' }}>
              Tout est trié&nbsp;!
            </p>
          ) : (
            remaining.map((s) => (
              <DraggableCard
                key={s.id}
                s={s}
                photoBy={photoBy}
                selected={selectedId === s.id}
                onTap={() => onTapCard(s)}
                onZoom={() => setZoomCard(s)}
              />
            ))
          )}
        </div>

        {/* Zones de dépôt */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4" onClick={(e) => e.stopPropagation()}>
          {KINGDOMS.map((k) => {
            const items_k = items.filter((s) => placed[s.id] === k.key);
            return (
              <DroppableZone
                key={k.key}
                k={k}
                count={items_k.length}
                isTapTarget={!!selectedId}
                onTapDrop={() => onTapZone(k.key)}
              >
                {items_k.map((s) => (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={
                      feedback[s.id] === 'ko'
                        ? { scale: 1, opacity: 1, x: [0, -4, 4, -3, 3, 0] }
                        : { scale: 1, opacity: 1 }
                    }
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 ${
                      feedback[s.id] === 'ok' ? 'border-emerald-700/40 ring-2 ring-emerald-500/50' :
                      feedback[s.id] === 'ko' ? 'border-rose-700/40 ring-2 ring-rose-500/50' :
                      'border-[#3B2A1A]/20'
                    }`}
                  >
                    <GameCardImage species={s} photoBy={photoBy} className="w-full h-full object-cover" />
                  </motion.div>
                ))}
              </DroppableZone>
            );
          })}
        </div>

        {/* Drag overlay (carte qui suit le doigt) */}
        <DragOverlay dropAnimation={{ duration: 200 }}>
          {activeSpecies ? (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-amber-500 bg-white shadow-2xl rotate-3">
              <GameCardImage species={activeSpecies} photoBy={photoBy} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 inset-x-0 text-[10px] bg-black/55 text-white px-1 py-0.5 truncate text-center">
                {displayName(activeSpecies)}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Toast feedback */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-[#3B2A1A] text-[#FDF8EE] px-5 py-2.5 rounded-full shadow-xl"
            style={{ fontFamily: '"Patrick Hand", cursive', fontSize: 18 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <ZoomLightbox
        open={!!zoomCard}
        onOpenChange={(o) => { if (!o) setZoomCard(null); }}
        src={zoomCard ? photoUrl(zoomCard, photoBy) : undefined}
        alt={zoomCard ? displayName(zoomCard) : ''}
        caption={zoomCard ? <>{displayName(zoomCard)} <em className="opacity-75 text-base">({zoomCard.scientificName})</em></> : null}
      />
    </div>
  );
};

export default KingdomSortGame;
