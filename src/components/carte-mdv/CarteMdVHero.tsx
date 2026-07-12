import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useCarteMdVHeroStats } from '@/hooks/useCarteMdV';

const CarteMdVHero: React.FC = () => {
  const { data: stats } = useCarteMdVHeroStats();

  const items = [
    { label: 'Marches géolocalisées', value: stats?.events_count ?? '—' },
    { label: 'Espèces recensées', value: stats?.species_count ?? '—' },
    { label: 'Marcheurs actifs', value: stats?.marcheurs_count ?? '—' },
    { label: 'Partenaires Sol Vivant', value: stats?.partners_count ?? '—' },
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
            marches à rejoindre, les espèces déjà rencontrées et — en option — les acteurs
            partenaires du sol vivant partout en France.
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

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {items.map((it) => (
            <div key={it.label} className="rounded-lg border border-border bg-card/60 backdrop-blur p-3 sm:p-4">
              <div className="text-2xl sm:text-3xl font-semibold text-foreground">{it.value}</div>
              <div className="mt-1 text-xs sm:text-sm text-muted-foreground">{it.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CarteMdVHero;
