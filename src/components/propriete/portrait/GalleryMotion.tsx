import React, { useEffect, useState } from 'react';
import { Orbit, Disc3, Sparkles } from 'lucide-react';
import type { GalleryPhoto } from '@/hooks/propriete/usePropertyGallery';
import { OrbitsField } from './motion/OrbitsField';
import { RibbonCarousel } from './motion/RibbonCarousel';
import { SwarmFloat } from './motion/SwarmFloat';
import { PhotoLightbox } from './PhotoLightbox';

interface Props {
  photos: GalleryPhoto[];
}

type Register = 'orbits' | 'ribbon' | 'swarm';
const STORAGE_KEY = 'portrait.motionMode';

export const GalleryMotion: React.FC<Props> = ({ photos }) => {
  const [mode, setMode] = useState<Register>(() => {
    if (typeof window === 'undefined') return 'orbits';
    const v = window.localStorage.getItem(STORAGE_KEY) as Register | null;
    return v === 'ribbon' || v === 'swarm' || v === 'orbits' ? v : 'orbits';
  });
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, mode); } catch { /* ignore */ }
  }, [mode]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-[11px]">
        <MotionBtn active={mode === 'orbits'} onClick={() => setMode('orbits')} icon={Orbit} label="Orbites" />
        <MotionBtn active={mode === 'ribbon'} onClick={() => setMode('ribbon')} icon={Disc3} label="Ruban 3D" />
        <MotionBtn active={mode === 'swarm'} onClick={() => setMode('swarm')} icon={Sparkles} label="Nuée" />
      </div>

      {mode === 'orbits' && <OrbitsField photos={photos} onOpen={setLightbox} />}
      {mode === 'ribbon' && <RibbonCarousel photos={photos} onOpen={setLightbox} />}
      {mode === 'swarm' && <SwarmFloat photos={photos} onOpen={setLightbox} />}

      <PhotoLightbox
        photos={photos}
        index={lightbox}
        onClose={() => setLightbox(null)}
        onIndexChange={setLightbox}
      />
    </div>
  );
};

const MotionBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ComponentType<any>; label: string }> = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition ${
      active
        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`}
  >
    <Icon className="w-3 h-3" />
    {label}
  </button>
);
