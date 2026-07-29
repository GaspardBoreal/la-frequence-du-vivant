import React from 'react';
import { Camera } from 'lucide-react';
import type { PropertyWaypoint } from '@/hooks/propriete/usePropertySpeciesPool';
import { GEOFENCE_LABELS } from '@/lib/geofence';
import type { GeofenceStatus } from '@/lib/geofence';

export interface ObservationPopupWaypoint extends PropertyWaypoint {
  geofenceStatus?: GeofenceStatus;
  geofenceDistanceM?: number | null;
}

interface Props {
  waypoint: ObservationPopupWaypoint;
  displayName: string;
  canCurate?: boolean;
  /** Ouvre la visionneuse plein écran sur cette observation. */
  onZoomPhoto?: (id: string) => void;
  /** Ouvre la console de contrôle GPS centrée sur ce point. */
  onOpenGps?: (w: ObservationPopupWaypoint) => void;
}

/**
 * Fiche espèce partagée par toutes les cartes d'observations d'une propriété.
 * Nom français en tête, latin, photo agrandissable, provenance, statut de curation.
 */
export const ObservationPopupCard: React.FC<Props> = ({
  waypoint: w,
  displayName,
  canCurate,
  onZoomPhoto,
  onOpenGps,
}) => (
  <div style={{ minWidth: 170 }}>
    {w.photoUrl &&
      (onZoomPhoto ? (
        <button
          type="button"
          onClick={() => onZoomPhoto(w.id)}
          title="Agrandir la photo"
          style={{
            display: 'block',
            width: '100%',
            padding: 0,
            border: 'none',
            background: 'none',
            cursor: 'zoom-in',
          }}
        >
          <img
            src={w.photoUrl}
            alt={displayName}
            loading="lazy"
            style={{
              width: '100%',
              height: 100,
              objectFit: 'cover',
              borderRadius: 6,
              marginBottom: 4,
            }}
          />
          <span style={{ fontSize: 10, color: '#2f5d3a', display: 'block', marginBottom: 4 }}>
            🔍 Cliquer pour agrandir
          </span>
        </button>
      ) : (
        <img
          src={w.photoUrl}
          alt={displayName}
          loading="lazy"
          style={{
            width: '100%',
            height: 100,
            objectFit: 'cover',
            borderRadius: 6,
            marginBottom: 6,
          }}
        />
      ))}

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

    {canCurate && onOpenGps && (
      <button
        type="button"
        onClick={() => onOpenGps(w)}
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
        ✥ Déplacer ce point (Contrôle GPS)
      </button>
    )}
  </div>
);

export default ObservationPopupCard;
