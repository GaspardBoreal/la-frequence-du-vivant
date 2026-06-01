import React, { useEffect, useMemo, useRef } from 'react';
import Globe from 'react-globe.gl';
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
  const [width, setWidth] = React.useState(800);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(Math.max(320, e.contentRect.width));
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    // Slow auto-rotation
    const controls = ref.current.controls?.();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.35;
      controls.enableZoom = true;
    }
    ref.current.pointOfView({ lat: eventPoint.lat, lng: eventPoint.lng, altitude: 2.2 }, 1500);
  }, [eventPoint.lat, eventPoint.lng]);

  const maxOrigin = Math.max(1, ...origins.map((o) => o.species.length));
  const maxDescriber = Math.max(1, ...describers.map((d) => d.species.length));

  const arcs = useMemo(() => {
    const list: any[] = [];
    origins.slice(0, 60).forEach((o, i) => {
      list.push({
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
      });
    });
    return list;
  }, [origins, eventPoint, maxOrigin]);

  const points = useMemo(() => {
    const list: any[] = [];
    // Event arrival pulse
    list.push({
      lat: eventPoint.lat, lng: eventPoint.lng,
      label: 'Événement', color: '#10b981', radius: 0.7, altitude: 0.02, kind: 'event',
    });
    // Origins (amber)
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
    // Describers (rose)
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

  return (
    <div ref={containerRef} className="w-full h-full">
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
    </div>
  );
};

export default WorldOriginsGlobe;
