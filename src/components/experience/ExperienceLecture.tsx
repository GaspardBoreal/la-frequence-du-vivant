// Phase 2.2: Component for "Lire" mode - Textual navigation by tags and types

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useExploration } from '@/hooks/useExplorations';
import { useExplorationContext } from '@/contexts/ExplorationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Tag, 
  ArrowLeft,
  ArrowRight,
  Search,
  Filter,
  Hash,
  MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface TextFilter {
  type: 'all' | 'poeme' | 'haiku' | 'haibun' | 'prose';
  tags: string[];
  search: string;
}

export default function ExperienceLecture() {
  const { slug } = useParams<{ slug: string }>();
  const { data: exploration, isLoading } = useExploration(slug || '');
  const { state, setCurrentMode, setTextContent } = useExplorationContext();
  
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [filter, setFilter] = useState<TextFilter>({
    type: 'all',
    tags: [],
    search: ''
  });
  const [viewMode, setViewMode] = useState<'sequential' | 'thematic'>('sequential');

  // Set current mode
  useEffect(() => {
    setCurrentMode('lire');
  }, [setCurrentMode]);

  // Available text types and tags
  const textTypes = useMemo(() => {
    const types = new Set(state.textContent.map(text => text.type));
    return Array.from(types);
  }, [state.textContent]);

  const allTags = useMemo(() => {
    const tags = new Set(state.textContent.flatMap(text => text.tags));
    return Array.from(tags).sort();
  }, [state.textContent]);

  // Filtered content
  const filteredContent = useMemo(() => {
    return state.textContent.filter(text => {
      // Type filter
      if (filter.type !== 'all' && text.type !== filter.type) {
        return false;
      }
      
      // Tags filter
      if (filter.tags.length > 0) {
        const hasTag = filter.tags.some(tag => text.tags.includes(tag));
        if (!hasTag) return false;
      }
      
      // Search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchTitle = text.title.toLowerCase().includes(searchLower);
        const matchContent = text.content.toLowerCase().includes(searchLower);
        const matchTags = text.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchTitle && !matchContent && !matchTags) return false;
      }
      
      return true;
    });
  }, [state.textContent, filter]);

  const currentText = filteredContent[currentTextIndex];

  const handlePrevious = () => {
    if (currentTextIndex > 0) {
      setCurrentTextIndex(currentTextIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentTextIndex < filteredContent.length - 1) {
      setCurrentTextIndex(currentTextIndex + 1);
    }
  };

  const handleTagToggle = (tag: string) => {
    setFilter(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
    setCurrentTextIndex(0); // Reset to first item when filter changes
  };

  const handleTypeChange = (type: TextFilter['type']) => {
    setFilter(prev => ({ ...prev, type }));
    setCurrentTextIndex(0);
  };

  const handleSearchChange = (search: string) => {
    setFilter(prev => ({ ...prev, search }));
    setCurrentTextIndex(0);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'poeme': return '📝';
      case 'haiku': return '🎋';
      case 'haibun': return '🌸';
      case 'prose': return '📖';
      default: return '📄';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'poeme': return 'Poème';
      case 'haiku': return 'Haïku';
      case 'haibun': return 'Haïbun';
      case 'prose': return 'Prose';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!exploration) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Exploration non trouvée</h2>
          <Link to="/galerie-fleuve">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la galerie
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <Link to="/galerie-fleuve">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'exploration
              </Button>
            </Link>
            <Badge variant="secondary" className="flex items-center gap-2">
              <BookOpen className="h-3 w-3" />
              {filteredContent.length} textes
            </Badge>
          </div>
          
          <h1 className="text-4xl font-bold mb-2">{exploration.name}</h1>
          <h2 className="text-xl text-muted-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Lecture Textuelle
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filters Sidebar */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtres
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recherche</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={filter.search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type de texte</label>
                  <div className="space-y-1">
                    <Button
                      variant={filter.type === 'all' ? 'default' : 'outline'}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleTypeChange('all')}
                    >
                      Tous les types
                    </Button>
                    {textTypes.map(type => (
                      <Button
                        key={type}
                        variant={filter.type === type ? 'default' : 'outline'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleTypeChange(type as TextFilter['type'])}
                      >
                        <span className="mr-2">{getTypeIcon(type)}</span>
                        {getTypeLabel(type)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Tags Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {allTags.map(tag => (
                      <Badge
                        key={tag}
                        variant={filter.tags.includes(tag) ? 'default' : 'outline'}
                        className="cursor-pointer text-xs"
                        onClick={() => handleTagToggle(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* View Mode */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mode de navigation</label>
                  <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as typeof viewMode)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="sequential">Séquentiel</TabsTrigger>
                      <TabsTrigger value="thematic">Thématique</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div 
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {filteredContent.length > 0 ? (
              <div className="space-y-6">
                
                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentTextIndex === 0}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Précédent
                  </Button>
                  
                  <Badge variant="secondary">
                    {currentTextIndex + 1} / {filteredContent.length}
                  </Badge>
                  
                  <Button
                    variant="outline"
                    onClick={handleNext}
                    disabled={currentTextIndex >= filteredContent.length - 1}
                  >
                    Suivant
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                {/* Current Text */}
                <AnimatePresence mode="wait">
                  {currentText && (
                    <motion.div
                      key={currentText.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <CardTitle className="flex items-center gap-3">
                                <span className="text-2xl">{getTypeIcon(currentText.type)}</span>
                                {currentText.title}
                              </CardTitle>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <Badge variant="outline">
                                  {getTypeLabel(currentText.type)}
                                </Badge>
                                {currentText.marcheName && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {currentText.marcheName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            
                            {/* Content */}
                            <div className="prose prose-lg dark:prose-invert max-w-none">
                              <div 
                                className="whitespace-pre-line leading-relaxed"
                                style={{ fontFamily: currentText.type === 'haiku' ? 'serif' : 'inherit' }}
                              >
                                {currentText.content}
                              </div>
                            </div>

                            {/* Tags */}
                            {currentText.tags.length > 0 && (
                              <div className="flex items-center gap-2 pt-4 border-t">
                                <Tag className="h-4 w-4 text-muted-foreground" />
                                <div className="flex flex-wrap gap-1">
                                  {currentText.tags.map(tag => (
                                    <Badge 
                                      key={tag} 
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Quick Navigation Grid (Thematic Mode) */}
                {viewMode === 'thematic' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>Navigation thématique</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {filteredContent.map((text, index) => (
                            <div
                              key={text.id}
                              className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                                index === currentTextIndex 
                                  ? 'bg-primary/10 border-primary' 
                                  : 'hover:bg-muted/50 border-border'
                              }`}
                              onClick={() => setCurrentTextIndex(index)}
                            >
                              <div className="flex items-start gap-2">
                                <span className="text-lg">{getTypeIcon(text.type)}</span>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm truncate">
                                    {text.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {getTypeLabel(text.type)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Aucun texte trouvé</h3>
                    <p className="text-muted-foreground">
                      Essayez de modifier vos filtres pour trouver du contenu.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}