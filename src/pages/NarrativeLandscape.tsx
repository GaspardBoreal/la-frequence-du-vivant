import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNarrativeLandscape, useTrackClick } from '@/hooks/useExplorations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import SEOHead from '@/components/SEOHead';
import { ArrowLeft, Eye } from 'lucide-react';

const NarrativeLandscape = () => {
  const { slug, narrativeSlug } = useParams<{ slug: string; narrativeSlug: string }>();
  const trackClick = useTrackClick();
  
  const { data: narrative, isLoading, error } = useNarrativeLandscape(slug!, narrativeSlug!);

  useEffect(() => {
    if (narrative?.id) {
      trackClick.mutate({
        narrative_id: narrative.id,
        action: 'view_narrative'
      });
    }
  }, [narrative?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-sage-100 py-12">
        <div className="container mx-auto px-4">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !narrative) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-sage-100 py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-sage-800 mb-4">Paysage narratif introuvable</h1>
          <p className="text-sage-600 mb-8">Ce paysage narratif n'existe pas ou n'est plus disponible.</p>
          <Link to={`/explorations/${slug}`}>
            <Button>Retour à l'exploration</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title={narrative.meta_title || `${narrative.name} - Paysage Narratif`}
        description={narrative.meta_description || narrative.description || ''}
        keywords={narrative.meta_keywords.join(', ')}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-sage-100">
        {/* Hero Section */}
        <div className="relative">
          {narrative.cover_image_url && (
            <div className="h-96 overflow-hidden">
              <img 
                src={narrative.cover_image_url} 
                alt={narrative.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>
          )}
          
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-4 pb-12">
              <div className="max-w-4xl">
                <Link 
                  to={`/explorations/${slug}`}
                  className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à l'exploration
                </Link>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                  {narrative.name}
                </h1>
                {narrative.description && (
                  <p className="text-xl text-white/90 leading-relaxed drop-shadow-md">
                    {narrative.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/80 backdrop-blur-sm border-sage-200">
              <CardHeader>
                <CardTitle className="text-2xl text-sage-800 flex items-center">
                  <Eye className="h-6 w-6 mr-2" />
                  Paysage Narratif
                </CardTitle>
                <CardDescription>
                  Une perspective unique sur cette exploration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose prose-sage max-w-none">
                  <p className="text-sage-700 leading-relaxed">
                    Ce paysage narratif révèle une dimension particulière de l'exploration "{slug}".
                    Il offre un angle d'approche spécifique qui enrichit votre compréhension du territoire 
                    et des marches qui le composent.
                  </p>
                  
                  {narrative.ai_prompt && (
                    <div className="mt-8 p-6 bg-sage-50 rounded-lg border-l-4 border-sage-300">
                      <h3 className="text-lg font-semibold text-sage-800 mb-3">
                        Vision créative
                      </h3>
                      <p className="text-sage-700 italic">
                        {narrative.ai_prompt}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-center pt-8">
                  <Link to={`/explorations/${slug}`}>
                    <Button variant="outline" className="bg-white hover:bg-sage-50">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Retour à l'exploration
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default NarrativeLandscape;