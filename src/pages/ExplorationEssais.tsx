import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Book, ChevronLeft, ChevronRight, Search, Tag } from 'lucide-react';
import { useExploration, useExplorationMarches } from '@/hooks/useExplorations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import SEOHead from '@/components/SEOHead';

interface EssaiContent {
  id: string;
  titre: string;
  sousTitre?: string;
  contenu: string;
  motsCles: string[];
  pages: string[];
  marcheVille?: string;
  ordre: number;
}

export default function ExplorationEssais() {
  const { slug } = useParams<{ slug: string }>();
  const { data: exploration, isLoading: explorationLoading } = useExploration(slug || '');
  const { data: explorationMarches, isLoading: marchesLoading } = useExplorationMarches(exploration?.id || '');
  
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedEssai, setSelectedEssai] = useState<EssaiContent | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Simulation des essais - en production, ceci viendrait de la base de données
  const [essais, setEssais] = useState<EssaiContent[]>([]);

  useEffect(() => {
    if (explorationMarches) {
      // Génération d'essais fictifs basés sur les marches de l'exploration
      const generatedEssais: EssaiContent[] = explorationMarches.flatMap((expMarche, index) => {
        if (!expMarche.marche) return [];
        
        const marche = expMarche.marche;
        
        // Récupération des textes existants de type "essai" s'ils existent
        const existingEssais = marche.etudes?.filter(etude => 
          etude.titre.toLowerCase().includes('essai') || 
          etude.contenu.toLowerCase().includes('essai')
        ) || [];

        if (existingEssais.length > 0) {
          return existingEssais.map(etude => ({
            id: etude.id,
            titre: etude.titre,
            sousTitre: etude.resume || '',
            contenu: etude.contenu,
            motsCles: extractKeywords(etude.contenu),
            pages: splitContentIntoPages(etude.contenu),
            marcheVille: marche.ville,
            ordre: etude.ordre
          }));
        }

        // Génération d'un essai basé sur les données de la marche
        return [{
          id: `essai-${marche.id}`,
          titre: `Réflexions sur ${marche.ville}`,
          sousTitre: `Essai géopoétique sur les marchés de ${marche.region}`,
          contenu: generateEssaiContent(marche),
          motsCles: [marche.ville, marche.region, marche.theme_principal, ...marche.sous_themes].filter(Boolean),
          pages: [],
          marcheVille: marche.ville,
          ordre: index + 1
        }];
      }).sort((a, b) => a.ordre - b.ordre);

      // Diviser le contenu en pages pour chaque essai
      const essaisWithPages = generatedEssais.map(essai => ({
        ...essai,
        pages: essai.pages.length > 0 ? essai.pages : splitContentIntoPages(essai.contenu)
      }));

      setEssais(essaisWithPages);
    }
  }, [explorationMarches]);

  // Fonctions utilitaires
  function extractKeywords(content: string): string[] {
    const words = content.toLowerCase().split(/\W+/);
    const stopWords = new Set(['le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'un', 'une', 'dans', 'sur', 'avec', 'par', 'pour', 'sans', 'sous', 'vers']);
    const keywords = words
      .filter(word => word.length > 4 && !stopWords.has(word))
      .reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    return Object.entries(keywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  function splitContentIntoPages(content: string, wordsPerPage: number = 300): string[] {
    const words = content.split(' ');
    const pages = [];
    
    for (let i = 0; i < words.length; i += wordsPerPage) {
      pages.push(words.slice(i, i + wordsPerPage).join(' '));
    }
    
    return pages.length > 0 ? pages : [content];
  }

  function generateEssaiContent(marche: any): string {
    return `# ${marche.ville} : Un Territoire en Mutation

## Introduction

Les marchés de ${marche.ville}, témoins silencieux de l'évolution territoriale, s'inscrivent dans une géographie sensible où se rencontrent tradition et modernité. Cette exploration nous invite à repenser notre rapport au territoire, à travers le prisme de l'expérience marchande.

## Le Territoire Vécu

${marche.descriptif_long || marche.descriptif_court || `Dans la région ${marche.region}, ${marche.ville} représente un microcosme des transformations contemporaines. Les pratiques commerciales s'y déploient selon des logiques spatiales complexes, révélatrices d'enjeux plus vastes.`}

## Géographie des Pratiques

L'analyse des flux et des interactions révèle des patterns d'usage qui dépassent la simple fonction économique. Le marché devient lieu de sociabilité, espace de négociation entre différentes temporalités urbaines.

### Temporalités Croisées

Les rythmes du marché s'articulent avec ceux de la ville, créant des synchronies particulières. Les horaires, les cycles saisonniers, les habitudes constituent une partition complexe que seule une approche géopoétique permet d'appréhender pleinement.

## Vers une Nouvelle Compréhension

Cette étude propose une lecture renouvelée des territoires marchands, où la dimension sensible reprend sa place légitime dans l'analyse spatiale. ${marche.ville} devient ainsi un laboratoire pour repenser nos méthodes d'approche des espaces vécus.

## Conclusion

L'exploration de ${marche.ville} révèle la richesse d'une approche territorial intégrant pleinement la dimension experiencielle. Ces enseignements ouvrent des perspectives nouvelles pour l'aménagement et la compréhension des territoires contemporains.`;
  }

  // Filtrage des essais
  const filteredEssais = essais.filter(essai => {
    if (!searchFilter) return true;
    
    const searchLower = searchFilter.toLowerCase();
    return (
      essai.titre.toLowerCase().includes(searchLower) ||
      essai.sousTitre?.toLowerCase().includes(searchLower) ||
      essai.contenu.toLowerCase().includes(searchLower) ||
      essai.motsCles.some(mot => mot.toLowerCase().includes(searchLower)) ||
      essai.marcheVille?.toLowerCase().includes(searchLower)
    );
  });

  if (explorationLoading || marchesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-primary/10 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
        <span className="ml-4 text-lg">Chargement des essais...</span>
      </div>
    );
  }

  if (!exploration) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-primary/10 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Exploration non trouvée</h1>
          <Link to="/explorations">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux explorations
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const title = `Essais · ${exploration.name}`;
  const description = `Découvrez les essais géopoétiques de l'exploration ${exploration.name}. Textes analytiques et réflexions territorialise sur ${essais.length} essais disponibles.`;
  const canonical = `${window.location.origin}/galerie-fleuve/exploration/${exploration.slug}/essais`;

  // Vue de lecture d'un essai
  if (selectedEssai) {
    const totalPages = selectedEssai.pages.length;
    
    return (
      <>
        <SEOHead 
          title={`${selectedEssai.titre} · ${title}`.slice(0, 58)} 
          description={selectedEssai.sousTitre?.slice(0, 158) || description.slice(0, 158)} 
          canonicalUrl={canonical}
        />

        <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-primary/10">
          {/* Header de lecture */}
          <div className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-white hover:bg-white/10"
                    onClick={() => setSelectedEssai(null)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour aux essais
                  </Button>
                  <div>
                    <h1 className="text-lg font-bold text-white">{selectedEssai.titre}</h1>
                    {selectedEssai.sousTitre && (
                      <p className="text-white/70 text-sm">{selectedEssai.sousTitre}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-white/20 text-white border-white/30">
                    Page {currentPage + 1} / {totalPages}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Contenu de l'essai */}
          <div className="container mx-auto px-4 py-8">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20"
            >
              <div className="prose prose-invert prose-lg max-w-none">
                <div 
                  className="text-white leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedEssai.pages[currentPage]
                      ?.replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-6">$1</h1>')
                      ?.replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold mb-4 mt-8">$1</h2>')
                      ?.replace(/^### (.*$)/gm, '<h3 class="text-xl font-medium mb-3 mt-6">$1</h3>')
                  }}
                />
              </div>
              
              {/* Mots-clés en bas de page */}
              {currentPage === 0 && (
                <div className="mt-8 pt-6 border-t border-white/20">
                  <h4 className="text-white font-medium mb-3">Mots-clés :</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEssai.motsCles.map((mot, index) => (
                      <Badge key={index} className="bg-white/20 text-white border-white/30">
                        <Tag className="h-3 w-3 mr-1" />
                        {mot}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  // Vue liste des essais
  return (
    <>
      <SEOHead 
        title={title.slice(0, 58)} 
        description={description.slice(0, 158)} 
        canonicalUrl={canonical}
      />

      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-primary/10">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link to="/galerie-fleuve">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour à l'exploration
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-white">Essais Géopoétiques</h1>
                  <p className="text-white/70">{exploration.name}</p>
                </div>
              </div>
              <Badge className="bg-white/20 text-white border-white/30">
                <Book className="h-3 w-3 mr-1" />
                {filteredEssais.length} essais
              </Badge>
            </div>
          </div>
        </div>

        {/* Recherche */}
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-md mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
              <Input
                placeholder="Rechercher dans les essais..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 pl-10"
              />
            </div>
          </div>

          {/* Liste des essais */}
          <div className="grid gap-6">
            {filteredEssais.map((essai, index) => (
              <motion.div
                key={essai.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedEssai(essai);
                  setCurrentPage(0);
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{essai.titre}</h3>
                    {essai.sousTitre && (
                      <p className="text-white/80 font-medium mb-3">{essai.sousTitre}</p>
                    )}
                    <p className="text-white/70 text-sm line-clamp-3">
                      {essai.contenu.replace(/[#*]/g, '').substring(0, 200)}...
                    </p>
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30 ml-4">
                    {essai.pages.length} pages
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {essai.motsCles.slice(0, 3).map((mot, idx) => (
                      <Badge key={idx} variant="outline" className="text-white/70 border-white/30 text-xs">
                        {mot}
                      </Badge>
                    ))}
                  </div>
                  {essai.marcheVille && (
                    <span className="text-white/60 text-sm">
                      Marche de {essai.marcheVille}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {filteredEssais.length === 0 && (
            <div className="text-center py-12">
              <Book className="h-16 w-16 text-white/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Aucun essai trouvé</h3>
              <p className="text-white/70">Essayez de modifier votre recherche.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}