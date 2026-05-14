import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Marker, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair } from 'lucide-react';
import { toast } from 'sonner';

const TRACKING_TIMEOUT_MS = 10 * 60 * 1000;

// ---------- Marker (blue pulsing dot) ----------

interface UserLocationMarkerProps {
  position: [number, number];
  accuracy?: number;
  /** Optional second point for drawing a dashed link line (e.g. nearest step) */
  nearestPosition?: [number, number];
  /** Auto-recenter the map on the user (default true) */
  recenter?: boolean;
}

export const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({
  position,
  accuracy,
  nearestPosition,
  recenter = true,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!recenter) return;
    map.setView(position, Math.max(map.getZoom(), 13), { animate: true });
  }, [position, map, recenter]);

  const gpsDotIcon = L.divIcon({
    className: 'user-gps-marker',
    html: `
      <div style="position:relative;width:20px;height:20px;">
        <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(56,189,248,0.15);animation:gps-pulse 2s ease-out infinite;"></div>
        <div style="width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#38bdf8,#0ea5e9);border:3px solid white;box-shadow:0 2px 8px rgba(56,189,248,0.5);"></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  const radius = accuracy && accuracy > 10 ? accuracy : 100;

  return (
    <>
      <Circle
        center={position}
        radius={radius}
        pathOptions={{ color: '#38bdf8', fillColor: '#38bdf8', fillOpacity: 0.08, weight: 1, opacity: 0.3 }}
      />
      <Marker position={position} icon={gpsDotIcon} />
      {nearestPosition && (
        <Polyline
          positions={[position, nearestPosition]}
          pathOptions={{ color: '#38bdf8', weight: 2, opacity: 0.5, dashArray: '6, 8' }}
        />
      )}
    </>
  );
};

// ---------- Geolocate button (with optional long-press tracking) ----------

interface GeolocateButtonProps {
  active: boolean;
  loading: boolean;
  isTracking: boolean;
  onClick: () => void;
  onLongPress?: () => void;
  className?: string;
}

export const GeolocateButton: React.FC<GeolocateButtonProps> = ({
  active,
  loading,
  isTracking,
  onClick,
  onLongPress,
  className = 'absolute bottom-20 right-[4.5rem] z-[1000]',
}) => {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);
  const lastTapTime = useRef<number>(0);
  const doubleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = () => {
    didLongPress.current = false;
    if (!onLongPress) return;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress();
    }, 600);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (didLongPress.current) return;

    if (!onLongPress) {
      onClick();
      return;
    }

    const now = Date.now();
    if (now - lastTapTime.current < 400) {
      if (doubleTapTimer.current) clearTimeout(doubleTapTimer.current);
      lastTapTime.current = 0;
      onLongPress();
    } else {
      lastTapTime.current = now;
      doubleTapTimer.current = setTimeout(() => {
        onClick();
        lastTapTime.current = 0;
      }, 400);
    }
  };

  const handlePointerLeave = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  return (
    <div className={className}>
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className={`
          relative w-10 h-10 rounded-xl backdrop-blur-md border flex items-center justify-center transition-all duration-200 active:scale-95
          ${isTracking
            ? 'bg-sky-500/30 border-sky-400/50 text-sky-200 shadow-md shadow-sky-500/30'
            : active
              ? 'bg-sky-500/20 border-sky-400/40 text-sky-300 shadow-sm shadow-sky-500/20'
              : 'bg-white/10 border-white/20 text-white hover:bg-sky-500/15 hover:border-sky-400/30'
          }
        `}
        aria-label={isTracking ? 'Arrêter le suivi' : 'Me localiser'}
      >
        {isTracking && (
          <span className="absolute inset-[-4px] rounded-2xl border-2 border-sky-400/60 animate-ping pointer-events-none" />
        )}
        {loading ? (
          <div className="w-4 h-4 border-2 border-sky-300/30 border-t-sky-300 rounded-full animate-spin" />
        ) : (
          <Crosshair className={`w-4 h-4 ${isTracking ? 'animate-pulse' : ''}`} />
        )}
      </button>
    </div>
  );
};

// ---------- Self-contained GeolocateControl (button + marker + state) ----------

interface GeolocateControlProps {
  /** Optional point to draw a dashed link to (e.g. nearest waypoint) */
  nearestPosition?: [number, number];
  /** Callback when user position changes */
  onLocationChange?: (loc: { lat: number; lng: number; accuracy?: number } | null) => void;
  /** Disable long-press tracking mode (drawer use case) */
  disableTracking?: boolean;
  className?: string;
}

/**
 * All-in-one geolocation control: button + user marker + state management.
 * Drop into <RichMap> for instant geolocation support.
 *
 * For pages that need fine-grained control (proximity banners, distance panels),
 * use GeolocateButton + UserLocationMarker separately and manage state externally.
 */
export const GeolocateControl: React.FC<GeolocateControlProps> = ({
  nearestPosition,
  onLocationChange,
  disableTracking = false,
  className,
}) => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const trackingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (trackingTimeoutRef.current) {
      clearTimeout(trackingTimeoutRef.current);
      trackingTimeoutRef.current = null;
    }
    setIsTracking(false);
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) return;
    stopTracking();
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const next: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(next);
        setAccuracy(pos.coords.accuracy);
        onLocationChange?.({ lat: next[0], lng: next[1], accuracy: pos.coords.accuracy });
      },
      (err) => {
        if (err.code === err.TIMEOUT) return;
        toast.error('Signal GPS perdu — suivi désactivé');
        stopTracking();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    watchIdRef.current = id;
    setIsTracking(true);
    trackingTimeoutRef.current = setTimeout(stopTracking, TRACKING_TIMEOUT_MS);
  }, [stopTracking, onLocationChange]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (trackingTimeoutRef.current) clearTimeout(trackingTimeoutRef.current);
    };
  }, []);

  const handleClick = useCallback(() => {
    if (isTracking) {
      stopTracking();
      return;
    }
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non disponible');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(next);
        setAccuracy(pos.coords.accuracy);
        onLocationChange?.({ lat: next[0], lng: next[1], accuracy: pos.coords.accuracy });
        setLoading(false);
      },
      () => {
        setLoading(false);
        toast.error('Impossible de vous localiser');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [isTracking, stopTracking, onLocationChange]);

  const handleLongPress = useCallback(() => {
    if (disableTracking) return;
    if (isTracking) stopTracking();
    else startTracking();
  }, [isTracking, startTracking, stopTracking, disableTracking]);

  return (
    <>
      <GeolocateButton
        active={!!userLocation}
        loading={loading}
        isTracking={isTracking}
        onClick={handleClick}
        onLongPress={disableTracking ? undefined : handleLongPress}
        className={className}
      />
      {userLocation && (
        <UserLocationMarker position={userLocation} accuracy={accuracy} nearestPosition={nearestPosition} />
      )}
    </>
  );
};

export default GeolocateControl;
