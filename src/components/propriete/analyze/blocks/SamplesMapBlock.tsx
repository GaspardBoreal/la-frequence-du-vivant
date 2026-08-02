import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GeoJSON, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { toast } from 'sonner';
import { Plus, X, MapPin, Info, Move3D, Maximize2, Minimize2, Pencil, Check } from 'lucide-react';
import { AnalyzeCard } from '../AnalyzeCard';
import { RichMap } from '@/components/maps';
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';
import {
  useProprieteParcelles,
  centroidOfParcelles,
} from '@/hooks/propriete/usePropertyParcelles';
import { openSampleCore } from '../sample/sampleDrawerStore';
import { strataState } from '../sample/strataGlyphs';
import { StrataSeal, StrataCompletionLine } from '../sample/StrataSeal';
import {
  MIN_SAMPLES,
  MAX_SAMPLES,
  defaultPositions,
  freeLetters,
} from '../sample/sampleRoster';
import { SampleDeleteDialog } from '../sample/SampleDeleteDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';



const SAVED_STYLE: L.PathOptions = {
  color: '#2f5d3a',
  weight: 3,
  opacity: 0.95,
  fillColor: '#2f5d3a',
  fillOpacity: 0.28,
};


/** Pastilles du « sceau des 4 strates » posées sous la lettre du repère. */
const strataDotsHtml = (sample?: SoilSample) => {
  if (!sample) return '';
  const dots = strataState(sample)
    .map(
      (st) =>
        `<span style="width:5px;height:5px;border-radius:999px;background:${
          st.done ? st.color : 'transparent'
        };border:1px solid ${st.done ? st.color : 'rgba(58,47,34,.45)'};display:inline-block;"></span>`,
    )
    .join('');
  return `<div style="position:absolute;left:0;right:0;top:24px;display:flex;gap:2.5px;justify-content:center;">${dots}</div>`;
};

const makeIcon = (letter: string, active: boolean, sample?: SoilSample, dimmed = false) =>
  L.divIcon({
    className: 'soil-sample-marker',
    iconSize: [38, 46],
    iconAnchor: [19, 42],
    html: `
      <div style="position:relative;width:38px;height:46px;opacity:${dimmed ? 0.55 : 1};transform:scale(${active ? 1.12 : 1});transform-origin:50% 100%;transition:opacity .18s ease, transform .18s ease;">

        <div style="position:absolute;inset:0;filter:drop-shadow(0 3px 6px rgba(30,40,20,.35));">
          <svg viewBox="0 0 38 46" width="38" height="46" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 45 C 6 30 3 20 3 15 A 16 16 0 1 1 35 15 C 35 20 32 30 19 45 Z"
              fill="${active ? '#FAF8F3' : '#f0ebe0'}"
              stroke="#2f5d3a" stroke-width="2.2"/>
          </svg>
        </div>
        <div style="position:absolute;left:0;right:0;top:3px;text-align:center;font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:16px;color:#2f5d3a;">${letter}</div>
        ${strataDotsHtml(sample)}
        ${active ? `<span style="position:absolute;left:50%;top:14px;transform:translate(-50%,-50%);width:36px;height:36px;border-radius:50%;background:rgba(47,93,58,.22);animation:soil-sample-pulse 1.8s ease-out infinite;"></span>` : ''}
      </div>
    `,
  });

const ViewController: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.setView(center, zoom ?? map.getZoom(), { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1]]);
  return null;
};

