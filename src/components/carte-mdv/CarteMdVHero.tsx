import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sparkles, ArrowRight, Footprints, MapPin, Route, Users, CheckCircle2, Leaf,
} from 'lucide-react';
import { useCarteMdVHeroStats } from '@/hooks/useCarteMdV';
import { cn } from '@/lib/utils';

const nfFr = new Intl.NumberFormat('fr-FR');

function useCountUp(target: number, active: boolean, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const from = 0;
    const to = target;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(from + (to - from) * ease(t)));
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, active, duration]);

  return value;
}

interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  value: number;
  suffix?: string;
  tone: string;
  ring: string;
  index: number;
  ready: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({
  icon: Icon, label, sublabel, value, suffix, tone, ring, index, ready,
}) => {
  const v = useCountUp(value, ready);
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xl',
        'p-4 sm:p-5 transition-all duration-500 hover:border-primary/40 hover:-translate-y-0.5',
        'opacity-0 translate-y-2 animate-fade-in',
      )}
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'forwards' }}
    >
      <div
        className={cn(
          'pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700',
          ring,
        )}
      />
      <div className="flex items-start gap-3">
        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ring-1', tone)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          {ready ? (
            <div className="text-3xl sm:text-4xl font-serif tabular-nums leading-none text-foreground">
              {nfFr.format(v)}
              {suffix && <span className="text-lg sm:text-xl text-muted-foreground ml-1">{suffix}</span>}
            </div>
          ) : (
            <div className="h-8 sm:h-9 w-20 bg-muted/40 rounded animate-pulse" />
          )}
          <div className="mt-2 text-sm font-medium text-foreground/90 leading-tight">{label}</div>
          {sublabel && <div className="text-xs text-muted-foreground mt-0.5">{sublabel}</div>}
        </div>
      </div>
    </div>
  );
};

const CarteMdVHero: React.FC = () => {
  const { data, isLoading } = useCarteMdVHeroStats();
  const ready = !isLoading && !!data;

  const terrain: KpiCardProps[] = [
    {
      icon: Footprints, label: 'Marches', sublabel: 'événements géolocalisés',
      value: data?.events_count ?? 0, tone: 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20',
      ring: 'bg-emerald-500/20', index: 0, ready,
    },
    {
      icon: MapPin, label: "Points d'observations", sublabel: 'marches associées',
      value: data?.marches_count ?? 0, tone: 'bg-primary/10 text-primary ring-primary/20',
      ring: 'bg-primary/20', index: 1, ready,
    },
    {
      icon: Route, label: 'Kilomètres parcourus', sublabel: 'sur le terrain',
      value: Math.round(data?.total_km ?? 0), suffix: 'km', tone: 'bg-amber-500/10 text-amber-500 ring-amber-500/20',
      ring: 'bg-amber-500/20', index: 2, ready,
    },
  ];

  const vivant: KpiCardProps[] = [
    {
      icon: Users, label: 'Marcheurs actifs', sublabel: 'communauté engagée',
      value: data?.marcheurs_count ?? 0, tone: 'bg-sky-500/10 text-sky-500 ring-sky-500/20',
      ring: 'bg-sky-500/20', index: 3, ready,
    },
    {
      icon: CheckCircle2, label: 'Participations', sublabel: 'validées sur le terrain',
      value: data?.participations_count ?? 0, tone: 'bg-fuchsia-500/10 text-fuchsia-500 ring-fuchsia-500/20',
      ring: 'bg-fuchsia-500/20', index: 4, ready,
    },
    {
      icon: Leaf, label: 'Espèces recensées', sublabel: 'sans doublon par événement',
      value: data?.species_count ?? 0, tone: 'bg-teal-500/10 text-teal-500 ring-teal-500/20',
      ring: 'bg-teal-500/20', index: 5, ready,
    },
  ];

  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <div className="container mx-auto px-4 py-10 sm:py-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Carte vivante des marches en France
          </div>
          <h1 className="mt-4 text-3xl sm:text-5xl font-serif tracking-tight">
            Explorez la carte du vivant,<br />marche après marche.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl">
            Chaque marche est une lecture sensible d'un territoire. Ici, retrouvez les prochaines
            marches à rejoindre, les espèces déjà rencontrées
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/marches-du-vivant/connexion">
                Rejoindre la communauté des marcheurs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/marches-du-vivant">Découvrir le projet</Link>
            </Button>
          </div>
        </div>

        <div className="mt-10 space-y-6">
          <div>
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
              Le terrain
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {terrain.map((p) => <KpiCard key={p.label} {...p} />)}
            </div>
          </div>
          <div>
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
              Le vivant
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {vivant.map((p) => <KpiCard key={p.label} {...p} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CarteMdVHero;
