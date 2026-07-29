import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GeoJSON, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { Maximize2, Minimize2, X, ShieldCheck, MapPin } from 'lucide-react';

import { RichMap } from '@/components/maps';
import { useProprieteParcelles, useCanCurateParcelles } from '@/hooks/propriete/usePropertyParcelles';
import { useProprieteZones } from '@/hooks/propriete/usePropertyZones';
import { buildGeofence, evaluateGeofence, GEOFENCE_LABELS } from '@/lib/geofence';
import { useWaypointFrenchNames } from '@/hooks/propriete/useWaypointFrenchNames';
import ObservationPopupCard from '@/components/propriete/species/ObservationPopupCard';
import { RevealPhotoLightbox } from '@/components/propriete/identify/blocks/RevealPhotoLightbox';

import GpsControlConsole, { type GpsCandidate } from '@/components/propriete/gps/GpsControlConsole';
import type { PropertyWaypoint } from '@/hooks/propriete/usePropertySpeciesPool';

interface Props {
  proprieteId?: string;
  /** Espèce refusée localisée */
  latin: string;
  label: string;
  occurrences: PropertyWaypoint[];
  /** Tous les points de la propriété (contexte pâle + candidats de la console GPS) */
  allWaypoints: PropertyWaypoint[];
  center?: [number, number] | null;
  onClose?: () => void;
}

const REFUS = '#8c3a2e';

const refusIcon = (dim = false) =>
  L.divIcon({
    className: 'palette-refus-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: dim
      ? `<div style="width:10px;height:10px;border-radius:50%;background:#5f6b5f;opacity:.28"></div>`
      : `<div style="width:18px;height:18px;border-radius:50%;background:${REFUS};border:2px solid #FAF8F3;box-shadow:0 0 0 3px ${REFUS}44, 0 2px 6px rgba(0,0,0,.35)"></div>`,
  });

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

/**
 * Carte « où pousse ce que l'on écarte » — mêmes primitives que la Carte des
 * révélations (étape 3) : parcelles, géofence, plein écran, curation GPS.
 */
