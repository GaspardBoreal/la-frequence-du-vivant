import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { MapPin, Volume2, BarChart3, Play, Pause, Zap } from 'lucide-react';

export default function InteractiveDemo() {
  const [activeYear, setActiveYear] = useState(2025);
  const [selectedRegion, setSelectedRegion] = useState('nouvelle-aquitaine');
  const [isPlaying, setIsPlaying] = useState(false);

  const regions = [
    { id: 'nouvelle-aquitaine', name: 'Nouvelle-Aquitaine', marches: 22, species: 155 },
    { id: 'occitanie', name: 'Occitanie', marches: 18, species: 132 },
    { id: 'auvergne', name: 'Auvergne-Rhône-Alpes', marches: 15, species: 98 },
    { id: 'bretagne', name: 'Bretagne', marches: 12, species: 87 }
  ];

  const currentRegion = regions.find(r => r.id === selectedRegion) || regions[0];

  const getProjectionData = (year: number) => {
    const baseTemp = 15.2;
    const tempIncrease = ((year - 2025) / 20) * 2.1; // +2.1°C en 20 ans
    return {
      temperature: baseTemp + tempIncrease,
      biodiversityIndex: Math.max(0.4, 0.85 - (tempIncrease * 0.15)),
      adaptationLevel: Math.min(1, ((year - 2025) / 20) * 0.8)
    };
  };

  const projectionData = getProjectionData(activeYear);

  return (
    <section className="bg-muted/20 py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center space-y-4 mb-12">
          <Badge variant="outline" className="border-primary/50 text-primary">
            <Zap className="h-3 w-3 mr-1" />
            Démonstration Interactive
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold">
            Explorez les Données en 
            <span className="text-primary"> Temps Réel</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Naviguez dans les projections climatiques et découvrez l'évolution 
            de la biodiversité de 2025 à 2045.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Carte interactive simulée */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Carte Temps Réel
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center gap-2"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isPlaying ? 'Pause' : 'Lecture'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sélecteur de région */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Région sélectionnée</label>
                <div className="grid grid-cols-2 gap-2">
                  {regions.map((region) => (
                    <Button
                      key={region.id}
                      variant={selectedRegion === region.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedRegion(region.id)}
                      className="text-xs"
                    >
                      {region.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Aperçu carte */}
              <div className="aspect-square bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg relative overflow-hidden border">
                <div className="absolute inset-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold">{currentRegion.marches}</div>
                    <div className="text-sm text-muted-foreground">Marches Actives</div>
                    <div className="text-lg font-semibold text-primary">{currentRegion.species}</div>
                    <div className="text-xs text-muted-foreground">Espèces Documentées</div>
                  </div>
                </div>
                
                {/* Points de données animés */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3 bg-primary rounded-full animate-pulse"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                      animationDelay: `${i * 0.5}s`
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contrôles temporels et métriques */}
          <div className="space-y-6">
            {/* Slider temporel */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Projections Climatiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Année de projection</label>
                    <span className="text-2xl font-bold text-primary">{activeYear}</span>
                  </div>
                  <Slider
                    value={[activeYear]}
                    onValueChange={([value]) => setActiveYear(value)}
                    min={2025}
                    max={2045}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>2025</span>
                    <span>2035</span>
                    <span>2045</span>
                  </div>
                </div>

                {/* Métriques en temps réel */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Température moyenne</span>
                      <span className="text-lg font-bold text-orange-600">
                        {projectionData.temperature.toFixed(1)}°C
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (projectionData.temperature - 15) * 20)}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Indice biodiversité</span>
                      <span className="text-lg font-bold text-green-600">
                        {(projectionData.biodiversityIndex * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${projectionData.biodiversityIndex * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Niveau d'adaptation</span>
                      <span className="text-lg font-bold text-blue-600">
                        {(projectionData.adaptationLevel * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${projectionData.adaptationLevel * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Paysage sonore */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-primary" />
                  Paysage Sonore {activeYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 text-center space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Écoutez l'évolution des chants d'oiseaux selon les projections climatiques
                  </div>
                  <Button size="lg" className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary">
                    <Play className="h-4 w-4 mr-2" />
                    Écouter la Symphonie {activeYear}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}