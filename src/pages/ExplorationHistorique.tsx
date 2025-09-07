import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, FileText, Image, Filter } from 'lucide-react';
import { useExploration, useExplorationMarches } from '@/hooks/useExplorations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import SEOHead from '@/components/SEOHead';

export default function ExplorationHistorique() {
  const { slug } = useParams<{ slug: string }>();
  const { data: exploration, isLoading: explorationLoading } = useExploration(slug || '');
  const { data: explorationMarches, isLoading: marchesLoading } = useExplorationMarches(exploration?.id || '');
  
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [marcheFilter, setMarcheFilter] = useState('all');

  if (explorationLoading || marchesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-primary/10 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
        <span className="ml-4 text-lg">Chargement des archives historiques...</span>
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

  // Collecte des fichiers historiques de toutes les marches
  const historicalFiles = explorationMarches?.flatMap(expMarche => {
    if (!expMarche.marche) return [];
    
    const marche = expMarche.marche;
    const files = [];
    
    // Photos avec métadonnées historiques
    marche.photos?.forEach(photo => {
      files.push({
        id: photo.id,
        type: 'image',
        title: photo.titre || `Photo de ${marche.ville}`,
        description: photo.description || '',
        url: photo.url_supabase,
        marcheVille: marche.ville,
        marcheNom: marche.nom_marche || marche.ville,
        date: marche.date || 'Date inconnue'
      });
    });

    // Documents PDF et autres
    marche.documents?.forEach(doc => {
      files.push({
        id: doc.id,
        type: 'document',
        title: doc.titre || `Document ${doc.id}`,
        description: doc.description || '',
        url: doc.url_supabase,
        marcheVille: marche.ville,
        marcheNom: marche.nom_marche || marche.ville,
        date: marche.date || 'Date inconnue'
      });
    });

    return files;
  }) || [];

  // Filtrage des fichiers
  const filteredFiles = historicalFiles.filter(file => {
    const matchesSearch = !searchFilter || 
      file.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      file.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      file.marcheVille.toLowerCase().includes(searchFilter.toLowerCase());
    
    const matchesType = typeFilter === 'all' || file.type === typeFilter;
    
    const matchesMarche = marcheFilter === 'all' || file.marcheVille === marcheFilter;
    
    return matchesSearch && matchesType && matchesMarche;
  });

  // Liste unique des villes pour le filtre
  const uniqueMarches = [...new Set(historicalFiles.map(f => f.marcheVille))].sort();

  const title = `Recherche Historique · ${exploration.name}`;
  const description = `Explorez les archives historiques, vignettes et documents de l'exploration ${exploration.name}. ${historicalFiles.length} fichiers disponibles.`;
  const canonical = `${window.location.origin}/galerie-fleuve/exploration/${exploration.slug}/historique`;

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
                <Link to={`/galerie-fleuve`}>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour à l'exploration
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-white">Recherche Historique</h1>
                  <p className="text-white/70">{exploration.name}</p>
                </div>
              </div>
              <Badge className="bg-white/20 text-white border-white/30">
                <FileText className="h-3 w-3 mr-1" />
                {filteredFiles.length} fichiers
              </Badge>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <Filter className="h-5 w-5 text-white" />
              <h3 className="text-lg font-semibold text-white">Filtres de recherche</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Recherche</label>
                <Input
                  placeholder="Titre, description, ville..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Type de fichier</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="document">Documents PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Marche</label>
                <Select value={marcheFilter} onValueChange={setMarcheFilter}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les marches</SelectItem>
                    {uniqueMarches.map(ville => (
                      <SelectItem key={ville} value={ville}>{ville}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Grille des fichiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFiles.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20 hover:bg-white/15 transition-colors"
              >
                {file.type === 'image' ? (
                  <div className="aspect-video bg-gray-200 relative overflow-hidden">
                    <img 
                      src={file.url} 
                      alt={file.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-black/50 text-white border-0">
                        <Image className="h-3 w-3 mr-1" />
                        Image
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center relative">
                    <FileText className="h-16 w-16 text-red-300" />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-red-500/80 text-white border-0">
                        <FileText className="h-3 w-3 mr-1" />
                        PDF
                      </Badge>
                    </div>
                  </div>
                )}
                
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-2 line-clamp-2">{file.title}</h3>
                  <p className="text-white/70 text-sm mb-3 line-clamp-2">{file.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="text-xs text-white/60">
                      <span className="font-medium">Marche:</span> {file.marcheNom}
                    </div>
                    <div className="text-xs text-white/60">
                      <span className="font-medium">Date:</span> {file.date}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 text-white border-white/20 hover:bg-white/10"
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      Voir
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-white border-white/20 hover:bg-white/10"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = file.url;
                        link.download = file.title;
                        link.click();
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredFiles.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-white/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Aucun fichier trouvé</h3>
              <p className="text-white/70">Essayez de modifier vos critères de recherche.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}