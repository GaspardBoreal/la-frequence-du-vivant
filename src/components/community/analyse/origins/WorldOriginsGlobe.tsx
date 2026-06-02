import React, { useEffect, useMemo, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import { Plus, Minus, Locate, RotateCw } from 'lucide-react';
import type { OriginAggregate, DescriberAggregate } from '@/hooks/useExplorationBiogeography';

interface Props {
  origins: OriginAggregate[];
  describers: DescriberAggregate[];
  eventPoint: { lat: number; lng: number };
  height: number;
  onCountryClick: (iso: string) => void;
  onDescriberClick: (name: string) => void;
}

const WorldOriginsGlobe: React.FC<Props> = ({
  origins, describers, eventPoint, height, onCountryClick, onDescriberClick,
}) => {
  const ref = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(Math.max(320, e.contentRect.width));
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Init controls
  useEffect(() => {
    if (!ref.current) return;
    const controls = ref.current.controls?.();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.35;
      controls.enableZoom = true;
      controls.minDistance = 110;
      controls.maxDistance = 1000;
      controls.enableZoom = true;
      controls.zoomSpeed = 0.9;
      // Stop auto-rotation as soon as the user interacts with the globe
      const stop = () => {
        if (controls.autoRotate) {
          controls.autoRotate = false;
          setAutoRotate(false);
        }
      };
      controls.addEventListener('start', stop);
      return () => controls.removeEventListener('start', stop);
    }
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.pointOfView({ lat: eventPoint.lat, lng: eventPoint.lng, altitude: 2.2 }, 1500);
  }, [eventPoint.lat, eventPoint.lng]);

  // factor < 1 → caméra plus proche (zoom in) ; factor > 1 → plus loin (zoom out)
  const handleZoom = (factor: number) => {
    const controls = ref.current?.controls?.();
    const cam = ref.current?.camera?.();
    if (!controls || !cam) return;
    if (controls.autoRotate) { controls.autoRotate = false; setAutoRotate(false); }
    const minD = controls.minDistance ?? 110;
    const maxD = controls.maxDistance ?? 1000;
    const currentDist = cam.position.length();
    const targetDist = Math.min(maxD, Math.max(minD, currentDist * factor));
    const scale = targetDist / currentDist;
    cam.position.multiplyScalar(scale);
    controls.update?.();
  };


  const handleRecenter = () => {
    ref.current?.pointOfView({ lat: eventPoint.lat, lng: eventPoint.lng, altitude: 2.2 }, 1200);
  };

  const toggleAutoRotate = () => {
    const controls = ref.current?.controls?.();
    if (!controls) return;
    controls.autoRotate = !controls.autoRotate;
    setAutoRotate(controls.autoRotate);
  };

  const maxOrigin = Math.max(1, ...origins.map((o) => o.species.length));
  const maxDescriber = Math.max(1, ...describers.map((d) => d.species.length));

  // ONE arc per species → 1 point per country, weight ∝ species count
  const arcs = useMemo(() => {
    return origins.slice(0, 60).map((o, i) => ({
      startLat: o.country.lat,
      startLng: o.country.lng,
      endLat: eventPoint.lat,
      endLng: eventPoint.lng,
      color: [['rgba(245, 158, 11, 0.85)', 'rgba(16, 185, 129, 0.85)']],
      weight: Math.max(0.5, (o.species.length / maxOrigin) * 2.2),
      speciesCount: o.species.length,
      countryName: o.country.nameFr,
      iso: o.country.code,
      order: i,
    }));
  }, [origins, eventPoint, maxOrigin]);

  const points = useMemo(() => {
    const list: any[] = [];
    list.push({
      lat: eventPoint.lat, lng: eventPoint.lng,
      label: 'Événement', color: '#10b981', radius: 0.7, altitude: 0.02, kind: 'event',
    });
    origins.slice(0, 60).forEach((o) => {
      list.push({
        lat: o.country.lat, lng: o.country.lng,
        label: `${o.country.flag} ${o.country.nameFr} — ${o.species.length} esp.`,
        color: '#f59e0b',
        radius: 0.3 + (o.species.length / maxOrigin) * 0.7,
        altitude: 0.01,
        kind: 'origin',
        iso: o.country.code,
      });
    });
    describers.filter((d) => d.country).slice(0, 30).forEach((d) => {
      list.push({
        lat: d.country!.lat + 0.5, lng: d.country!.lng + 0.5,
        label: `✒️ ${d.name}${d.year ? ' · ' + d.year : ''} — ${d.species.length} esp.`,
        color: '#f43f5e',
        radius: 0.3 + (d.species.length / maxDescriber) * 0.5,
        altitude: 0.015,
        kind: 'describer',
        name: d.name,
      });
    });
    return list;
  }, [origins, describers, eventPoint, maxOrigin, maxDescriber]);

  const btnClass =
    'w-10 h-10 rounded-xl bg-background/70 backdrop-blur-md border border-border/60 text-foreground flex items-center justify-center hover:bg-amber-500/15 hover:border-amber-500/40 transition-all duration-200 active:scale-95 shadow-lg';

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <Globe
        ref={ref}
        width={width}
        height={height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
        showAtmosphere
        atmosphereColor="#fbbf24"
        atmosphereAltitude={0.18}
        arcsData={arcs}
        arcColor="color"
        arcStroke="weight"
        arcDashLength={0.45}
        arcDashGap={0.2}
        arcDashAnimateTime={(d: any) => 2500 + d.order * 60}
        arcAltitudeAutoScale={0.5}
        arcLabel={(d: any) => `<div style="background:rgba(0,0,0,.8);color:#fff;padding:6px 10px;border-radius:8px;font-size:12px"><b>${d.countryName}</b><br/>${d.speciesCount} espèce${d.speciesCount > 1 ? 's' : ''}</div>`}
        onArcClick={(d: any) => onCountryClick(d.iso)}
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointRadius="radius"
        pointAltitude="altitude"
        pointLabel={(d: any) => `<div style="background:rgba(0,0,0,.85);color:#fff;padding:6px 10px;border-radius:8px;font-size:12px">${d.label}</div>`}
        onPointClick={(d: any) => {
          if (d.kind === 'origin' && d.iso) onCountryClick(d.iso);
          else if (d.kind === 'describer' && d.name) onDescriberClick(d.name);
        }}
      />

      {/* Zoom & navigation controls overlay */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5">
        <button onClick={() => handleZoom(1 / 1.35)} className={btnClass} aria-label="Zoomer" title="Zoomer">
          <Plus className="w-4 h-4" />
        </button>
        <button onClick={() => handleZoom(1.35)} className={btnClass} aria-label="Dézoomer" title="Dézoomer">
          <Minus className="w-4 h-4" />
        </button>

        <button onClick={handleRecenter} className={btnClass} aria-label="Recentrer" title="Recentrer">
          <Locate className="w-4 h-4" />
        </button>
        <button
          onClick={toggleAutoRotate}
          className={`${btnClass} ${autoRotate ? 'text-amber-500 border-amber-500/40' : ''}`}
          aria-label={autoRotate ? 'Stopper la rotation' : 'Activer la rotation'}
          title={autoRotate ? 'Stopper la rotation' : 'Activer la rotation'}
        >
          <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin-slow' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default WorldOriginsGlobe;
