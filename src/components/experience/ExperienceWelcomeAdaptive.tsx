import React from 'react';
import { Button } from '@/components/ui/button';
import type { Exploration } from '@/hooks/useExplorations';
import type { WelcomeComposition } from '@/utils/welcomeComposer';

interface Props {
  exploration: Exploration;
  composition: WelcomeComposition;
  onStart: () => void;
  onStartPodcast?: () => void;
}

const Stat: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex flex-col items-center px-3 py-2 rounded-md bg-muted/40 hover-scale animate-fade-in">
    <span className="text-lg font-semibold text-foreground">{value}</span>
    <span className="text-xs text-foreground/70">{label}</span>
  </div>
);

export default function ExperienceWelcomeAdaptive({ exploration, composition, onStart, onStartPodcast }: Props) {
  const { variant, title, subtitle, media, stats } = composition;

  const Header = (
    <header className="text-center space-y-3 animate-fade-in">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground animate-fade-in" style={{ animationDelay: '40ms' }}>
        {title}
      </h1>
      {subtitle && (
        <p className="text-base sm:text-lg text-foreground/80 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '80ms' }}>
          {subtitle}
        </p>
      )}
    </header>
  );

  const Stats = (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3 animate-fade-in" style={{ animationDelay: '120ms' }}>
      <Stat label="marches" value={stats.marches} />
      <Stat label="photos" value={stats.photos} />
      <Stat label="sons" value={stats.audio} />
      {stats.videos > 0 && <Stat label="vidéos" value={stats.videos} />}
    </div>
  );

  if (variant === 'media-mosaic') {
    const imgs = media?.photos || [];
    return (
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-b from-background to-muted animate-enter">
        <div className="grid grid-cols-3 gap-1 sm:gap-2 aspect-[3/2] sm:aspect-[16/7] animate-fade-in">
          {imgs.slice(0, 6).map((p, i) => (
            <div key={i} className={`relative ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
              <img
                src={p.url}
                alt={p.alt}
                loading="lazy"
                className="h-full w-full object-cover rounded-md hover-scale"
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/30 to-transparent" />
        <div className="relative px-4 sm:px-6 -mt-10 sm:-mt-14 pb-4 sm:pb-6">
          {Header}
          {Stats}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" variant="hero" onClick={onStart} aria-label="Découvrir les marches" className="hover-scale">
              Découvrir les marches
            </Button>
            <Button size="lg" variant="glass" onClick={onStartPodcast} aria-label="Écouter le podcast" className="hover-scale">
              Écouter le podcast
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'audio-first') {
    return (
      <section className="relative rounded-xl p-6 sm:p-8 bg-gradient-to-b from-primary/10 to-background border animate-enter">
        {Header}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" variant="hero" onClick={onStart} aria-label="Découvrir les marches" className="hover-scale">
            Découvrir les marches
          </Button>
          <Button size="lg" variant="glass" onClick={onStartPodcast} aria-label="Écouter le podcast" className="hover-scale">
            Écouter le podcast
          </Button>
        </div>
        {Stats}
        {stats.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {stats.tags.map((t) => (
              <span key={t} className="text-xs px-2 py-1 rounded-md bg-muted/50 text-foreground/80">#{t}</span>
            ))}
          </div>
        )}
      </section>
    );
  }

  if (variant === 'map-first') {
    return (
      <section className="relative rounded-xl p-6 sm:p-8 border bg-gradient-to-b from-muted/40 to-background animate-enter">
        {Header}
        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          {Array.from({ length: Math.min(6, Math.max(3, stats.marches)) }).map((_, i) => (
            <div key={i} className="h-16 sm:h-20 rounded-md bg-primary/10 animate-fade-in hover-scale" />
          ))}
        </div>
        {Stats}
        <div className="mt-6 flex justify-center">
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" variant="hero" onClick={onStart} className="hover-scale" aria-label="Découvrir les marches">Découvrir les marches</Button>
          <Button size="lg" variant="glass" onClick={onStartPodcast} className="hover-scale" aria-label="Écouter le podcast">Écouter le podcast</Button>
        </div>
        </div>
      </section>
    );
  }

  // story-cover (default)
  const cover = media?.photos?.[0];
  return (
    <section className="relative overflow-hidden rounded-xl border bg-gradient-to-b from-background to-muted animate-enter">
      {cover && (
        <div className="absolute inset-0 opacity-70">
          <img src={cover.url} alt={cover.alt} loading="lazy" decoding="async" fetchPriority="high" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="relative px-4 sm:px-6 py-10 sm:py-14 bg-gradient-to-t from-background/80 via-background/20 to-transparent animate-fade-in">
        {Header}
        {Stats}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" variant="hero" onClick={onStart} className="hover-scale" aria-label="Découvrir les marches">Découvrir les marches</Button>
          <Button size="lg" variant="glass" onClick={onStartPodcast} className="hover-scale" aria-label="Écouter le podcast">Écouter le podcast</Button>
        </div>
      </div>
    </section>
  );
}
