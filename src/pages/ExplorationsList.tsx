import React from 'react';
import { Link } from 'react-router-dom';
import { useExplorations } from '@/hooks/useExplorations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import SEOHead from '@/components/SEOHead';

const ExplorationsList = () => {
  const { data: explorations, isLoading, error } = useExplorations();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-sage-100 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-128 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-sage-100 py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-sage-800 mb-4">Erreur</h1>
          <p className="text-sage-600">Impossible de charger les explorations.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="Explorations - La Fréquence du Vivant"
        description="Découvrez les explorations thématiques de Gaspard à travers ses marches poétiques et sensorielles."
        keywords="explorations, marches, poésie, nature, biodiversité"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-sage-100 py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-sage-800 mb-6">
              Explorations
            </h1>
            <p className="text-xl text-sage-600 max-w-3xl mx-auto leading-relaxed">
              Plongez dans les univers thématiques de "La Fréquence du Vivant" à travers 
              des explorations qui révèlent la poésie du monde vivant.
            </p>
          </div>

          {/* Explorations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {explorations?.map((exploration) => (
              <Link 
                key={exploration.id} 
                to={`/explorations/${exploration.slug}`}
                className="group"
              >
                <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white/80 backdrop-blur-sm border-sage-200 group-hover:border-sage-300">
                  {exploration.cover_image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={exploration.cover_image_url} 
                        alt={exploration.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl text-sage-800 group-hover:text-sage-600 transition-colors">
                      {exploration.name}
                    </CardTitle>
                    {exploration.description && (
                      <CardDescription className="text-sage-600 line-clamp-3">
                        {exploration.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {exploration.meta_keywords.slice(0, 3).map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {explorations?.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-2xl font-semibold text-sage-700 mb-4">
                Aucune exploration disponible
              </h3>
              <p className="text-sage-600">
                Les explorations seront bientôt disponibles.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ExplorationsList;