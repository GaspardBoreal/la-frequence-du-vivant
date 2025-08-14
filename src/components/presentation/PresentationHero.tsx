import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, ArrowRight, MapPin, Zap, Brain } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

export default function PresentationHero() {
  const marchesCount = useAnimatedCounter(22, 2000);
  const speciesCount = useAnimatedCounter(155, 2000);
  const regionsCount = useAnimatedCounter(4, 1500);
  
  const [currentVideo, setCurrentVideo] = useState(0);
  const videos = [
    "Survol drone vallée Dordogne",
    "Bioacoustique temps réel", 
    "Visualisation données IA"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideo((prev) => (prev + 1) % videos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Fond vidéo simulé avec gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
      
      {/* Particules animées */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Contenu principal */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="outline" className="border-primary/50 text-primary">
                <Zap className="h-3 w-3 mr-1" />
                Révolution Territoriale en Cours
              </Badge>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="text-foreground">La Fréquence</span>
                <br />
                <span className="text-primary">du Vivant</span>
                <br />
                <div className="mt-6">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent text-3xl md:text-4xl lg:text-5xl italic font-medium">
                    L'IA bioacoustique qui Écoute l'Avenir
                  </span>
                </div>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
                La plateforme qui transforme les données environnementales 
                en intelligence territoriale, combinant bioacoustique, IA prédictive 
                et création poétique.
              </p>
            </div>

            {/* Métriques dynamiques */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-lg bg-card/50 backdrop-blur-sm border">
                <div className="text-3xl font-bold text-primary">{marchesCount}</div>
                <div className="text-sm text-muted-foreground">Marches Explorées</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-card/50 backdrop-blur-sm border">
                <div className="text-3xl font-bold text-primary">{speciesCount}</div>
                <div className="text-sm text-muted-foreground">Espèces Recensées</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-card/50 backdrop-blur-sm border">
                <div className="text-3xl font-bold text-primary">{regionsCount}</div>
                <div className="text-sm text-muted-foreground">Régions Connectées</div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="group">
                <Play className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
                Découvrir la Démo Live
              </Button>
              <Button variant="outline" size="lg" className="group">
                <MapPin className="h-4 w-4 mr-2" />
                Explorer les Territoires
                <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>

          {/* Préview vidéo/démonstration */}
          <div className="relative">
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border backdrop-blur-sm flex items-center justify-center overflow-hidden">
              <div className="text-center space-y-4 p-8">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <Play className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <div className="text-lg font-semibold">{videos[currentVideo]}</div>
                  <div className="text-sm text-muted-foreground">
                    Données temps réel • IA Prédictive • Création Artistique
                  </div>
                </div>
              </div>
            </div>
            
            {/* Indicateurs vidéo */}
            <div className="flex justify-center mt-4 space-x-2">
              {videos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentVideo(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentVideo ? 'bg-primary w-8' : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}