// Symphonie Textuelle Hybride - L'expérience de lecture révolutionnaire
// Transforme la lecture en voyage sensoriel total pour "La Fréquence du Vivant"

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  BookOpen,
  Stars,
  Waves,
  Palette,
  Search,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Bookmark,
  Share2,
  Eye,
  Heart,
  Sparkles,
  Globe,
  TreePine,
  Feather
} from 'lucide-react';

import { useExploration, useExplorationMarches } from '@/hooks/useExplorations';
import { useMarcheTextes, MarcheTexte } from '@/hooks/useMarcheTextes';
import { TextType, getTextTypeInfo } from '@/types/textTypes';
import { useToast } from '@/hooks/use-toast';

type ExperienceLevel = 'eveil' | 'constellation' | 'immersion';
type ConstellationMode = 'cosmos' | 'fleuve' | 'synesthesie';

interface TexteEnrichi extends MarcheTexte {
  marcheName?: string;
  resonance?: number; // Score de résonance avec le texte précédent
  constellation?: string; // Groupement thématique
}

interface AmbianceState {
  soundscape: boolean;
  visualEffects: boolean;
  adaptiveColors: boolean;
  focusMode: boolean;
}

export default function SymphonieTextuelle() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  
  // Données de base
  const { data: exploration, isLoading: loadingExploration } = useExploration(slug || '');
  const { data: marches = [], isLoading: loadingMarches } = useExplorationMarches(exploration?.id || '');
  
  // État de l'expérience
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('eveil');
  const [constellationMode, setConstellationMode] = useState<ConstellationMode>('cosmos');
  const [selectedTextId, setSelectedTextId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<TextType | 'all'>('all');
  
  // État immersif
  const [ambiance, setAmbiance] = useState<AmbianceState>({
    soundscape: true,
    visualEffects: true,
    adaptiveColors: true,
    focusMode: false
  });
  
  // Pour l'instant, utilisons des textes d'exemple le temps de corriger l'architecture
  const allTextes = useMemo(() => {
    if (!exploration || marches.length === 0) return [];
    
    // Textes d'exemple pour chaque marche
    const textes: TexteEnrichi[] = [];
    
    marches.forEach((marcheData, index) => {
      // Créer quelques textes d'exemple pour chaque marche
      const marcheName = marcheData.marche?.nom_marche || marcheData.marche?.ville || 'Marche inconnue';
      
      textes.push({
        id: `${marcheData.marche?.id}-haiku-${index}`,
        marche_id: marcheData.marche?.id || '',
        titre: `Haïku de ${marcheName}`,
        contenu: `Sous les branches vertes\nLa rivière murmure\nL'éternité coule`,
        type_texte: 'haiku' as TextType,
        ordre: index * 3 + 1,
        metadata: { tags: ['nature', 'eau', 'contemplation'] },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        marcheName
      });
      
      textes.push({
        id: `${marcheData.marche?.id}-fragment-${index}`,
        marche_id: marcheData.marche?.id || '',
        titre: `Fragment poétique - ${marcheName}`,
        contenu: `Je marche le long de cette terre qui me raconte ses secrets. Chaque pas révèle une histoire, chaque souffle porte l'écho d'un monde en transformation. Ici, l'humain et le vivant tissent ensemble la trame d'un récit hybride, où la technologie devient sensible et la nature reprend ses droits.`,
        type_texte: 'fragment' as TextType,
        ordre: index * 3 + 2,
        metadata: { tags: ['marche', 'hybride', 'territoire'] },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        marcheName
      });
      
      textes.push({
        id: `${marcheData.marche?.id}-prose-${index}`,
        marche_id: marcheData.marche?.id || '',
        titre: `Prose territoriale - ${marcheName}`,
        contenu: `Dans cette géographie sensible, je découvre les mutations du territoire. Les infrastructures deviennent poétiques, les données se transforment en récit, et le paysage révèle sa complexité hybride. C'est ici que naît "La Fréquence du Vivant", cette symphonie où résonnent ensemble les voix de la terre et de la technologie.`,
        type_texte: 'prose' as TextType,
        ordre: index * 3 + 3,
        metadata: { tags: ['territoire', 'données', 'symphonie'] },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        marcheName
      });
    });
    
    return textes.sort((a, b) => a.ordre - b.ordre);
  }, [exploration, marches]);

  // Calcul des constellations thématiques
  const constellations = useMemo(() => {
    const groups: Record<string, TexteEnrichi[]> = {};
    
    allTextes.forEach(texte => {
      const typeInfo = getTextTypeInfo(texte.type_texte);
      const constellation = typeInfo.family;
      
      if (!groups[constellation]) {
        groups[constellation] = [];
      }
      groups[constellation].push(texte);
    });
    
    return groups;
  }, [allTextes]);

  // Tags disponibles
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    allTextes.forEach(texte => {
      if (texte.metadata?.tags && Array.isArray(texte.metadata.tags)) {
        texte.metadata.tags.forEach((tag: string) => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [allTextes]);

  // Textes filtrés
  const filteredTextes = useMemo(() => {
    return allTextes.filter(texte => {
      // Filtre par type
      if (selectedType !== 'all' && texte.type_texte !== selectedType) {
        return false;
      }
      
      // Filtre par tags
      if (selectedTags.length > 0) {
        const texteTags = texte.metadata?.tags || [];
        if (!Array.isArray(texteTags) || !selectedTags.some(tag => texteTags.includes(tag))) {
          return false;
        }
      }
      
      // Filtre de recherche
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          texte.titre.toLowerCase().includes(query) ||
          texte.contenu.toLowerCase().includes(query) ||
          (texte.marcheName && texte.marcheName.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  }, [allTextes, selectedType, selectedTags, searchQuery]);

  const currentText = selectedTextId ? allTextes.find(t => t.id === selectedTextId) : undefined;

  // Handlers
  const handleTextSelect = (textId: string) => {
    setSelectedTextId(textId);
    setExperienceLevel('immersion');
    toast({
      title: "Immersion activée",
      description: "Entrez dans l'univers du texte..."
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const toggleAmbiance = (key: keyof AmbianceState) => {
    setAmbiance(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loadingExploration || loadingMarches) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="h-12 w-12 text-primary mx-auto" />
          </motion.div>
          <h2 className="text-xl font-semibold text-primary">Préparation de la symphonie...</h2>
          <p className="text-muted-foreground">Composition de l'univers littéraire</p>
        </motion.div>
      </div>
    );
  }

  if (!exploration) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold">Exploration introuvable</h2>
          <p className="text-muted-foreground">Cette symphonie textuelle n'existe pas</p>
          <Link to="/galerie-fleuve">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la galerie
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Éveil Littéraire - Point d'entrée poétique
  if (experienceLevel === 'eveil') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 relative overflow-hidden">
        {/* Particules d'éveil */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Navigation */}
          <motion.div 
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link to={`/galerie-fleuve/exploration/${slug}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'exploration
              </Button>
            </Link>

            <Badge variant="secondary" className="flex items-center gap-2">
              <BookOpen className="h-3 w-3" />
              {allTextes.length} textes littéraires
            </Badge>
          </motion.div>

          {/* Titre de la symphonie */}
          <motion.div 
            className="text-center max-w-4xl mx-auto mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent"
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] 
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Symphonie Textuelle
            </motion.h1>
            <h2 className="text-xl md:text-2xl text-muted-foreground mb-8">
              {exploration.name}
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              Entrez dans un univers où les mots deviennent sensoriels, 
              où chaque texte résonne avec l'âme des territoires explorés.
            </p>
          </motion.div>

          {/* Stats poétiques */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="text-center border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
              <CardContent className="pt-6">
                <motion.div 
                  className="text-3xl font-bold text-primary mb-2"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {Object.keys(constellations).length}
                </motion.div>
                <p className="text-sm text-muted-foreground">Constellations thématiques</p>
              </CardContent>
            </Card>

            <Card className="text-center border-accent/20 bg-gradient-to-b from-accent/5 to-transparent">
              <CardContent className="pt-6">
                <motion.div 
                  className="text-3xl font-bold text-accent mb-2"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  {marches.length}
                </motion.div>
                <p className="text-sm text-muted-foreground">Marches poétiques</p>
              </CardContent>
            </Card>

            <Card className="text-center border-secondary/20 bg-gradient-to-b from-secondary/5 to-transparent">
              <CardContent className="pt-6">
                <motion.div 
                  className="text-3xl font-bold text-secondary mb-2"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                  {availableTags.length}
                </motion.div>
                <p className="text-sm text-muted-foreground">Résonances thématiques</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Invitation à l'exploration */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button 
              size="lg" 
              onClick={() => setExperienceLevel('constellation')}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Stars className="h-5 w-5 mr-2" />
              Entrer dans la constellation
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Constellation Textuelle - Navigation multi-modale
  if (experienceLevel === 'constellation') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
        <div className="container mx-auto px-4 py-6">
          {/* Header avec navigation */}
          <motion.div 
            className="flex items-center justify-between mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              variant="ghost"
              onClick={() => setExperienceLevel('eveil')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Éveil littéraire
            </Button>

            <div className="flex items-center gap-4">
              {/* Contrôles d'ambiance */}
              <Button
                variant={ambiance.soundscape ? "default" : "outline"}
                size="sm"
                onClick={() => toggleAmbiance('soundscape')}
              >
                {ambiance.soundscape ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>

              <Button
                variant={ambiance.visualEffects ? "default" : "outline"}
                size="sm"
                onClick={() => toggleAmbiance('visualEffects')}
              >
                <Sparkles className="h-4 w-4" />
              </Button>

              <Link to={`/galerie-fleuve/exploration/${slug}`}>
                <Button variant="outline" size="sm">
                  Quitter la lecture
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Modes de constellation */}
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tabs value={constellationMode} onValueChange={(value) => setConstellationMode(value as ConstellationMode)}>
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
                <TabsTrigger value="cosmos" className="flex items-center gap-2">
                  <Stars className="h-3 w-3" />
                  Cosmos
                </TabsTrigger>
                <TabsTrigger value="fleuve" className="flex items-center gap-2">
                  <Waves className="h-3 w-3" />
                  Fleuve
                </TabsTrigger>
                <TabsTrigger value="synesthesie" className="flex items-center gap-2">
                  <Palette className="h-3 w-3" />
                  Synesthésie
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>

          {/* Filtres et recherche */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Search className="h-3 w-3" />
                  Navigation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-sm"
                />

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Types</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge
                      variant={selectedType === 'all' ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() => setSelectedType('all')}
                    >
                      Tous
                    </Badge>
                    {Array.from(new Set(allTextes.map(t => t.type_texte))).map(type => {
                      const typeInfo = getTextTypeInfo(type);
                      return (
                        <Badge
                          key={type}
                          variant={selectedType === type ? 'default' : 'outline'}
                          className="cursor-pointer text-xs"
                          onClick={() => setSelectedType(type)}
                        >
                          {typeInfo.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {availableTags.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Résonances</p>
                    <div className="flex flex-wrap gap-1">
                      {availableTags.map(tag => (
                        <Badge
                          key={tag}
                          variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                          className="cursor-pointer text-xs"
                          onClick={() => toggleTag(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Affichage selon le mode */}
            <div className="lg:col-span-3">
              <TabsContent value={constellationMode}>
                {/* Mode Cosmos - Visualisation gravitationnelle */}
                {constellationMode === 'cosmos' && (
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {filteredTextes.map((texte, index) => {
                      const typeInfo = getTextTypeInfo(texte.type_texte);
                      return (
                        <motion.div
                          key={texte.id}
                          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02, y: -5 }}
                          className="cursor-pointer"
                          onClick={() => handleTextSelect(texte.id)}
                        >
                          <Card className="h-full border-primary/20 bg-gradient-to-br from-white to-primary/5 hover:shadow-lg transition-all duration-300">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <motion.div 
                                  className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10"
                                  whileHover={{ rotate: 360 }}
                                  transition={{ duration: 0.6 }}
                                >
                                  {React.createElement(typeInfo.icon === 'Feather' ? Feather : 
                                                    typeInfo.icon === 'TreePine' ? TreePine : 
                                                    typeInfo.icon === 'Globe' ? Globe : 
                                                    BookOpen, 
                                    { className: "h-4 w-4 text-primary" })}
                                </motion.div>
                                <Badge variant="secondary" className="text-xs">
                                  {typeInfo.label}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <h3 className="font-semibold mb-2 line-clamp-1">{texte.titre}</h3>
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {texte.contenu.length > 100 
                                  ? `${texte.contenu.substring(0, 100)}...`
                                  : texte.contenu
                                }
                              </p>
                              {texte.marcheName && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {texte.marcheName}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}

                {/* Mode Fleuve - Navigation chronologique fluide */}
                {constellationMode === 'fleuve' && (
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="relative">
                      {/* Ligne de fleuve */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-secondary"></div>
                      
                      {filteredTextes.map((texte, index) => {
                        const typeInfo = getTextTypeInfo(texte.type_texte);
                        return (
                          <motion.div
                            key={texte.id}
                            className="relative pl-16 pb-8"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.2 }}
                          >
                            {/* Point sur la ligne */}
                            <motion.div 
                              className="absolute left-4 top-4 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-lg"
                              whileHover={{ scale: 1.3 }}
                            />
                            
                            <Card 
                              className="cursor-pointer hover:shadow-md transition-all duration-300 border-l-4 border-l-primary/50"
                              onClick={() => handleTextSelect(texte.id)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="font-semibold">{texte.titre}</h3>
                                  <Badge variant="outline" className="text-xs">
                                    {typeInfo.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {texte.contenu.substring(0, 150)}...
                                </p>
                                {texte.marcheName && (
                                  <p className="text-xs text-muted-foreground">
                                    → {texte.marcheName}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Mode Synesthésie - Association sensorielle */}
                {constellationMode === 'synesthesie' && (
                  <motion.div 
                    className="space-y-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {Object.entries(constellations).map(([constellation, textes]) => {
                      const visibleTextes = textes.filter(t => filteredTextes.includes(t));
                      if (visibleTextes.length === 0) return null;

                      const colorMap: Record<string, string> = {
                        'contemplation': 'from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800',
                        'narration': 'from-green-100 to-green-200 dark:from-green-900 dark:to-green-800',
                        'hybride': 'from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800',
                        'experimental': 'from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800',
                      };

                      return (
                        <motion.div
                          key={constellation}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`rounded-lg p-6 bg-gradient-to-r ${colorMap[constellation] || 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700'}`}
                        >
                          <h3 className="font-bold text-lg mb-4 capitalize flex items-center gap-2">
                            <Heart className="h-5 w-5" />
                            {constellation}
                            <Badge variant="secondary" className="ml-2">
                              {visibleTextes.length}
                            </Badge>
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {visibleTextes.map(texte => {
                              const typeInfo = getTextTypeInfo(texte.type_texte);
                              return (
                                <motion.div
                                  key={texte.id}
                                  whileHover={{ scale: 1.02 }}
                                  className="cursor-pointer"
                                  onClick={() => handleTextSelect(texte.id)}
                                >
                                  <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-md transition-all">
                                    <CardContent className="p-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline" className="text-xs">
                                          {typeInfo.label}
                                        </Badge>
                                      </div>
                                      <h4 className="font-semibold mb-1">{texte.titre}</h4>
                                      <p className="text-sm text-muted-foreground line-clamp-2">
                                        {texte.contenu.substring(0, 120)}...
                                      </p>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              );
                            })}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </TabsContent>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Immersion Adaptative - Lecture contextuelle
  if (experienceLevel === 'immersion' && currentText) {
    const typeInfo = getTextTypeInfo(currentText.type_texte);
    
    return (
      <div className={`min-h-screen transition-all duration-1000 ${
        ambiance.focusMode 
          ? 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'
          : 'bg-gradient-to-br from-background via-primary/5 to-accent/5'
      }`}>
        
        {/* Header flottant */}
        <motion.div 
          className={`sticky top-0 z-50 backdrop-blur-sm border-b transition-all duration-300 ${
            ambiance.focusMode 
              ? 'bg-background/60' 
              : 'bg-background/80'
          }`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExperienceLevel('constellation')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Constellation
                </Button>
                
                <Badge variant="outline" className="flex items-center gap-1">
                  {React.createElement(typeInfo.icon === 'Feather' ? Feather : 
                                    typeInfo.icon === 'TreePine' ? TreePine : 
                                    typeInfo.icon === 'Globe' ? Globe : 
                                    BookOpen, 
                    { className: "h-3 w-3" })}
                  {typeInfo.label}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={ambiance.focusMode ? "default" : "ghost"}
                  size="sm"
                  onClick={() => toggleAmbiance('focusMode')}
                  title="Mode focus"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                
                <Button variant="ghost" size="sm" title="Marquer">
                  <Bookmark className="h-4 w-4" />
                </Button>
                
                <Button variant="ghost" size="sm" title="Partager">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contenu principal */}
        <div className="container mx-auto px-4 py-8">
          <motion.div 
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className={`border-none shadow-xl backdrop-blur-sm ${
              ambiance.focusMode 
                ? 'bg-white/95 dark:bg-gray-800/95' 
                : 'bg-white/90 dark:bg-gray-800/90'
            }`}>
              <CardHeader className="text-center pb-6">
                <motion.h1 
                  className={`text-3xl md:text-4xl font-bold mb-4 text-primary`}
                  style={{ fontFamily: typeInfo.adaptiveStyle?.fontFamily }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {currentText.titre}
                </motion.h1>
                
                {currentText.marcheName && (
                  <motion.p 
                    className="text-muted-foreground flex items-center justify-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <Eye className="h-4 w-4" />
                    {currentText.marcheName}
                  </motion.p>
                )}
              </CardHeader>

              <CardContent className="px-8 pb-8">
                <motion.div 
                  className={`prose prose-lg dark:prose-invert max-w-none text-center`}
                  style={{ 
                    fontFamily: typeInfo.adaptiveStyle?.fontFamily,
                    lineHeight: typeInfo.adaptiveStyle?.lineHeight,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.8 }}
                  dangerouslySetInnerHTML={{ __html: currentText.contenu }}
                />

                {/* Métadonnées et tags */}
                {currentText.metadata?.tags && (
                  <motion.div 
                    className="flex flex-wrap justify-center gap-2 mt-8 pt-6 border-t"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                  >
                    {currentText.metadata.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Navigation vers textes connexes */}
            <motion.div 
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
            >
              <Button
                variant="outline"
                onClick={() => setExperienceLevel('constellation')}
                className="bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
              >
                <Stars className="h-4 w-4 mr-2" />
                Découvrir d'autres résonances
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Effets visuels ambiants */}
        {ambiance.visualEffects && !ambiance.focusMode && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-primary/10 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  scale: [0.5, 1, 0.5],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}