import React, { useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import CarteTabs, { type CarteTabKey } from '@/components/carte-mdv/CarteTabs';
import SouffleTab from '@/components/carte-mdv/tabs/SouffleTab';
import CarteTab from '@/components/carte-mdv/tabs/CarteTab';
import EnsembleTab from '@/components/carte-mdv/tabs/EnsembleTab';
import FinalCTA from '@/components/carte-mdv/FinalCTA';

const VALID: CarteTabKey[] = ['souffle', 'carte', 'ensemble'];

const CarteMarchesDuVivant: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('tab') as CarteTabKey | null;
  const tab: CarteTabKey = raw && VALID.includes(raw) ? raw : 'souffle';

  const setTab = useCallback((next: CarteTabKey) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'souffle') params.delete('tab'); else params.set('tab', next);
    setSearchParams(params, { replace: false });
    // Scroll to top of content
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, setSearchParams]);

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
        <CarteTabs value={tab} onChange={setTab} />

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {tab === 'souffle' && <SouffleTab />}
            {tab === 'carte' && <CarteTab />}
            {tab === 'ensemble' && <EnsembleTab />}
          </motion.div>
        </AnimatePresence>

        <FinalCTA />
      </div>
    </>
  );
};

export default CarteMarchesDuVivant;
