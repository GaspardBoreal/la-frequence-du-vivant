import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import CarteMdVHero from '@/components/carte-mdv/CarteMdVHero';
import FiltersBar from '@/components/carte-mdv/FiltersBar';
import ViewSwitcher from '@/components/carte-mdv/ViewSwitcher';
import SharePanel from '@/components/carte-mdv/SharePanel';
import MapView from '@/components/carte-mdv/views/MapView';
import TimelineView from '@/components/carte-mdv/views/TimelineView';
import ListView from '@/components/carte-mdv/views/ListView';
import MurDuVivantView from '@/components/carte-mdv/views/MurDuVivantView';
import ConstellationView from '@/components/carte-mdv/views/ConstellationView';
import {
  useCarteMdVFilters,
  useCarteMdVEvents,
  useSolVivantPoints,
  applyFilters,
} from '@/hooks/useCarteMdV';
import { solVivantMatchesCategories } from '@/lib/marcheCategories';

const CarteMarchesDuVivant: React.FC = () => {
  const { filters, update } = useCarteMdVFilters();
  const { data: events = [], isLoading } = useCarteMdVEvents();
  const { data: solPoints = [] } = useSolVivantPoints(filters.solVivantEnabled);

  const filtered = useMemo(() => applyFilters(events, filters), [events, filters]);

  const filteredSolPoints = useMemo(() => {
    if (!filters.solVivantEnabled) return [];
    if (filters.categories.length === 0) return solPoints;
    const set = new Set(filters.categories);
    return solPoints.filter((p) => set.has(mapSolVivantToCategory(p.categories)));
  }, [solPoints, filters.solVivantEnabled, filters.categories]);

  return (
    <>
      <Helmet>
        <title>Carte des Marches du Vivant — Explorez le vivant en France</title>
        <meta name="description" content="La carte vivante des marches du vivant en France : biodiversité observée, marches à venir, partenaires du sol vivant. Rejoignez une marche près de chez vous." />
        <link rel="canonical" href="https://la-frequence-du-vivant.com/marches-du-vivant/carte-marches-du-vivant" />
        <meta property="og:title" content="Carte des Marches du Vivant" />
        <meta property="og:description" content="Explorez la carte du vivant marche après marche. Biodiversité, poésie, territoires — rejoignez la communauté." />
        <meta property="og:url" content="https://la-frequence-du-vivant.com/marches-du-vivant/carte-marches-du-vivant" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <CarteMdVHero />

        <FiltersBar filters={filters} onChange={update} resultCount={filtered.length} />

        <div className="flex items-center justify-between container mx-auto px-4 pt-2">
          <ViewSwitcher value={filters.view} onChange={(v) => update({ view: v })} />
          <div className="pt-4">
            <SharePanel />
          </div>
        </div>

        <main className="container mx-auto px-4 py-6">
          {isLoading ? (
            <div className="h-[60vh] rounded-xl bg-muted animate-pulse" />
          ) : (
            <>
              {filters.view === 'map' && (
                <MapView events={filtered} solVivantPoints={filteredSolPoints} showSolVivant={filters.solVivantEnabled} />
              )}
              {filters.view === 'timeline' && <TimelineView events={filtered} />}
              {filters.view === 'wall' && <MurDuVivantView events={filtered} />}
              {filters.view === 'constellation' && <ConstellationView events={filtered} />}
              {filters.view === 'list' && <ListView events={filtered} />}
            </>
          )}
        </main>

        {/* Final CTA */}
        <section className="border-t border-border bg-gradient-to-br from-primary/5 to-secondary/10">
          <div className="container mx-auto px-4 py-12 text-center max-w-2xl">
            <Sparkles className="h-10 w-10 mx-auto text-primary" />
            <h2 className="mt-4 text-2xl sm:text-3xl font-serif">Envie de marcher avec nous ?</h2>
            <p className="mt-3 text-muted-foreground">
              Rejoignez une communauté de marcheurs qui écrivent, observent, écoutent et prennent soin
              des territoires — une marche à la fois.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/marches-du-vivant/connexion">
                  Créer mon compte marcheur
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/marches-du-vivant">En savoir plus</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default CarteMarchesDuVivant;
