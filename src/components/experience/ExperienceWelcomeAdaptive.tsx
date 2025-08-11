import React from 'react';
import { Button } from '@/components/ui/button';
import type { Exploration } from '@/hooks/useExplorations';
import type { WelcomeComposition } from '@/utils/welcomeComposer';

interface Props {
  exploration: Exploration;
  composition: WelcomeComposition;
  onStart: () => void;
}

const Stat: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex flex-col items-center px-3 py-2 rounded-md bg-muted/40">
    <span className="text-lg font-semibold text-foreground">{value}</span>
    <span className="text-xs text-foreground/70">{label}</span>
  </div>
);

export default function ExperienceWelcomeAdaptive({ exploration, composition, onStart }: Props) {
  const { variant, title, subtitle, media, stats, cta } = composition;

  const Header = (
    <header className="text-center space-y-3">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      {subtitle && (
        <p className="text-base sm:text-lg text-foreground/80 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </header>
  );

  const Stats = (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      <Stat label="marches" value={stats.marches} />
      <Stat label="photos" value={stats.photos} />
      <Stat label="sons" value={stats.audio} />
      {stats.videos > 0 && <Stat label="vidéos" value={stats.videos} />}
    </div>
  );

  if (variant === 'media-mosaic') {
    const imgs = media?.photos || [];
    return (
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-b from-background to-muted">
        <div className="grid grid-cols-3 gap-1 sm:gap-2 aspect-[3/2] sm:aspect-[16/7]">
          {imgs.slice(0, 6).map((p, i) => (
            <div key={i} className={`relative ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
              <img
                src={p.url}
                alt={p.alt}
                loading="lazy"
                className="h-full w-full object-cover rounded-md"
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/30 to-transparent" />
        <div className="relative px-4 sm:px-6 -mt-10 sm:-mt-14 pb-4 sm:pb-6">
          {Header}
          {Stats}
          <div className="mt-6 flex justify-center">
            <Button size="lg" onClick={onStart} aria-label={cta.label}>
              {cta.label}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'audio-first') {
    return (
      <section className="relative rounded-xl p-6 sm:p-8 bg-gradient-to-b from-primary/10 to-background border">
        {Header}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={onStart}
            aria-label="Lancer l'expérience sonore"
            className="group inline-flex items-center gap-3 rounded-full border px-5 py-3 bg-background shadow-sm transition-transform hover:scale-105"
          >
            <div className="relative h-10 w-10 rounded-full bg-primary/20 grid place-items-center">
              <div className="h-3 w-3 rounded-full bg-primary animate-ping" />
            </div>
            <span className="text-sm sm:text-base font-medium text-foreground">
              Découvrir en audio ({stats.audio})
            </span>
          </button>
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
      <section className="relative rounded-xl p-6 sm:p-8 border bg-gradient-to-b from-muted/40 to-background">
        {Header}
        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          {Array.from({ length: Math.min(6, Math.max(3, stats.marches)) }).map((_, i) => (
            <div key={i} className="h-16 sm:h-20 rounded-md bg-primary/10" />
          ))}
        </div>
        {Stats}
        <div className="mt-6 flex justify-center">
          <Button size="lg" onClick={onStart}>{cta.label}</Button>
        </div>
      </section>
    );
  }

  // story-cover (default)
  const cover = media?.photos?.[0];
  return (
    <section className="relative overflow-hidden rounded-xl border bg-gradient-to-b from-background to-muted">
      {cover && (
        <div className="absolute inset-0 opacity-70">
          <img src={cover.url} alt={cover.alt} loading="lazy" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="relative px-4 sm:px-6 py-10 sm:py-14 bg-gradient-to-t from-background/80 via-background/20 to-transparent">
        {Header}
        {Stats}
        <div className="mt-6 flex justify-center">
          <Button size="lg" onClick={onStart}>{cta.label}</Button>
        </div>
      </div>
    </section>
  );
}
