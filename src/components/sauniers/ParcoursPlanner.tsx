import React from 'react';
import { createPortal } from 'react-dom';
import { Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Check,
  GripVertical,
  Loader2,
  MapPin,
  Plus,
  RotateCcw,
  Trash2,
  Waves,
  Footprints,
  X,
  Maximize2,
  Minimize2,
  List,
} from 'lucide-react';
import PointWidget from './PointWidget';
import { fullscreenSurfaces } from '@/lib/uiOverlayLevel';
import RichMap from '@/components/maps/RichMap';
import { haversineM } from '@/utils/geoDistance';
import { toast } from 'sonner';
import {
  PARCOURS_PROPOSE,
  SAUNIERS_CENTRE,
  SAUNIERS_EVENT_LABEL,
  SEGMENT_LABEL,
  SEGMENT_MARCHE_NOM,
  type PointPropose,
  type Segment,
} from '@/content/sauniers/parcoursPropose';
import {
  useGenerateParcours,
  useIsAdminUser,
  useMarchesExistantes,
  distanceKm,
} from '@/hooks/sauniers/useGenerateParcours';

const STORAGE_KEY = 'sauniers-parcours-v1';
const DATE_MARCHE = '2026-09-12';
const VITESSE_KMH = 3;

interface PointEtat extends PointPropose {
  actif: boolean;
  manuel?: boolean;
}

const initialState = (): PointEtat[] =>
  PARCOURS_PROPOSE.map((p) => ({ ...p, actif: true }));

function load(): PointEtat[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as PointEtat[];
    if (!Array.isArray(parsed) || parsed.length === 0) return initialState();
    return parsed;
  } catch {
    return initialState();
  }
}

/* ------------------------------- marqueurs ------------------------------- */

const pinIcon = (num: number, actif: boolean, segment: Segment) =>
  L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;
      font:700 12px/1 ui-sans-serif,system-ui;color:#fff;cursor:grab;
      background:${actif ? (segment === 'amont' ? 'linear-gradient(135deg,#10b981,#047857)' : 'linear-gradient(135deg,#38bdf8,#0369a1)') : '#6b7280'};
      border:2px solid rgba(255,255,255,.9);
      box-shadow:0 2px 10px rgba(0,0,0,.45);opacity:${actif ? 1 : 0.55}">${num}</div>`,
  });

