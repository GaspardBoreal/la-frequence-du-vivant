import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Activity, List, BookOpen } from 'lucide-react';
import { useExplorationBySlug } from '@/hooks/useExplorations';
import { useExplorationMarchesByStatus } from '@/hooks/useExplorationsByStatus';
import SEOHead from '@/components/SEOHead';
import PoeticSeismograph from '@/components/admin/PoeticSeismograph';
import LivingIndex from '@/components/admin/LivingIndex';
import type { TexteExport } from '@/utils/epubExportUtils';

type TraverseeMode = 'seismograph' | 'living-index';

const COLOR_SCHEME = {
  primary: '#1e3a5f',
  secondary: '#64748b',
  accent: '#d97706',
  background: '#fefdfb',
  text: '#1e293b',
};

const TraverseesLecteurs: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState<TraverseeMode>('seismograph');

  const { data: exploration, isLoading: isLoadingExploration } = useExplorationBySlug(slug || '');
  const { data: explorationMarches = [], isLoading: isLoadingMarches } = useExplorationMarchesByStatus(
    exploration?.id || '', 
    true // readers mode = true
  );

  // Convertir les marches en textes pour les composants de visualisation
  const textes: TexteExport[] = useMemo(() => {
    const allTextes: TexteExport[] = [];
    
    explorationMarches.forEach((em, marcheIndex) => {
      const marche = em.marche;
      if (!marche) return;

      // Récupérer les textes de cette marche
      const marcheTextes = (marche as any).textes || [];
      
      marcheTextes.forEach((texte: any, texteIndex: number) => {
        allTextes.push({
          id: texte.id || `${marche.id}-${texteIndex}`,
          titre: texte.titre || 'Sans titre',
          contenu: texte.contenu || '',
          type_texte: texte.type_texte || 'prose',
          marche_ville: marche.ville,
          marche_nom: marche.nom_marche,
          marche_date: marche.date,
          marche_ordre: marcheIndex,
          partie_id: em.partie_id || undefined,
          partie_ordre: undefined,
          partie_numero_romain: undefined,
          partie_titre: undefined,
          created_at: texte.created_at || new Date().toISOString(),
        });
      });

      // Si pas de textes spécifiques, créer un texte à partir des descriptifs
      if (marcheTextes.length === 0 && (marche.descriptif_court || marche.descriptif_long)) {
        allTextes.push({
          id: marche.id,
          titre: marche.nom_marche || marche.ville,
          contenu: marche.descriptif_long || marche.descriptif_court || '',
          type_texte: 'prose',
          marche_ville: marche.ville,
          marche_nom: marche.nom_marche,
          marche_date: marche.date,
          marche_ordre: marcheIndex,
          partie_id: em.partie_id || undefined,
          partie_ordre: undefined,
          partie_numero_romain: undefined,
          partie_titre: undefined,
          created_at: marche.created_at,
        });
      }
    });

    return allTextes;
  }, [explorationMarches]);

  const isLoading = isLoadingExploration || isLoadingMarches;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fefdfb] flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-12 h-12 border-2 border-amber-600/30 border-t-amber-600 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-sm text-slate-500 italic">Chargement des traversées...</p>
        </motion.div>
      </div>
    );
  }

  if (!exploration) {
    return (
      <div className="min-h-screen bg-[#fefdfb] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">Exploration non trouvée</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-amber-600 hover:text-amber-700 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={16} />
            Retour
          </button>
        </div>
      </div>
    );
  }

  const modes = [
    { id: 'seismograph' as const, label: 'Sismographe', icon: Activity },
    { id: 'living-index' as const, label: 'Index Vivant', icon: List },
  ];

  return (
    <>
      <SEOHead
        title={`Traversées - ${exploration.name} - La Fréquence du Vivant`}
        description={`Explorez les mondes thématiques et l'intensité poétique de "${exploration.name}"`}
        keywords={exploration.meta_keywords?.join(', ') || 'traversées, exploration, poésie'}
      />

      <div className="min-h-screen bg-[#fefdfb] flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[#fefdfb]/95 backdrop-blur-sm border-b border-slate-200/50">
          <div className="max-w-4xl mx-auto px-4 py-3">
            {/* Navigation retour */}
            <button
              onClick={() => navigate(`/lecteurs/exploration/${slug}`)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-2"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Retour à l'exploration</span>
              <span className="sm:hidden">Retour</span>
            </button>

            {/* Titre */}
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-amber-600" />
              <div>
                <h1 className="text-lg font-serif text-slate-800 leading-tight">
                  Traversées
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  {exploration.name}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Mode Selector */}
        <nav className="bg-white border-b border-slate-200/50">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-center gap-1 py-2">
              {modes.map((mode) => {
                const Icon = mode.icon;
                const isActive = activeMode === mode.id;
                
                return (
                  <button
                    key={mode.id}
                    onClick={() => setActiveMode(mode.id)}
                    className={`
                      relative px-4 py-2 text-sm tracking-wide transition-all duration-300 rounded-lg
                      flex items-center gap-2
                      ${isActive 
                        ? 'text-amber-700 bg-amber-50' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{mode.label}</span>
                    
                    {isActive && (
                      <motion.div
                        layoutId="traversee-nav-indicator"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-amber-600 rounded-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 overflow-hidden">
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="min-h-[calc(100vh-180px)]"
              >
                {activeMode === 'seismograph' && (
                  <div className="p-4 sm:p-6">
                    <PoeticSeismograph textes={textes} colorScheme={COLOR_SCHEME} />
                  </div>
                )}
                {activeMode === 'living-index' && (
                  <div className="h-[calc(100vh-180px)]">
                    <LivingIndex textes={textes} colorScheme={COLOR_SCHEME} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Footer info */}
        <footer className="py-4 px-4 border-t border-slate-200/50 bg-white/50">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs text-slate-400">
              {textes.length} texte{textes.length > 1 ? 's' : ''} • {explorationMarches.length} étape{explorationMarches.length > 1 ? 's' : ''}
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default TraverseesLecteurs;
