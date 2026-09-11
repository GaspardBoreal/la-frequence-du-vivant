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
  CloudUpload,
  AlertTriangle,
} from 'lucide-react';
import PointWidget from './PointWidget';
import { fullscreenSurfaces } from '@/lib/uiOverlayLevel';
import RichMap from '@/components/maps/RichMap';
import { haversineM } from '@/utils/geoDistance';
import { toast } from 'sonner';
import {
  SAUNIERS_CENTRE,
  SAUNIERS_EVENT_LABEL,
  SEGMENT_LABEL,
  SEGMENT_MARCHE_NOM,
  type Segment,
} from '@/content/sauniers/parcoursPropose';
import { useIsAdminUser } from '@/hooks/sauniers/useGenerateParcours';
import useParcoursSauniers, {
  distanceKmDe,
  type ArretParcours,
} from '@/hooks/sauniers/useParcoursSauniers';

const VITESSE_KMH = 3;

/* ------------------------------- marqueurs ------------------------------- */

const pinIcon = (num: number, segment: Segment) =>
  L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;
      font:700 12px/1 ui-sans-serif,system-ui;color:#fff;cursor:grab;
      background:${segment === 'amont' ? 'linear-gradient(135deg,#10b981,#047857)' : 'linear-gradient(135deg,#38bdf8,#0369a1)'};
      border:2px solid rgba(255,255,255,.9);
      box-shadow:0 2px 10px rgba(0,0,0,.45)">${num}</div>`,
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
  point: ArretParcours;
  numero: number;
  editable: boolean;
  onSegment: () => void;
  onRename: (nom: string) => void;
  onDelete: () => void;
}> = ({ point, numero, editable, onSegment, onRename, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: point.id,
    disabled: !editable,
  });
  const [nom, setNom] = React.useState(point.nom);
  React.useEffect(() => setNom(point.nom), [point.nom]);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}
      className="flex items-start gap-2.5 rounded-2xl border border-emerald-500/25 bg-emerald-950/25 p-3 backdrop-blur-sm transition-colors"
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

      <div
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums text-white ${
          point.segment === 'amont' ? 'bg-emerald-600' : 'bg-sky-600'
        }`}
      >
        {numero}
      </div>

      <div className="min-w-0 flex-1">
        {editable ? (
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            onBlur={() => nom.trim() && nom !== point.nom && onRename(nom.trim())}
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
          <button
            type="button"
            onClick={onDelete}
            aria-label="Retirer cet arrêt du parcours"
            className="text-muted-foreground/60 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

/* --------------------------------- planner -------------------------------- */

const ParcoursPlanner: React.FC = () => {
  const { data: estAdmin } = useIsAdminUser();
  const editable = estAdmin === true;

  const parcours = useParcoursSauniers(editable);
  const points = parcours.arrets;

  const [ajoutActif, setAjoutActif] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState(false);
  const [plein, setPlein] = React.useState(false);
  const [selId, setSelId] = React.useState<string | null>(null);
  const [placement, setPlacement] = React.useState(false);
  const [listeOuverte, setListeOuverte] = React.useState(true);
  const undoRef = React.useRef<{ id: string; lat: number; lng: number } | null>(null);
  const [peutAnnuler, setPeutAnnuler] = React.useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const numeroDe = (id: string) => points.findIndex((p) => p.id === id) + 1;
  const parSegment = (s: Segment) => points.filter((p) => p.segment === s);

  const totalKm = React.useMemo(() => {
    let m = 0;
    for (let i = 0; i < points.length - 1; i++) {
      m += haversineM(points[i].lat, points[i].lng, points[i + 1].lat, points[i + 1].lng);
    }
    return m / 1000;
  }, [points]);

  const dureeMin = Math.round((totalKm / VITESSE_KMH) * 60);

  const echec = (e: any) => toast.error(e?.message ?? 'Enregistrement impossible.');
  const ok = () => toast.success('Enregistré', { duration: 1200 });

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = points.findIndex((p) => p.id === active.id);
    const to = points.findIndex((p) => p.id === over.id);
    const ordonnes = arrayMove(points, from, to).map((p) => p.id);
    parcours.reordonner.mutate(ordonnes, { onError: echec, onSuccess: ok });
  };

  const ajouter = (lat: number, lng: number) => {
    setAjoutActif(false);
    parcours.ajouter.mutate(
      { segment: 'aval', nom: 'Nouvel arrêt', lat, lng },
      {
        onError: echec,
        onSuccess: (id) => {
          setSelId(id);
          toast.success('Arrêt ajouté — renommez-le dans la liste.');
        },
      },
    );
  };

  const deplacer = (id: string, lat: number, lng: number) => {
    const avant = points.find((p) => p.id === id);
    if (avant) {
      undoRef.current = { id, lat: avant.lat, lng: avant.lng };
      setPeutAnnuler(true);
    }
    parcours.deplacer.mutate({ id, lat, lng }, { onError: echec, onSuccess: ok });
  };

  const annulerDeplacement = () => {
    const u = undoRef.current;
    if (!u) return;
    parcours.deplacer.mutate(
      { id: u.id, lat: u.lat, lng: u.lng },
      { onError: echec, onSuccess: ok },
    );
    undoRef.current = null;
    setPeutAnnuler(false);
  };

  const selection = points.find((p) => p.id === selId) ?? null;
  const distancePrecedent = React.useMemo(() => {
    if (!selection) return null;
    const i = points.findIndex((p) => p.id === selection.id);
    if (i <= 0) return null;
    return haversineM(points[i - 1].lat, points[i - 1].lng, selection.lat, selection.lng);
  }, [selection, points]);

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

  const bounds = points.length > 0 ? points.map((p) => [p.lat, p.lng] as [number, number]) : undefined;

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
        polylinePositions: points.map((p) => [p.lat, p.lng] as [number, number]),
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
          icon={pinIcon(numeroDe(p.id), p.segment)}
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
        parcours.changerSegment.mutate(selection.id, { onError: echec, onSuccess: ok })
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
                onSegment={() =>
                  parcours.changerSegment.mutate(p.id, { onError: echec, onSuccess: ok })
                }
                onRename={(nom) =>
                  parcours.renommer.mutate({ id: p.id, nom }, { onError: echec, onSuccess: ok })
                }
                onDelete={() =>
                  parcours.supprimer.mutate(p.id, {
                    onError: echec,
                    onSuccess: () => {
                      if (selId === p.id) setSelId(null);
                      toast.success('Arrêt retiré du parcours.');
                    },
                  })
                }
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
        <span className="font-semibold tabular-nums text-emerald-300">{points.length} pts</span>
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
      <button
        type="button"
        onClick={() => setPlein(false)}
        className="inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3.5 py-2 text-[11px] font-semibold text-foreground shadow-lg backdrop-blur"
      >
        <Minimize2 className="h-3.5 w-3.5" /> Quitter
      </button>
    </div>
  );

  /* ------------------------------ progression ----------------------------- */

  const preparation = parcours.chargement || parcours.etat.actif;
  const bandeau = (
    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/30 p-3.5">
      <div className="flex items-center gap-2 text-[12px] font-medium text-emerald-100">
        {parcours.etat.erreur ? (
          <AlertTriangle className="h-4 w-4 text-amber-400" />
        ) : preparation ? (
          <Loader2 className="h-4 w-4 animate-spin text-emerald-300" />
        ) : (
          <Check className="h-4 w-4 text-emerald-400" />
        )}
        {parcours.etat.erreur
          ? `Préparation interrompue : ${parcours.etat.erreur}`
          : parcours.chargement
            ? 'Lecture du parcours…'
            : parcours.etat.libelle}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-900/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-400 transition-all duration-500"
          style={{ width: `${parcours.chargement ? 20 : parcours.etat.progression}%` }}
        />
      </div>
      {parcours.etat.erreur && (
        <button
          type="button"
          onClick={parcours.reessayer}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 px-3 py-1.5 text-[11px] text-amber-200 hover:text-amber-100"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Réessayer
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {(preparation || parcours.etat.erreur) && bandeau}

      {/* Parcours pas encore enregistré */}
      {!parcours.chargement && !parcours.etat.actif && points.length === 0 && (
        <div className="rounded-3xl border border-emerald-500/25 bg-emerald-950/30 p-5 text-center">
          <MapPin className="mx-auto h-6 w-6 text-emerald-400" />
          <h3 className="mt-2 font-crimson text-2xl text-foreground">
            Le parcours n’est pas encore enregistré
          </h3>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
            Les 12 arrêts proposés — 8 dans le village d’Ars-en-Ré, 4 dans le marais — seront
            créés en deux marches rattachées à {SAUNIERS_EVENT_LABEL}.
          </p>
          {editable ? (
            <button
              type="button"
              onClick={parcours.demarrer}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" /> Créer les 12 arrêts
            </button>
          ) : (
            <a
              href="/admin/login"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 px-5 py-3 text-sm font-semibold text-emerald-200 hover:text-emerald-100"
            >
              Se connecter pour créer le parcours
            </a>
          )}
        </div>
      )}

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
        {parcours.enEcriture && (
          <div className="absolute right-4 top-4 z-[700] inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5 text-[11px] text-emerald-300 shadow-lg backdrop-blur">
            <CloudUpload className="h-3.5 w-3.5 animate-pulse" /> Enregistrement…
          </div>
        )}
      </div>

      {/* Compteurs */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { v: `${points.length}`, l: 'arrêts enregistrés' },
          { v: `${totalKm.toFixed(1)} km`, l: 'tracé cumulé' },
          {
            v: `${Math.floor(dureeMin / 60)} h ${String(dureeMin % 60).padStart(2, '0')}`,
            l: 'marche à 3 km/h',
          },
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
            {ajoutActif ? 'Cliquez sur la carte…' : 'Ajouter un arrêt'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmation(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/40 px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Rétablir le parcours proposé
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
              {SEGMENT_MARCHE_NOM[s]} · {parSegment(s).length} arrêt
              {parSegment(s).length > 1 ? 's' : ''} · {distanceKmDe(parSegment(s))} km
            </p>
          </div>
        ))}
      </div>

      <p className="rounded-2xl border border-border/40 bg-card/30 p-3.5 text-[12px] leading-relaxed text-muted-foreground">
        <MapPin className="mr-1 inline h-3.5 w-3.5 text-emerald-400" />
        Ce parcours et ses idées d’animation sont enregistrés avec l’événement{' '}
        <strong className="text-foreground">{SAUNIERS_EVENT_LABEL}</strong>. Les repères restent
        approximatifs et seront corrigés sur le terrain avec la coopérative.
      </p>

      {/* Confirmation de remise à zéro */}
      {confirmation && (
        <div
          className="fixed inset-0 z-[3300] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => !parcours.reinitialiser.isPending && setConfirmation(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-emerald-500/25 bg-background p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-crimson text-2xl text-foreground">Rétablir le parcours proposé</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Les {points.length} arrêts actuels de {SAUNIERS_EVENT_LABEL} seront supprimés, ainsi
              que leurs idées d’animation, puis les 12 arrêts d’origine seront recréés.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmation(false)}
                disabled={parcours.reinitialiser.isPending}
                className="flex-1 rounded-full border border-border/40 px-4 py-3 text-sm text-muted-foreground hover:text-foreground"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() =>
                  parcours.reinitialiser.mutate(undefined, {
                    onError: echec,
                    onSuccess: () => {
                      setConfirmation(false);
                      setSelId(null);
                      parcours.reessayer();
                    },
                  })
                }
                disabled={parcours.reinitialiser.isPending}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {parcours.reinitialiser.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Rétablir
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
