import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useExploration, useExplorationMarches, useNarrativeLandscapes, useTrackClick } from '@/hooks/useExplorations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import SEOHead from '@/components/SEOHead';
import { MapPin, Calendar, Eye, ArrowLeft } from 'lucide-react';

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
      
      <div className="min-h-screen relative overflow-hidden">
        {/* Arrière-plan immersif */}
        <div className="absolute inset-0 bg-gradient-to-br from-gaspard-dark via-gaspard-emerald to-gaspard-forest"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-gaspard-sage/30 via-transparent to-gaspard-mint/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(29,90,74,0.3),transparent_70%)]"></div>
        
        {/* Hero Section */}
        <div className="relative">
          {exploration.cover_image_url && (
            <div className="h-96 overflow-hidden">
              <img 
                src={exploration.cover_image_url} 
                alt={exploration.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gaspard-dark/80 via-gaspard-emerald/40 to-transparent" />
            </div>
          )}
          
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-4 pb-12">
              <div className="max-w-4xl">
                {/* Bouton retour en haut */}
                <Link 
                  to="/explorations"
                  className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-gaspard-cream/20 hover:bg-gaspard-cream/30 text-gaspard-cream border border-gaspard-cream/30 hover:border-gaspard-cream/50 rounded-full transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="font-medium">Retour aux explorations</span>
                </Link>
                
                <h1 className="gaspard-main-title text-4xl md:text-6xl font-bold text-gaspard-cream mb-4 drop-shadow-lg">
                  {exploration.name}
                </h1>
                {exploration.description && (
                  <p className="gaspard-category text-xl text-gaspard-cream/90 leading-relaxed drop-shadow-md font-light">
                    {exploration.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Paysages Narratifs */}
              {narratives && narratives.length > 0 && (
                <Card className="gaspard-glass border-gaspard-cream/20 bg-gaspard-cream/10 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="gaspard-main-title text-2xl text-gaspard-cream flex items-center">
                      <Eye className="h-6 w-6 mr-2 text-gaspard-gold" />
                      Paysages Narratifs
                    </CardTitle>
                    <CardDescription className="text-gaspard-cream/70">
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
                          <Card className="gaspard-card transition-all duration-300 hover:shadow-xl hover:shadow-gaspard-gold/20 hover:-translate-y-1 border-gaspard-cream/20 group-hover:border-gaspard-gold/40 bg-gaspard-cream/5 backdrop-blur-sm">
                            <CardHeader className="pb-4">
                              <CardTitle className="gaspard-main-title text-lg text-gaspard-cream group-hover:text-gaspard-gold transition-colors">
                                {narrative.name}
                              </CardTitle>
                              {narrative.description && (
                                <CardDescription className="line-clamp-2 text-gaspard-cream/70">
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
                <Card className="gaspard-glass border-gaspard-cream/20 bg-gaspard-cream/10 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="gaspard-main-title text-2xl text-gaspard-cream flex items-center">
                      <MapPin className="h-6 w-6 mr-2 text-gaspard-gold" />
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
                            <Card className="gaspard-card transition-all duration-300 hover:shadow-xl hover:shadow-gaspard-gold/20 hover:-translate-y-1 border-gaspard-cream/20 group-hover:border-gaspard-gold/40 bg-gaspard-cream/5 backdrop-blur-sm">
                              <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle className="gaspard-main-title text-lg text-gaspard-cream group-hover:text-gaspard-gold transition-colors">
                                      {marche.nom_marche || marche.ville}
                                    </CardTitle>
                                    <div className="flex items-center text-sm text-gaspard-cream/70 mt-2">
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
                                  <CardDescription className="line-clamp-2 mt-2 text-gaspard-cream/70">
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
                <Card className="gaspard-glass border-gaspard-cream/20 bg-gaspard-cream/10 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="gaspard-main-title text-lg text-gaspard-cream">Thématiques</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {exploration.meta_keywords.map((keyword, index) => (
                        <Badge key={index} className="bg-gaspard-gold/20 text-gaspard-cream border-gaspard-gold/30 hover:bg-gaspard-gold/30">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Navigation */}
              <Card className="gaspard-glass border-gaspard-cream/20 bg-gaspard-cream/10 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="gaspard-main-title text-lg text-gaspard-cream">Navigation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to="/explorations">
                    <Button className="w-full justify-start bg-gaspard-gold/30 text-gaspard-cream border-gaspard-gold/50 hover:bg-gaspard-gold/50 hover:text-white hover:scale-105 transition-all duration-300 shadow-lg">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Toutes les explorations
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Texture de fond subtile */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')]"></div>
        </div>
      </div>
    </>
  );
};

export default ExplorationDetail;