const AddOnClick: React.FC<{ onAdd: (lat: number, lng: number) => void; disabled: boolean }> = ({ onAdd, disabled }) => {
  useMapEvents({
    click: (e) => {
      if (disabled) return;
      onAdd(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};



/**
 * Ligne du registre : la saisie du nom vit en état LOCAL puis est propagée au
 * registre. Une réécriture du registre (semis GPS, sauvegarde) ne peut donc
 * plus effacer la frappe en cours.
 */
const SampleRow: React.FC<{
  sample: SoilSample;
  samples: SoilSample[];
  proprieteId?: string;
  hovered: boolean;
  autoFocus: boolean;
  canDelete: boolean;
  minSamples: number;
  onHover: (id: string | null) => void;
  onRename: (value: string) => void;
  onRelabel?: (label: string) => void;
  onDelete: () => void;
  onFocusConsumed: () => void;
}> = ({
  sample: s,
  samples,
  proprieteId,
  hovered,
  autoFocus,
  canDelete,
  minSamples,
  onHover,
  onRename,
  onRelabel,
  onDelete,
  onFocusConsumed,
}) => {
  const [draft, setDraft] = useState(s.location ?? '');
  const [editing, setEditing] = useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // Synchronise depuis le registre uniquement hors édition.
  useEffect(() => {
    if (!editing) setDraft(s.location ?? '');
  }, [s.location, editing]);

  // Focus demandé une seule fois, à la création du prélèvement.
  useEffect(() => {
    if (!autoFocus) return;
    inputRef.current?.focus();
    inputRef.current?.select();
    onFocusConsumed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  const commit = () => {
    setEditing(false);
    if ((s.location ?? '') !== draft) onRename(draft);
  };

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => onHover(s.id)}
      onMouseLeave={() => onHover(null)}
      className={`flex items-start gap-2.5 rounded-xl border p-2.5 transition-colors ${
        hovered || editing
          ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))]/8'
          : 'border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60'
      }`}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Changer le repère du prélèvement ${s.label}`}
            title="Changer le repère (lettre)"
            className="flex-shrink-0 w-9 h-9 rounded-full bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] flex items-center justify-center font-serif font-bold shadow-sm hover:ring-2 hover:ring-[hsl(var(--ds-forest))]/30 transition"
          >
            {s.label}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[9rem]">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest">Repère</DropdownMenuLabel>
          {freeLetters(samples, s.id).map((l) => (
            <DropdownMenuItem key={l} onSelect={() => onRelabel?.(l)} className="font-serif">
              {l}
              {l === s.label && <Check className="w-3.5 h-3.5 ml-auto" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            value={draft}
            title={draft || undefined}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => setEditing(true)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') {
                setDraft(s.location ?? '');
                setEditing(false);
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="Nommer ce prélèvement (ex. sous le tilleul…)"
            className="w-full bg-transparent border-none outline-none text-sm font-medium text-[hsl(var(--ds-forest-deep))] placeholder:font-normal placeholder:text-[hsl(var(--ds-forest))]/40"
          />
          <Pencil
            className={`w-3 h-3 flex-shrink-0 transition ${
              hovered || editing ? 'text-[hsl(var(--ds-forest))]/70' : 'text-transparent'
            }`}
          />
        </div>
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <StrataSeal
            sample={s}
            size="row"
            onSelect={(block) => openSampleCore(s.id, samples, proprieteId, block)}
          />
          <StrataCompletionLine sample={s} />
        </div>
        {s.lat != null && s.lng != null ? (
          <div className="text-[10px] text-[hsl(var(--ds-forest))]/50 mt-0.5">
            {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
          </div>
        ) : (
          <div className="text-[10px] text-[#b4603f]/80 mt-0.5">Position en attente…</div>
        )}
      </div>

      <button
        onClick={() => openSampleCore(s.id, samples, proprieteId)}
        aria-label={`Ouvrir la fiche carotte ${s.label}`}
        className="shrink-0 mt-0.5 rounded-full border border-[hsl(var(--ds-forest))]/35 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-forest))]/10 transition"
      >
        Carotte
      </button>
      <button
        onClick={() => canDelete && onDelete()}
        disabled={!canDelete}
        aria-label={`Retirer le prélèvement ${s.label}`}
        title={
          canDelete
            ? 'Retirer ce prélèvement'
            : `Le diagnostic requiert au moins ${minSamples} prélèvements`
        }
        className="w-7 h-7 mt-0.5 rounded-full flex items-center justify-center text-[hsl(var(--ds-forest))]/50 hover:text-[#b4603f] hover:bg-[#b4603f]/10 transition disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-[hsl(var(--ds-forest))]/50 disabled:cursor-not-allowed"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};


export const SamplesMapBlock: React.FC<{
  proprieteId?: string;
  proprieteCenter?: [number, number] | null;
  samples: SoilSample[];
  onUpdate: (id: string, patch: Partial<SoilSample>) => void;
  /** Renvoie l'identifiant du prélèvement créé (null si maximum atteint). */
  onAdd: (patch?: Partial<SoilSample>) => string | null | void;
  onRemove: (id: string) => void;
  /** Réattribue la lettre du repère. */
  onRelabel?: (id: string, label: string) => void;
  /** Réinsère un prélèvement supprimé (annulation). */
  onRestore?: (sample: SoilSample, at: number) => void;
  index?: number;
}> = ({
  proprieteId,
  proprieteCenter,
  samples,
  onUpdate,
  onAdd,
  onRemove,
  onRelabel,
  onRestore,
  index = 0,
}) => {

  const { data: parcelles = [] } = useProprieteParcelles(proprieteId);
  const parcCenter = useMemo(() => centroidOfParcelles(parcelles), [parcelles]);
  const center: [number, number] = parcCenter ?? proprieteCenter ?? [45.0, 0.5];

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SoilSample | null>(null);
  /** Prélèvements déjà semés : garantit une seule attribution de position par point. */
  const seededRef = React.useRef<Set<string>>(new Set());

  /**
   * Semis GPS non destructif : chaque prélèvement sans coordonnées reçoit un
   * emplacement libre via une mise à jour CIBLÉE (jamais une réécriture du registre).
   */
  useEffect(() => {
    if (!parcCenter && !proprieteCenter) return;
    const orphans = samples.filter(
      (s) => (s.lat == null || s.lng == null) && !seededRef.current.has(s.id),
    );
    if (!orphans.length) return;
    const placed = [...samples];
    for (const o of orphans) {
      const [lat, lng] = firstFreePosition(center, placed);
      seededRef.current.add(o.id);
      placed.push({ ...o, lat, lng });
      onUpdate(o.id, { lat, lng });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [samples, parcCenter?.[0], parcCenter?.[1], proprieteCenter?.[0], proprieteCenter?.[1]]);


  const parcelleBounds = useMemo<Array<[number, number]>>(() => {
    const pts: Array<[number, number]> = [];
    for (const p of parcelles) {
      if (p.geometry) {
        try {
          const b = L.geoJSON(p.geometry as any).getBounds();
          if (b.isValid()) {
            pts.push([b.getSouth(), b.getWest()]);
            pts.push([b.getNorth(), b.getEast()]);
            continue;
          }
        } catch {}
      }
      if (p.centroid_lat != null && p.centroid_lng != null) {
        pts.push([p.centroid_lat as number, p.centroid_lng as number]);
      }
    }
    return pts;
  }, [parcelles]);

  /**
   * Cadrage initial figé : recalculé sur les parcelles uniquement, jamais sur les
   * pastilles — la carte ne saute donc plus pendant un déplacement de repère.
   */
  const bounds = useMemo<Array<[number, number]> | undefined>(
    () => (parcelleBounds.length >= 2 ? parcelleBounds : undefined),
    [parcelleBounds],
  );

  const disabledAdd = samples.length >= MAX_SAMPLES;

  /** Couverture du carottage : strates renseignées / total possible. */
  const coverage = useMemo(() => {
    if (!samples.length) return 0;
    const done = samples.reduce(
      (acc, s) => acc + strataState(s).filter((st) => st.done).length,
      0,
    );
    return Math.round((done / (samples.length * 4)) * 100);
  }, [samples]);

  const handleAdd = (patch?: Partial<SoilSample>) => {
    if (samples.length >= MAX_SAMPLES) {
      toast.info(`Maximum atteint : ${MAX_SAMPLES} prélèvements.`);
      return;
    }
    const seed = patch?.lat != null && patch?.lng != null ? patch : (() => {
      const [lat, lng] = firstFreePosition(center, samples);
      return { ...patch, lat, lng };
    })();
    const id = onAdd(seed);
    if (typeof id === 'string' && id) {
      seededRef.current.add(id);
      setFocusId(id);
    } else if (id === null) {
      toast.info(`Maximum atteint : ${MAX_SAMPLES} prélèvements.`);
    }
  };

  const handleAddOnMap = (lat: number, lng: number) => handleAdd({ lat, lng });


  const confirmDelete = () => {
    const s = pendingDelete;
    setPendingDelete(null);
    if (!s) return;
    const at = samples.findIndex((x) => x.id === s.id);
    onRemove(s.id);
    toast(`Prélèvement ${s.label} retiré`, {
      description: s.location?.trim() || 'Sans nom',
      duration: 10000,
      action: onRestore
        ? { label: 'Annuler', onClick: () => onRestore(s, at < 0 ? samples.length : at) }
        : undefined,
    });
  };


  // Esc closes fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  const mapNode = (heightPx: number | string) => (
    <div className="relative isolate z-0 rounded-2xl overflow-hidden border border-[hsl(var(--ds-line))]" style={{ height: heightPx }}>
      <RichMap
        center={center}
        zoom={18}
        bounds={bounds}
        controls={{ zoom: true, style: true, geolocate: false, cadastre: true }}
        maxZoom={24}
        height="100%"
        initialStyle="cadastre"
      >
        <ViewController center={center} />
        <AddOnClick onAdd={handleAddOnMap} disabled={disabledAdd} />
        {parcelles.map((p) =>
          p.geometry ? <GeoJSON key={p.id} data={p.geometry as any} style={SAVED_STYLE} /> : null,
        )}
        {samples.map((s) =>
          s.lat != null && s.lng != null ? (
            <Marker
              key={s.id}
              position={[s.lat, s.lng]}
              icon={makeIcon(
                s.label,
                hoveredId === s.id || editingId === s.id,
                s,
                !!hoveredId && hoveredId !== s.id,
              )}

              draggable
              eventHandlers={{
                dragend: (e) => {
                  const ll = (e.target as L.Marker).getLatLng();
                  onUpdate(s.id, { lat: ll.lat, lng: ll.lng });
                },
                click: () => openSampleCore(s.id, samples, proprieteId),
                mouseover: () => setHoveredId(s.id),
                mouseout: () => setHoveredId(null),
              }}

            />
          ) : null,
        )}
      </RichMap>

      {/* Fullscreen toggle : top-left to avoid overlapping Géo/Sat/Relief/Cadastre (top-right) */}
      <button
        type="button"
        onClick={() => setFullscreen((v) => !v)}
        aria-label={fullscreen ? 'Quitter le plein écran' : 'Passer en plein écran'}
        className="absolute top-3 left-3 z-[400] w-9 h-9 rounded-full bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] flex items-center justify-center shadow-lg hover:bg-[hsl(var(--ds-forest-deep))] transition"
      >
        {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
    </div>
  );

  const sidePanel = (
    <div className="space-y-2">
      {/* En-tête collant : compteur + jauge de couverture du carottage */}
      <div className="sticky top-0 z-10 -mx-0.5 px-0.5 pb-2 pt-0.5 bg-[hsl(var(--ds-cream))]/90 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--ds-cream))]/70">
        <div className="flex items-baseline justify-between text-[10px] uppercase tracking-widest text-[hsl(var(--ds-forest))]/70">
          <span>Registre des prélèvements</span>
          <span className="font-semibold text-[hsl(var(--ds-forest))]">
            {samples.length} / {MAX_SAMPLES}
          </span>
        </div>
        <div className="mt-1.5 h-1 rounded-full bg-[hsl(var(--ds-forest))]/12 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[hsl(var(--ds-forest))]"
            initial={false}
            animate={{ width: `${coverage}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
        <div className="mt-1 text-[10px] text-[hsl(var(--ds-forest-deep))]/55">
          Couverture du carottage · {coverage}% des strates renseignées
        </div>
      </div>

      <AnimatePresence initial={false} mode="popLayout">
      {samples.map((s, i) => (
        <motion.div
          layout
          key={s.id}
          initial={{ opacity: 0, x: -6, height: 0 }}
          animate={{ opacity: hoveredId && hoveredId !== s.id ? 0.65 : 1, x: 0, height: 'auto' }}
          exit={{ opacity: 0, x: 12, height: 0 }}
          transition={{ delay: i * 0.02, duration: 0.22 }}
          onMouseEnter={() => setHoveredId(s.id)}
          onMouseLeave={() => setHoveredId(null)}
          className={`flex items-center gap-2.5 rounded-xl border p-2.5 transition ${
            hoveredId === s.id || editingId === s.id
              ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))]/8'
              : 'border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60'
          }`}
        >
          {/* Pastille : menu de réattribution de lettre */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Changer le repère du prélèvement ${s.label}`}
                title="Changer le repère (lettre)"
                className="flex-shrink-0 w-9 h-9 rounded-full bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] flex items-center justify-center font-serif font-bold shadow-sm hover:ring-2 hover:ring-[hsl(var(--ds-forest))]/30 transition"
              >
                {s.label}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[9rem]">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest">
                Repère
              </DropdownMenuLabel>
              {freeLetters(samples, s.id).map((l) => (
                <DropdownMenuItem
                  key={l}
                  onSelect={() => onRelabel?.(s.id, l)}
                  className="font-serif"
                >
                  {l}
                  {l === s.label && <Check className="w-3.5 h-3.5 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <input
                value={s.location ?? ''}
                onChange={(e) => onUpdate(s.id, { location: e.target.value })}
                onFocus={() => setEditingId(s.id)}
                onBlur={() => setEditingId((cur) => (cur === s.id ? null : cur))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLInputElement).blur();
                }}
                ref={(el) => {
                  if (el && editingId === s.id && document.activeElement !== el) el.focus();
                }}
                placeholder="Nommer ce prélèvement (ex. sous le tilleul…)"
                className="w-full bg-transparent border-none outline-none text-sm font-medium text-[hsl(var(--ds-forest-deep))] placeholder:font-normal placeholder:text-[hsl(var(--ds-forest))]/40"
              />
              <Pencil
                className={`w-3 h-3 flex-shrink-0 transition ${
                  hoveredId === s.id || editingId === s.id
                    ? 'text-[hsl(var(--ds-forest))]/70'
                    : 'text-transparent'
                }`}
              />
            </div>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <StrataSeal
                sample={s}
                size="row"
                onSelect={(block) => openSampleCore(s.id, samples, proprieteId, block)}
              />
              <StrataCompletionLine sample={s} />
            </div>
            {s.lat != null && s.lng != null && (
              <div className="text-[10px] text-[hsl(var(--ds-forest))]/50 mt-0.5">
                {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
              </div>
            )}
          </div>
          <button
            onClick={() => openSampleCore(s.id, samples, proprieteId)}
            aria-label={`Ouvrir la fiche carotte ${s.label}`}
            className="shrink-0 rounded-full border border-[hsl(var(--ds-forest))]/35 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-forest))]/10 transition"
          >
            Carotte
          </button>
          <button
            onClick={() => samples.length > MIN_SAMPLES && setPendingDelete(s)}
            disabled={samples.length <= MIN_SAMPLES}
            aria-label={`Retirer le prélèvement ${s.label}`}
            title={
              samples.length <= MIN_SAMPLES
                ? `Le diagnostic requiert au moins ${MIN_SAMPLES} prélèvements`
                : 'Retirer ce prélèvement'
            }
            className="w-7 h-7 rounded-full flex items-center justify-center text-[hsl(var(--ds-forest))]/50 hover:text-[#b4603f] hover:bg-[#b4603f]/10 transition disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-[hsl(var(--ds-forest))]/50 disabled:cursor-not-allowed"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      ))}
      </AnimatePresence>

      {samples.length < MAX_SAMPLES && (
        <button
          onClick={() => handleAdd()}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-[hsl(var(--ds-forest))]/40 bg-transparent p-2.5 text-xs font-semibold text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-forest))]/5 transition"
        >
          <Plus className="w-3.5 h-3.5" /> Ajouter un prélèvement (max {MAX_SAMPLES})
        </button>
      )}


      {parcelles.length === 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-[hsl(var(--ds-forest))]/8 border border-[hsl(var(--ds-line))] p-2.5 text-[11px] text-[hsl(var(--ds-forest-deep))]/75 leading-snug">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            Astuce : renseignez vos parcelles cadastrales dans l'onglet <strong>Portrait › Cadastre</strong> pour recentrer automatiquement la carte sur votre propriété.
          </span>
        </div>
      )}
    </div>
  );

  return (
    <AnalyzeCard
      number={2}
      category="Étape 2 · Prélèvements"
      title={`${MIN_SAMPLES} à ${MAX_SAMPLES} échantillons représentatifs`}
      subtitle="Positionnez chaque prélèvement sur la carte de votre propriété. Glissez pour ajuster, cliquez sur la carte pour ajouter un point."
      index={index}
    >
      <style>{`@keyframes soil-sample-pulse{0%{transform:translate(-50%,-50%) scale(.6);opacity:.9}70%{transform:translate(-50%,-50%) scale(2.2);opacity:0}100%{opacity:0}}`}</style>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[hsl(var(--ds-forest-deep))]/70 mb-2">
        <span className="inline-flex items-center gap-1"><Move3D className="w-3 h-3" /> Glissez les pastilles</span>
        <span className="opacity-40">•</span>
        <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> Cliquez la carte pour ajouter</span>
        <span className="ml-auto font-semibold text-[hsl(var(--ds-forest))]">{samples.length} / {MAX_SAMPLES}</span>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        <div className="md:col-span-3 space-y-1.5">
          {!fullscreen && mapNode(400)}
          {fullscreen && (
            <div className="rounded-2xl border border-dashed border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/40 h-[400px] flex items-center justify-center text-[hsl(var(--ds-forest-deep))]/50 text-sm">
              Carte affichée en plein écran…
            </div>
          )}
          <div className="flex items-center justify-center gap-4 text-[10px] text-[hsl(var(--ds-forest-deep))]/60">
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--ds-cream))] border border-[hsl(var(--ds-forest))]" /> Prélèvement</span>
          </div>
        </div>

        <div className="md:col-span-2">{sidePanel}</div>
      </div>

      {/* Fullscreen portal */}
      {fullscreen && createPortal(
        <AnimatePresence>
          <motion.div
            key="samples-fs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[2000] bg-[hsl(var(--ds-cream))] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Carte des prélèvements plein écran"
          >
            <header className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/95 backdrop-blur">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] flex items-center justify-center font-serif font-bold shadow-sm">
                2
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-[hsl(var(--ds-forest))]/70">Étape 2 · Prélèvements</div>
                <div className="font-serif text-lg text-[hsl(var(--ds-forest-deep))] truncate">{MIN_SAMPLES} à {MAX_SAMPLES} échantillons représentatifs</div>
              </div>
              <span className="ml-auto text-sm font-semibold text-[hsl(var(--ds-forest))]">{samples.length} / {MAX_SAMPLES}</span>
              <button
                onClick={() => setFullscreen(false)}
                aria-label="Fermer le plein écran"
                className="w-10 h-10 rounded-full bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] flex items-center justify-center hover:bg-[hsl(var(--ds-forest-deep))] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className="flex-1 min-h-0 p-3 md:p-4">
                {mapNode('100%')}
              </div>
              <aside className="w-full md:w-[360px] md:flex-shrink-0 border-t md:border-t-0 md:border-l border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 overflow-y-auto p-3 md:p-4 max-h-[45vh] md:max-h-none">
                {sidePanel}
              </aside>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body,
      )}
      <SampleDeleteDialog
        sample={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </AnalyzeCard>

  );
};

export default SamplesMapBlock;