const ClickToAdd: React.FC<{ enabled: boolean; onAdd: (lat: number, lng: number) => void }> = ({
  enabled,
  onAdd,
}) => {
  useMapEvents({
    click: (e) => {
      if (enabled) onAdd(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const InvalidateOnResize: React.FC<{ dep: unknown }> = ({ dep }) => {
  const map = useMap();
  React.useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 220);
    return () => clearTimeout(t);
  }, [dep, map]);
  return null;
};

/* --------------------------------- liste --------------------------------- */

const Ligne: React.FC<{
  point: PointEtat;
  numero: number | null;
  editable: boolean;
  onToggle: () => void;
  onSegment: () => void;
  onRename: (nom: string) => void;
  onDelete: () => void;
}> = ({ point, numero, editable, onToggle, onSegment, onRename, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: point.id,
    disabled: !editable,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}
      className={`flex items-start gap-2.5 rounded-2xl border p-3 backdrop-blur-sm transition-colors ${
        point.actif
          ? 'border-emerald-500/25 bg-emerald-950/25'
          : 'border-border/30 bg-card/20 opacity-60'
      }`}
    >
      {editable && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Déplacer dans l’ordre"
          className="mt-1 cursor-grab text-muted-foreground/60 hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      <button
        type="button"
        onClick={onToggle}
        disabled={!editable}
        aria-label={point.actif ? 'Retirer ce point' : 'Retenir ce point'}
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ${
          point.actif
            ? point.segment === 'amont'
              ? 'bg-emerald-600 text-white'
              : 'bg-sky-600 text-white'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {numero ?? '–'}
      </button>

      <div className="min-w-0 flex-1">
        {editable ? (
          <input
            value={point.nom}
            onChange={(e) => onRename(e.target.value)}
            className="w-full bg-transparent text-[14px] font-semibold text-foreground outline-none focus:underline"
          />
        ) : (
          <div className="text-[14px] font-semibold text-foreground">{point.nom}</div>
        )}
        <div className="text-[11px] text-muted-foreground">{point.sous}</div>
        <div className="mt-1 font-mono text-[10px] text-muted-foreground/70">
          {point.lat.toFixed(5)} / {point.lng.toFixed(5)}
        </div>
      </div>

      {editable && (
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <button
            type="button"
            onClick={onSegment}
            className="rounded-full border border-border/40 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
          >
            {point.segment === 'amont' ? 'Village' : 'Marais'}
          </button>
          {point.manuel && (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Supprimer ce point"
              className="text-muted-foreground/60 hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* --------------------------------- planner -------------------------------- */

const ParcoursPlanner: React.FC = () => {
  const [points, setPoints] = React.useState<PointEtat[]>(load);
  const [ajoutActif, setAjoutActif] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState(false);
  const [remplacer, setRemplacer] = React.useState(false);
  const [plein, setPlein] = React.useState(false);
  const [selId, setSelId] = React.useState<string | null>(null);
  const [placement, setPlacement] = React.useState(false);
  const [listeOuverte, setListeOuverte] = React.useState(true);
  const undoRef = React.useRef<{ id: string; lat: number; lng: number } | null>(null);
  const [peutAnnuler, setPeutAnnuler] = React.useState(false);

  const { data: estAdmin } = useIsAdminUser();
  const { data: marchesExistantes = [] } = useMarchesExistantes();
  const generer = useGenerateParcours();
  const editable = estAdmin === true;

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
  }, [points]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const retenus = points.filter((p) => p.actif);
  const numeroDe = (id: string) => {
    const i = retenus.findIndex((p) => p.id === id);
    return i === -1 ? null : i + 1;
  };

  const parSegment = (s: Segment) => retenus.filter((p) => p.segment === s);

  const totalKm = React.useMemo(() => {
    let m = 0;
    for (let i = 0; i < retenus.length - 1; i++) {
      m += haversineM(retenus[i].lat, retenus[i].lng, retenus[i + 1].lat, retenus[i + 1].lng);
    }
    return m / 1000;
  }, [retenus]);

  const dureeMin = Math.round((totalKm / VITESSE_KMH) * 60);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setPoints((prev) => {
      const from = prev.findIndex((p) => p.id === active.id);
      const to = prev.findIndex((p) => p.id === over.id);
      return arrayMove(prev, from, to);
    });
  };

  const ajouter = (lat: number, lng: number) => {
    const id = `manuel-${Date.now()}`;
    setPoints((prev) => [
      ...prev,
      {
        id,
        segment: 'aval',
        nom: 'Nouveau point',
        sous: 'Ajouté à la main',
        texte: '',
        lat,
        lng,
        actif: true,
        manuel: true,
      },
    ]);
    setAjoutActif(false);
    setSelId(id);
    toast.success('Point ajouté — nommez-le dans la liste.');
  };

  const deplacer = (id: string, lat: number, lng: number) => {
    const avant = points.find((p) => p.id === id);
    if (avant) {
      undoRef.current = { id, lat: avant.lat, lng: avant.lng };
      setPeutAnnuler(true);
    }
    setPoints((prev) => prev.map((q) => (q.id === id ? { ...q, lat, lng } : q)));
  };

  const annulerDeplacement = () => {
    const u = undoRef.current;
    if (!u) return;
    setPoints((prev) => prev.map((q) => (q.id === u.id ? { ...q, lat: u.lat, lng: u.lng } : q)));
    undoRef.current = null;
    setPeutAnnuler(false);
  };

  const selection = points.find((p) => p.id === selId) ?? null;
  const distancePrecedent = React.useMemo(() => {
    if (!selection || !selection.actif) return null;
    const i = retenus.findIndex((p) => p.id === selection.id);
    if (i <= 0) return null;
    return haversineM(retenus[i - 1].lat, retenus[i - 1].lng, selection.lat, selection.lng);
  }, [selection, retenus]);

  React.useEffect(() => {
    if (!plein) return;
    fullscreenSurfaces.push();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selId) setSelId(null);
        else setPlein(false);
      }
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      fullscreenSurfaces.pop();
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [plein, selId]);

  const lancerGeneration = () => {
    const segments = (['amont', 'aval'] as Segment[])
      .map((segment) => ({
        segment,
        points: parSegment(segment).map((p) => ({ nom: p.nom, lat: p.lat, lng: p.lng })),
      }))
      .filter((s) => s.points.length > 0);

    generer.mutate(
      { dateMarche: DATE_MARCHE, segments, remplacer },
      {
        onSuccess: (creees) => {
          setConfirmation(false);
          toast.success(
            `${creees.length} marche${creees.length > 1 ? 's' : ''} créée${creees.length > 1 ? 's' : ''} pour ${SAUNIERS_EVENT_LABEL}.`,
          );
        },
        onError: (e: any) => toast.error(e?.message ?? 'La génération a échoué.'),
      },
    );
  };

  const bounds = retenus.length > 0
    ? retenus.map((p) => [p.lat, p.lng] as [number, number])
    : undefined;

  const carte = (hauteur: string | number) => (
    <RichMap
      key={plein ? 'plein' : 'inline'}
      center={SAUNIERS_CENTRE}
      zoom={14}
      bounds={bounds}
      fitPadding={[50, 50]}
      initialStyle="satellite"
      controls={{ zoom: true, style: true, geolocate: false }}
      height={hauteur}
      marcheRoute={{
        steps: [],
        polylinePositions: retenus.map((p) => [p.lat, p.lng] as [number, number]),
        renderMarkers: false,
      }}
    >
      <InvalidateOnResize dep={`${plein}-${listeOuverte}`} />
      <ClickToAdd
        enabled={editable && (ajoutActif || placement)}
        onAdd={(lat, lng) => {
          if (placement && selId) {
            deplacer(selId, lat, lng);
            setPlacement(false);
            return;
          }
          if (ajoutActif) ajouter(lat, lng);
        }}
      />
      {points.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={pinIcon(numeroDe(p.id) ?? 0, p.actif, p.segment)}
          draggable={editable}
          eventHandlers={{
            click: () => {
              setSelId(p.id);
              setPlacement(false);
            },
            dragend: (e: any) => {
              const ll = e.target.getLatLng();
              deplacer(p.id, ll.lat, ll.lng);
              setSelId(p.id);
            },
          }}
        >
          <Tooltip direction="top" offset={[0, -14]}>
            <span className="text-xs font-medium">{p.nom}</span>
          </Tooltip>
        </Marker>
      ))}
    </RichMap>
  );

  const widget = selection ? (
    <PointWidget
      point={selection}
      numero={numeroDe(selection.id)}
      distancePrecedent={distancePrecedent}
      editable={editable}
      placementActif={placement}
      peutAnnuler={peutAnnuler}
      onPlacement={() => setPlacement((v) => !v)}
      onAnnuler={annulerDeplacement}
      onSegment={() =>
        setPoints((prev) =>
          prev.map((q) =>
            q.id === selection.id
              ? { ...q, segment: q.segment === 'amont' ? 'aval' : 'amont' }
              : q,
          ),
        )
      }
      onClose={() => {
        setSelId(null);
        setPlacement(false);
      }}
    />
  ) : null;

  const listeJSX = (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={points.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {points.map((p) => (
            <div key={p.id} onClick={() => setSelId(p.id)} role="presentation">
              <Ligne
                point={p}
                numero={numeroDe(p.id)}
                editable={editable}
                onToggle={() =>
                  setPoints((prev) =>
                    prev.map((q) => (q.id === p.id ? { ...q, actif: !q.actif } : q)),
                  )
                }
                onSegment={() =>
                  setPoints((prev) =>
                    prev.map((q) =>
                      q.id === p.id
                        ? { ...q, segment: q.segment === 'amont' ? 'aval' : 'amont' }
                        : q,
                    ),
                  )
                }
                onRename={(nom) =>
                  setPoints((prev) => prev.map((q) => (q.id === p.id ? { ...q, nom } : q)))
                }
                onDelete={() => setPoints((prev) => prev.filter((q) => q.id !== p.id))}
              />
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );

  const barreOutils = (
    <div className="pointer-events-auto flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-3 rounded-full bg-background/85 px-4 py-2 text-[11px] shadow-lg backdrop-blur">
        <span className="font-semibold tabular-nums text-emerald-300">{retenus.length} pts</span>
        <span className="font-semibold tabular-nums text-sky-300">{totalKm.toFixed(1)} km</span>
        <span className="tabular-nums text-muted-foreground">
          {Math.floor(dureeMin / 60)} h {String(dureeMin % 60).padStart(2, '0')}
        </span>
      </div>
      {editable && (
        <button
          type="button"
          onClick={() => {
            setAjoutActif((v) => !v);
            setPlacement(false);
          }}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-semibold shadow-lg backdrop-blur transition-colors ${
            ajoutActif ? 'bg-amber-500 text-slate-900' : 'bg-background/85 text-foreground'
          }`}
        >
          {ajoutActif ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {ajoutActif ? 'Cliquez sur la carte' : 'Ajouter'}
        </button>
      )}
      <button
        type="button"
        onClick={() => setListeOuverte((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3.5 py-2 text-[11px] font-semibold text-foreground shadow-lg backdrop-blur"
      >
        <List className="h-3.5 w-3.5" /> {listeOuverte ? 'Masquer' : 'Liste'}
      </button>
      {editable && (
        <button
          type="button"
          onClick={() => setConfirmation(true)}
          disabled={retenus.length === 0}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-2 text-[11px] font-semibold text-white shadow-lg hover:bg-emerald-500 disabled:opacity-40"
        >
          <MapPin className="h-3.5 w-3.5" /> Générer
        </button>
      )}
      <button
        type="button"
        onClick={() => setPlein(false)}
        className="inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3.5 py-2 text-[11px] font-semibold text-foreground shadow-lg backdrop-blur"
      >
        <Minimize2 className="h-3.5 w-3.5" /> Quitter
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Carte */}
      <div className="relative overflow-hidden rounded-3xl border border-border/40">
        {!plein && carte(420)}
        {!plein && widget}
        <button
          type="button"
          onClick={() => setPlein(true)}
          className="absolute bottom-4 left-4 z-[700] inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3.5 py-2 text-[11px] font-semibold text-foreground shadow-lg backdrop-blur hover:bg-background"
        >
          <Maximize2 className="h-3.5 w-3.5" /> Plein écran
        </button>
      </div>


      {/* Compteurs */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { v: `${retenus.length}`, l: 'points retenus' },
          { v: `${totalKm.toFixed(1)} km`, l: 'tracé cumulé' },
          { v: `${Math.floor(dureeMin / 60)} h ${String(dureeMin % 60).padStart(2, '0')}`, l: 'marche à 3 km/h' },
        ].map((c) => (
          <div
            key={c.l}
            className="rounded-2xl border border-emerald-500/20 bg-emerald-950/30 px-3 py-3 text-center backdrop-blur-sm"
          >
            <div className="text-lg font-semibold tabular-nums text-emerald-300">{c.v}</div>
            <div className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{c.l}</div>
          </div>
        ))}
      </div>

      {editable && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAjoutActif((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
              ajoutActif
                ? 'bg-amber-500 text-slate-900'
                : 'border border-border/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            {ajoutActif ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {ajoutActif ? 'Cliquez sur la carte…' : 'Ajouter un point'}
          </button>
          <button
            type="button"
            onClick={() => {
              setPoints(initialState());
              toast.info('Parcours réinitialisé.');
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/40 px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser
          </button>
        </div>
      )}

      {/* Liste ordonnable */}
      {listeJSX}

      {/* Répartition */}
      <div className="grid gap-2 sm:grid-cols-2">
        {(['amont', 'aval'] as Segment[]).map((s) => (
          <div key={s} className="rounded-2xl border border-border/40 bg-card/30 p-3.5">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
              {s === 'amont' ? (
                <Footprints className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Waves className="h-3.5 w-3.5 text-sky-400" />
              )}
              {SEGMENT_LABEL[s]}
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {parSegment(s).length} point{parSegment(s).length > 1 ? 's' : ''} ·{' '}
              {distanceKm(parSegment(s).map((p) => ({ nom: p.nom, lat: p.lat, lng: p.lng })))} km
            </p>
          </div>
        ))}
      </div>

      {editable && (
        <>
          {marchesExistantes.length > 0 && (
            <label className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3.5 text-[12px] text-amber-100/90">
              <input
                type="checkbox"
                checked={remplacer}
                onChange={(e) => setRemplacer(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                {marchesExistantes.length} marche{marchesExistantes.length > 1 ? 's' : ''} de ce
                parcours existe{marchesExistantes.length > 1 ? 'nt' : ''} déjà. Cochez pour la
                {marchesExistantes.length > 1 ? 's' : ''} remplacer plutôt que créer un doublon.
              </span>
            </label>
          )}

          <button
            type="button"
            onClick={() => setConfirmation(true)}
            disabled={retenus.length === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
          >
            <MapPin className="h-4 w-4" /> Générer les marches de l’événement
          </button>
        </>
      )}

      {!editable && (
        <p className="rounded-2xl border border-border/40 bg-card/30 p-3.5 text-[12px] leading-relaxed text-muted-foreground">
          Ce parcours est une proposition de travail. Les repères posés sur la carte restent
          approximatifs et seront corrigés sur le terrain avec la coopérative.
        </p>
      )}

      {/* Confirmation */}
      {confirmation && (
        <div
          className="fixed inset-0 z-[1200] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => !generer.isPending && setConfirmation(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-emerald-500/25 bg-background p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-crimson text-2xl text-foreground">Confirmer la génération</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Pour {SAUNIERS_EVENT_LABEL}, seront créés :
            </p>
            <ul className="mt-3 space-y-2">
              {(['amont', 'aval'] as Segment[])
                .filter((s) => parSegment(s).length > 0)
                .map((s) => (
                  <li
                    key={s}
                    className="rounded-2xl border border-border/40 bg-card/40 px-3.5 py-2.5 text-[12px]"
                  >
                    <div className="font-semibold text-foreground">{SEGMENT_MARCHE_NOM[s]}</div>
                    <div className="text-muted-foreground">
                      départ « {parSegment(s)[0].nom} » · {parSegment(s).length - 1} point
                      {parSegment(s).length - 1 > 1 ? 's' : ''} intermédiaire
                      {parSegment(s).length - 1 > 1 ? 's' : ''}
                    </div>
                  </li>
                ))}
            </ul>
            {remplacer && (
              <p className="mt-3 text-[12px] text-amber-300">
                Les marches homonymes existantes seront supprimées avant recréation.
              </p>
            )}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmation(false)}
                disabled={generer.isPending}
                className="flex-1 rounded-full border border-border/40 px-4 py-3 text-sm text-muted-foreground hover:text-foreground"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={lancerGeneration}
                disabled={generer.isPending}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {generer.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plein écran */}
      {plein &&
        createPortal(
          <div className="fixed inset-0 z-[3000] bg-[#050a09]">
            <div className="absolute inset-0">{carte('100%')}</div>

            <div className="pointer-events-none absolute inset-x-0 top-0 z-[800] flex justify-center p-3">
              {barreOutils}
            </div>

            {listeOuverte && (
              <div className="absolute inset-x-0 bottom-0 z-[750] max-h-[45%] overflow-y-auto border-t border-emerald-500/20 bg-background/92 p-3 backdrop-blur-xl sm:inset-y-0 sm:right-auto sm:left-0 sm:max-h-none sm:w-[330px] sm:border-r sm:border-t-0 sm:pt-24">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300/90">
                    Ordre du parcours
                  </span>
                  <button
                    type="button"
                    onClick={() => setListeOuverte(false)}
                    aria-label="Masquer la liste"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {listeJSX}
              </div>
            )}

            {widget}
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ParcoursPlanner;