export const ExcludedSpeciesMap: React.FC<Props> = ({
  proprieteId,
  latin,
  label,
  occurrences,
  allWaypoints,
  center,
  onClose,
}) => {
  const { data: parcelles } = useProprieteParcelles(proprieteId);
  const { data: canCurate } = useCanCurateParcelles(proprieteId);
  const { zones } = useProprieteZones(proprieteId);

  const [fullscreen, setFullscreen] = useState(false);
  const [gpsConsole, setGpsConsole] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [lightboxId, setLightboxId] = useState<string | null>(null);


  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  const fence = useMemo(() => buildGeofence(parcelles ?? []), [parcelles]);
  const bufferM = 25;

  const annotate = (list: PropertyWaypoint[]): GpsCandidate[] =>
    list.map((w) => {
      const ev = evaluateGeofence(fence, w.lat, w.lng, bufferM);
      return { ...w, geofenceStatus: ev.status, geofenceDistanceM: ev.distanceM };
    });

  const points = useMemo(() => annotate(occurrences), [occurrences, fence]);
  const allCandidates = useMemo(() => annotate(allWaypoints), [allWaypoints, fence]);

  const { displayNameFor } = useWaypointFrenchNames(allWaypoints);


  const drawnParcelles = useMemo(
    () => (parcelles ?? []).filter((p) => p.geometry?.coordinates),
    [parcelles],
  );

  const bounds = useMemo<Array<[number, number]>>(() => {
    const pts: Array<[number, number]> = points.map((w) => [w.lat, w.lng]);
    if (pts.length < 2 && center) pts.push(center);
    return pts;
  }, [points, center]);

  const mapCenter: [number, number] =
    points[0] ? [points[0].lat, points[0].lng] : center ?? [45.0, 0.5];

  const outside = points.filter((p) => p.geofenceStatus === 'outside').length;

  const mapNode = (height: number | string) => (
    <div
      className="relative rounded-2xl overflow-hidden border border-[#e2c7c1]"
      style={{ height }}
    >
      <RichMap
        center={mapCenter}
        zoom={16}
        bounds={bounds.length > 1 ? bounds : undefined}
        fitMaxZoom={18}
        fitPadding={[50, 50]}
        controls={{ zoom: true, style: true, geolocate: false, cadastre: true }}
        maxZoom={22}
        height="100%"
      >
        {drawnParcelles.map((p) => (
          <GeoJSON
            key={`refus-parcelle-${p.id}`}
            data={p.geometry as any}
            style={{ color: '#2f5d3a', weight: 2, opacity: 0.85, fillColor: '#10b981', fillOpacity: 0.06 }}
          />
        ))}

        {zones.map((z) => (
          <GeoJSON
            key={`refus-zone-${z.id}`}
            data={z.geometry as any}
            style={{
              color: z.couleur || '#b08d57',
              weight: 2,
              dashArray: '5 4',
              opacity: 0.95,
              fillColor: z.couleur || '#b08d57',
              fillOpacity: 0.12,
            }}
          >
            <Tooltip sticky>
              <span style={{ fontSize: 11 }}>Emplacement · {z.nom}</span>
            </Tooltip>
          </GeoJSON>
        ))}

        {/* Contexte : les autres observations restent visibles, en fantôme */}
        {allCandidates
          .filter((w) => !points.some((p) => p.id === w.id))
          .map((w) => (
            <Marker
              key={`ctx-${w.id}`}
              position={[w.lat, w.lng]}
              icon={refusIcon(true)}
              interactive={false}
            />
          ))}

        {points.map((w) => (
          <Marker key={w.id} position={[w.lat, w.lng]} icon={refusIcon(false)}>
            <Popup>
              <ObservationPopupCard
                waypoint={w}
                displayName={displayNameFor(w)}
                canCurate={!!canCurate}
                onZoomPhoto={setLightboxId}
                onOpenGps={(pt) => {
                  setFocusId(pt.id);
                  setGpsConsole(true);
                }}
              />
            </Popup>

          </Marker>
        ))}
      </RichMap>

      <button
        onClick={() => setFullscreen((v) => !v)}
        className="absolute top-3 right-3 z-[500] w-8 h-8 rounded-full bg-[hsl(var(--ds-cream))]/95 border border-[#e2c7c1] flex items-center justify-center text-[#8c3a2e] shadow"
        aria-label={fullscreen ? 'Quitter le plein écran' : 'Plein écran'}
      >
        {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
    </div>
  );

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2 mb-2">
      <span className="text-[11px] font-semibold text-[#7a3126] flex items-center gap-1">
        <MapPin className="w-3.5 h-3.5" /> {label}
        <span className="font-normal opacity-70">· {points.length} point{points.length > 1 ? 's' : ''}</span>
      </span>
      {outside > 0 && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f6e2dd] text-[#8c3a2e]">
          {outside} hors périmètre
        </span>
      )}
      {zones.length > 0 && (
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))]">
          {zones.length} emplacement{zones.length > 1 ? 's' : ''} superposé{zones.length > 1 ? 's' : ''}
        </span>
      )}
      {canCurate && (
        <button
          onClick={() => {
            setFocusId(points[0]?.id ?? null);
            setGpsConsole(true);
          }}
          className="ml-auto text-[11px] px-2.5 py-1 rounded-full border border-[#8c3a2e] text-[#8c3a2e] flex items-center gap-1 hover:bg-[#8c3a2e] hover:text-white transition"
        >
          <ShieldCheck className="w-3 h-3" /> Repositionner
        </button>
      )}
    </div>
  );

  const console_ = gpsConsole ? (
    <GpsControlConsole
      open={gpsConsole}
      onClose={() => setGpsConsole(false)}
      proprieteId={proprieteId}
      candidates={allCandidates}
      contextCandidates={points}
      contextLabel={`Refus : ${latin}`}
      parcelRings={fence.rings}
      center={mapCenter}
      focusId={focusId}
      displayNameFor={displayNameFor}
    />
  ) : null;

  const lightbox = lightboxId ? (
    <div className="fixed inset-0 z-[9500]">
      <RevealPhotoLightbox
        items={points}
        currentId={lightboxId}
        onChange={setLightboxId}
        onClose={() => setLightboxId(null)}
        displayNameFor={displayNameFor}
      />
    </div>
  ) : null;


  if (fullscreen) {
    return createPortal(
      <div className="fixed inset-0 z-[9000] bg-[hsl(var(--ds-cream))] p-3 md:p-5 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-serif text-[15px] text-[#7a3126]">{label}</span>
          <span className="italic text-[12px] text-[#8c3a2e]/70">{latin}</span>
          <button
            onClick={() => setFullscreen(false)}
            className="ml-auto w-8 h-8 rounded-full border border-[#e2c7c1] flex items-center justify-center text-[#8c3a2e]"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {toolbar}
        <div className="flex-1 min-h-0">{mapNode('100%')}</div>
        {console_}
      </div>,
      document.body,
    );
  }

  return (
    <div className="mt-3">
      {toolbar}
      {mapNode(320)}
      {console_}
      {onClose && (
        <button
          onClick={onClose}
          className="mt-2 text-[11px] text-[#8c3a2e]/70 underline underline-offset-2"
        >
          Masquer la carte
        </button>
      )}
    </div>
  );
};

export default ExcludedSpeciesMap;
