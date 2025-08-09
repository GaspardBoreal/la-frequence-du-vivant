import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useExploration, useExplorationMarches, useNarrativeLandscapes, useTrackClick } from '@/hooks/useExplorations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import SEOHead from '@/components/SEOHead';
import { MapPin, Calendar, Eye } from 'lucide-react';

const ExplorationDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const trackClick = useTrackClick();
  
  const { data: exploration, isLoading: explorationLoading, error: explorationError } = useExploration(slug!);
  const { data: marches, isLoading: marchesLoading } = useExplorationMarches(exploration?.id || '');
  const { data: narratives, isLoading: narrativesLoading } = useNarrativeLandscapes(exploration?.id || '');

  useEffect(() => {
    if (exploration?.id) {
      trackClick.mutate({
        exploration_id: exploration.id,
        action: 'view_exploration'
      });
    }
  }, [exploration?.id]);

  if (explorationLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-sage-100 py-12">
        <div className="container mx-auto px-4">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-full mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-64 w-full mb-6" />
            </div>
            <div>
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (explorationError || !exploration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-sage-100 py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-sage-800 mb-4">Exploration introuvable</h1>
          <p className="text-sage-600 mb-8">Cette exploration n'existe pas ou n'est plus disponible.</p>
          <Link to="/explorations">
            <Button>Retour aux explorations</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title={exploration.meta_title || `${exploration.name} - Explorations`}
        description={exploration.meta_description || exploration.description || ''}
        keywords={exploration.meta_keywords.join(', ')}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-sage-100">
        {/* Hero Section */}
        <div className="relative">
          {exploration.cover_image_url && (
            <div className="h-96 overflow-hidden">
              <img 
                src={exploration.cover_image_url} 
                alt={exploration.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>
          )}
          
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-4 pb-12">
              <div className="max-w-4xl">
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                  {exploration.name}
                </h1>
                {exploration.description && (
                  <p className="text-xl text-white/90 leading-relaxed drop-shadow-md">
                    {exploration.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Paysages Narratifs */}
              {narratives && narratives.length > 0 && (
                <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
                  <CardHeader>
                    <CardTitle className="text-2xl text-sage-800 flex items-center">
                      <Eye className="h-6 w-6 mr-2" />
                      Paysages Narratifs
                    </CardTitle>
                    <CardDescription>
                      Découvrez cette exploration sous différents angles narratifs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {narratives.map((narrative) => (
                        <Link 
                          key={narrative.id}
                          to={`/explorations/${slug}/${narrative.slug}`}
                          className="group"
                        >
                          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-sage-100 group-hover:border-sage-300">
                            <CardHeader className="pb-4">
                              <CardTitle className="text-lg text-sage-800 group-hover:text-sage-600 transition-colors">
                                {narrative.name}
                              </CardTitle>
                              {narrative.description && (
                                <CardDescription className="line-clamp-2">
                                  {narrative.description}
                                </CardDescription>
                              )}
                            </CardHeader>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Marches */}
              {marches && marches.length > 0 && (
                <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
                  <CardHeader>
                    <CardTitle className="text-2xl text-sage-800 flex items-center">
                      <MapPin className="h-6 w-6 mr-2" />
                      Marches de cette exploration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {marches.map((marcheItem) => {
                        const marche = marcheItem.marche;
                        if (!marche) return null;
                        
                        return (
                          <Link 
                            key={marcheItem.id}
                            to={`/marches/${marche.id}`}
                            className="group"
                            onClick={() => trackClick.mutate({
                              exploration_id: exploration.id,
                              marche_id: marche.id,
                              action: 'click_marche'
                            })}
                          >
                            <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-sage-100 group-hover:border-sage-300">
                              <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle className="text-lg text-sage-800 group-hover:text-sage-600 transition-colors">
                                      {marche.nom_marche || marche.ville}
                                    </CardTitle>
                                    <div className="flex items-center text-sm text-sage-600 mt-2">
                                      <MapPin className="h-4 w-4 mr-1" />
                                      {marche.ville}
                                      {marche.date && (
                                        <>
                                          <Calendar className="h-4 w-4 ml-4 mr-1" />
                                          {marche.date}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {marche.descriptif_court && (
                                  <CardDescription className="line-clamp-2 mt-2">
                                    {marche.descriptif_court}
                                  </CardDescription>
                                )}
                              </CardHeader>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Keywords */}
              {exploration.meta_keywords.length > 0 && (
                <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-sage-800">Thématiques</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {exploration.meta_keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Navigation */}
              <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
                <CardHeader>
                  <CardTitle className="text-lg text-sage-800">Navigation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to="/explorations">
                    <Button variant="outline" className="w-full justify-start">
                      ← Toutes les explorations
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExplorationDetail;