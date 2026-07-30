import React from 'react';
import { Camera } from 'lucide-react';
import type { PropertyWaypoint } from '@/hooks/propriete/usePropertySpeciesPool';
import { GEOFENCE_LABELS } from '@/lib/geofence';
import type { GeofenceStatus } from '@/lib/geofence';
import ObservationPhotoStrip from './ObservationPhotoStrip';

export interface ObservationPopupWaypoint extends PropertyWaypoint {
  geofenceStatus?: GeofenceStatus;
  geofenceDistanceM?: number | null;
}

interface Props {
  waypoint: ObservationPopupWaypoint;
  displayName: string;
  canCurate?: boolean;
  /** Autres photos terrain de la même espèce sur la propriété. */
  walkerPhotos?: (string | null | undefined)[];
  kingdom?: string | null;
  iconicTaxon?: string | null;
  /** Ouvre la visionneuse plein écran sur cette observation. */
  onZoomPhoto?: (id: string) => void;
  /** Repositionne le point directement dans la carte courante (zoom conservé). */
  onStartInlineMove?: (w: ObservationPopupWaypoint) => void;
  /** Ouvre la console de contrôle GPS centrée sur ce point (revue en lot). */
  onOpenGps?: (w: ObservationPopupWaypoint) => void;
}


/**
 * Fiche espèce partagée par toutes les cartes d'observations d'une propriété.
 * Nom français en tête, latin, bande photo (marcheurs + iNaturalist), provenance,
 * statut de curation.
 */
export const ObservationPopupCard: React.FC<Props> = ({
  waypoint: w,
  displayName,
  canCurate,
  walkerPhotos,
  kingdom,
  iconicTaxon,
  onZoomPhoto,
  onStartInlineMove,
  onOpenGps,
}) => (

  <div style={{ minWidth: 200 }}>
    <ObservationPhotoStrip
      scientificName={w.scientificName}
      displayName={displayName}
      walkerPhotos={[w.photoUrl, ...(walkerPhotos || [])]}
      kingdom={kingdom}
      iconicTaxon={iconicTaxon}
      onZoomWalker={onZoomPhoto ? () => onZoomPhoto(w.id) : undefined}
    />


    <div style={{ fontWeight: 600, fontSize: 12 }}>{displayName}</div>
    <div style={{ fontSize: 10, fontStyle: 'italic', color: '#666' }}>{w.scientificName}</div>

    <div style={{ fontSize: 10, marginTop: 4, color: '#666' }}>
      {w.source === 'marcheur'
        ? '📷 Observation marcheur'
        : `🌐 Observation citoyenne${w.observerName ? ` · ${w.observerName}` : ''}`}
    </div>

    {w.geofenceStatus === 'outside' && (
      <div style={{ fontSize: 10, marginTop: 2, color: '#b4462f' }}>
        ⚠︎ {GEOFENCE_LABELS.outside}
        {w.geofenceDistanceM ? ` · ${Math.round(w.geofenceDistanceM)} m` : ''}
      </div>
    )}

    {w.overrideStatus === 'repositioned' && (
      <div style={{ fontSize: 10, marginTop: 2, color: '#2f5d3a' }}>
        ✎ Position corrigée par un curateur
      </div>
    )}

    {w.observationDate && (
      <div style={{ fontSize: 10, marginTop: 2, color: '#888' }}>
        <Camera style={{ display: 'inline', width: 10, height: 10, marginRight: 2 }} />
        {new Date(w.observationDate).toLocaleDateString('fr-FR')}
      </div>
    )}

    {canCurate && onStartInlineMove && (
      <button
        type="button"
        onClick={() => onStartInlineMove(w)}
        title="Repositionner sans quitter la carte : le zoom et l'emplacement sont conservés"
        style={{
          marginTop: 8,
          width: '100%',
          fontSize: 10,
          fontWeight: 600,
          padding: '5px 8px',
          borderRadius: 999,
          border: 'none',
          background: '#C9A227',
          color: '#1e2a20',
          cursor: 'pointer',
        }}
      >
        ✥ Déplacer ce point ici
      </button>
    )}

    {canCurate && onOpenGps && (
      <button
        type="button"
        onClick={() => onOpenGps(w)}
        style={{
          marginTop: 5,
          width: '100%',
          fontSize: 9.5,
          padding: '4px 8px',
          borderRadius: 999,
          border: '1px solid rgba(47,93,58,.35)',
          background: 'transparent',
          color: '#2f5d3a',
          cursor: 'pointer',
        }}
      >
        Ouvrir la console de curation
      </button>
    )}

  </div>
);

export default ObservationPopupCard;
