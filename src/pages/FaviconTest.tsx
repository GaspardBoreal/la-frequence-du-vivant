import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

const faviconOptions = [
  {
    id: 'leaf-wave-bold',
    name: 'Feuille Onde Bold',
    description: 'Feuille épaisse avec onde sonore prononcée',
    path: '/test-favicons/leaf-wave-bold.png'
  },
  {
    id: 'leaf-frequency-minimal',
    name: 'Fréquence Minimaliste',
    description: 'Feuille simplifiée avec lignes de fréquence',
    path: '/test-favicons/leaf-frequency-minimal.png'
  },
  {
    id: 'leaf-pulse-organic',
    name: 'Pulse Organique',
    description: 'Feuille organique avec pulsation centrale',
    path: '/test-favicons/leaf-pulse-organic.png'
  },
  {
    id: 'leaf-sound-geometric',
    name: 'Son Géométrique',
    description: 'Feuille géométrique avec onde sonore stylisée',
    path: '/test-favicons/leaf-sound-geometric.png'
  },
  {
    id: 'leaf-vibration-modern',
    name: 'Vibration Moderne',
    description: 'Feuille moderne avec lignes de vibration',
    path: '/test-favicons/leaf-vibration-modern.png'
  },
  {
    id: 'leaf-frequency-artistic',
    name: 'Fréquence Artistique',
    description: 'Feuille artistique avec motif de fréquence intégré',
    path: '/test-favicons/leaf-frequency-artistic.png'
  }
];

export default function FaviconTest() {
  const [selectedFavicon, setSelectedFavicon] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyFavicon = async (option: typeof faviconOptions[0]) => {
    setIsApplying(true);
    
    // Update the actual favicon
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = option.path;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Applied favicon: ${option.name}`);
    setSelectedFavicon(option.id);
    setIsApplying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Test des Favicons "Fréquence-Feuille"
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choisissez le favicon qui vous convient le mieux. Chaque design est optimisé pour être lisible à petite taille.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {faviconOptions.map((option) => (
            <Card key={option.id} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{option.name}</CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Favicon aux différentes tailles */}
                <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                  <div className="text-sm font-medium text-muted-foreground text-center">
                    Aperçu aux différentes tailles
                  </div>
                  <div className="flex items-center justify-center space-x-6">
                    <div className="text-center space-y-2">
                      <div className="w-4 h-4 bg-background rounded border flex items-center justify-center">
                        <img 
                          src={option.path} 
                          alt={option.name}
                          className="w-4 h-4 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">16×16</span>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="w-8 h-8 bg-background rounded border flex items-center justify-center">
                        <img 
                          src={option.path} 
                          alt={option.name}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">32×32</span>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-background rounded border flex items-center justify-center">
                        <img 
                          src={option.path} 
                          alt={option.name}
                          className="w-16 h-16 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">64×64</span>
                    </div>
                  </div>
                  
                  {/* Test sur différents fonds */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center space-y-2">
                      <div className="w-8 h-8 bg-white rounded border flex items-center justify-center mx-auto">
                        <img 
                          src={option.path} 
                          alt={option.name}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">Fond clair</span>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="w-8 h-8 bg-gray-900 rounded border flex items-center justify-center mx-auto">
                        <img 
                          src={option.path} 
                          alt={option.name}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">Fond sombre</span>
                    </div>
                  </div>
                </div>

                {/* Aperçu grande taille */}
                <div className="bg-card/50 rounded-lg p-4 text-center">
                  <div className="w-24 h-24 mx-auto bg-background rounded-lg border flex items-center justify-center mb-4 shadow-lg">
                    <img 
                      src={option.path} 
                      alt={option.name}
                      className="w-20 h-20 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Aperçu grande taille
                  </p>
                </div>

                <Button
                  onClick={() => handleApplyFavicon(option)}
                  disabled={isApplying}
                  className={`w-full ${selectedFavicon === option.id ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  variant={selectedFavicon === option.id ? 'default' : 'outline'}
                >
                  {isApplying ? (
                    'Application...'
                  ) : selectedFavicon === option.id ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Appliqué
                    </>
                  ) : (
                    'Choisir ce favicon'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instructions */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Critères de lisibilité :</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Feuille occupe 80-90% de l'espace</li>
                  <li>• Traits épais et contrastés</li>
                  <li>• Onde visible même à 16×16 pixels</li>
                  <li>• Couleurs optimisées pour le web</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Test recommandé :</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Regarder à 16×16 (taille onglet)</li>
                  <li>• Vérifier la lisibilité sur fond clair/sombre</li>
                  <li>• Tester sur mobile et desktop</li>
                  <li>• S'assurer que l'onde est visible</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}