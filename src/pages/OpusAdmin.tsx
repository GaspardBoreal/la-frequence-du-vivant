import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SEOHead from '@/components/SEOHead';
import DecorativeParticles from '@/components/DecorativeParticles';
import { OpusContexteEditor } from '@/components/opus/OpusContexteEditor';
import { FableWorkshop } from '@/components/opus/FableWorkshop';
import { PrefigurerInterface } from '@/components/opus/PrefigurerInterface';
import { useOpusExploration, useOpusContextes } from '@/hooks/useOpus';
import { useExplorationMarches } from '@/hooks/useExplorations';
import { 
  ArrowLeft, 
  Waves, 
  BookOpen, 
  Sparkles, 
  MapPin,
  BarChart3,
  Settings
} from 'lucide-react';

const OpusAdmin: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [selectedMarche, setSelectedMarche] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'contextes' | 'fables' | 'prefigurer'>('contextes');
  
  const { data: opus, isLoading: opusLoading } = useOpusExploration(slug || '');
  const { data: contextes, isLoading: contextesLoading } = useOpusContextes(opus?.id || '');
  const { data: marches, isLoading: marchesLoading } = useExplorationMarches(opus?.id || '');

  if (opusLoading || contextesLoading || marchesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Chargement de l'OPUS...</p>
        </div>
      </div>
    );
  }

  if (!opus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">OPUS introuvable</h1>
          <Button onClick={() => navigate('/admin/explorations')}>
            Retour aux explorations
          </Button>
        </div>
      </div>
    );
  }

  // Mode Préfigurer plein écran
  if (activeMode === 'prefigurer') {
    return <PrefigurerInterface opusSlug={slug || ''} onClose={() => setActiveMode('contextes')} />;
  }

  return (
    <>
      <SEOHead 
        title={`Admin OPUS - ${opus.nom}`}
        description={`Interface d'administration pour l'OPUS ${opus.nom}`}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 relative overflow-hidden">
        <DecorativeParticles />
        
        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin/explorations')}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{opus.nom}</h1>
                <p className="text-blue-200">{opus.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600 text-white">
                {opus.theme_principal}
              </Badge>
              {opus.published && (
                <Badge className="bg-green-600 text-white">
                  Publié
                </Badge>
              )}
            </div>
          </div>

          {/* Navigation principale */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                activeMode === 'contextes' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-slate-50'
              }`}
              onClick={() => setActiveMode('contextes')}
            >
              <CardHeader className="text-center">
                <Waves className="h-12 w-12 mx-auto text-blue-600 mb-2" />
                <CardTitle>Symphonie Contextuelle</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Gestion des 8 dimensions par marche
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {contextes?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Contextes hybrides
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                activeMode === 'fables' ? 'ring-2 ring-orange-500 bg-orange-50' : 'hover:bg-slate-50'
              }`}
              onClick={() => setActiveMode('fables')}
            >
              <CardHeader className="text-center">
                <BookOpen className="h-12 w-12 mx-auto text-orange-600 mb-2" />
                <CardTitle>Atelier des Fables</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Création narrative avec variations
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {marches?.reduce((acc, m) => acc + (((m as any)?.fables?.length) || 0), 0) || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Fables créées
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                (activeMode as string) === 'prefigurer' ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:bg-slate-50'
              }`}
              onClick={() => setActiveMode('prefigurer')}
            >
              <CardHeader className="text-center">
                <Sparkles className="h-12 w-12 mx-auto text-purple-600 mb-2" />
                <CardTitle>Préfigurer</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Interface immersive révolutionnaire
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">4</div>
                  <div className="text-sm text-muted-foreground">
                    Modes d'expérience
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Zone de contenu principal */}
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardContent className="p-6">
              {activeMode === 'contextes' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Contextes Hybrides des Marches</h2>
                    <div className="text-sm text-muted-foreground">
                      {marches?.length || 0} marches • {contextes?.length || 0} contextes
                    </div>
                  </div>
                  
                  {!selectedMarche ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {marches?.map((marche) => (
                        <Card 
                          key={marche.id}
                          className="cursor-pointer hover:shadow-lg transition-all duration-300"
                          onClick={() => setSelectedMarche(marche.id)}
                        >
                          <CardHeader>
                            <div className="flex items-start gap-3">
                              <MapPin className="h-5 w-5 text-blue-600 mt-1" />
                              <div className="flex-1">
                                <CardTitle className="text-lg line-clamp-2">
                                  {marche.marche?.nom_marche || marche.marche?.ville}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  {marche.marche?.ville} • {marche.marche?.region}
                                </p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-muted-foreground">
                                {(marche.marche?.photos?.length || 0)} photos • {(marche.marche?.audio?.length || 0)} audio
                              </div>
                              <Badge variant="outline">
                                Configurer
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <OpusContexteEditor
                      marcheId={selectedMarche}
                      marcheName={marches?.find(m => m.id === selectedMarche)?.marche?.nom_marche || 'Marche'}
                      onClose={() => setSelectedMarche(null)}
                    />
                  )}
                </div>
              )}
              
              {activeMode === 'fables' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Atelier des Fables Narratives</h2>
                  
                  {!selectedMarche ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {marches?.map((marche) => (
                        <Card 
                          key={marche.id}
                          className="cursor-pointer hover:shadow-lg transition-all duration-300"
                          onClick={() => setSelectedMarche(marche.id)}
                        >
                          <CardHeader>
                            <div className="flex items-start gap-3">
                              <BookOpen className="h-5 w-5 text-orange-600 mt-1" />
                              <div className="flex-1">
                                <CardTitle className="text-lg line-clamp-2">
                                  {marche.marche?.nom_marche || marche.marche?.ville}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  {marche.marche?.ville} • {marche.marche?.region}
                                </p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-muted-foreground">
                                {(marche as any)?.fables?.length || 0} fables
                              </div>
                              <Badge variant="outline">
                                Créer / Éditer
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <FableWorkshop
                      marcheId={selectedMarche}
                      marcheName={marches?.find(m => m.id === selectedMarche)?.marche?.nom_marche || 'Marche'}
                      opusId={opus.id}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default OpusAdmin;