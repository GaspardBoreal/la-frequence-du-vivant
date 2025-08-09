import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Download } from 'lucide-react';

// Import favicon images
import faviconVersion1 from '@/assets/favicon-v1.png';
import faviconVersion2 from '@/assets/favicon-v2.png';
import faviconVersion3 from '@/assets/favicon-v3.png';
import faviconVersion4 from '@/assets/favicon-v4.png';

const FaviconTest = () => {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  const faviconVersions = [
    {
      id: 1,
      name: "Vert Clair Harmonieux",
      description: "Fond vert clair, feuille vert foncé avec cercle fréquence",
      image: faviconVersion1,
      colors: ["Vert clair", "Vert foncé", "Blanc/Beige"]
    },
    {
      id: 2,
      name: "Vert Foncé Naturel",
      description: "Feuille dominante en vert foncé avec détails visibles",
      image: faviconVersion2,
      colors: ["Vert foncé", "Beige doré", "Vert olive"]
    },
    {
      id: 3,
      name: "Orange-Marron Élégant",
      description: "Palette sophistiquée orange-marron adaptée au site",
      image: faviconVersion3,
      colors: ["Orange doux", "Marron/Bronze", "Beige chaud"]
    },
    {
      id: 4,
      name: "Hyper Classe",
      description: "Feuille à 45°, ondes blanches aérées par-dessus, fond vert clair élégant",
      image: faviconVersion4,
      colors: ["Vert clair élégant", "Vert foncé", "Blanc", "Beige doré (subtil)"]
    }
  ];

  const handleSelect = (versionId: number) => {
    setSelectedVersion(versionId);
  };

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Test des Favicons - Propositions
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Quatre propositions de favicon avec une feuille stylisée et un élément "fréquence". 
            Chaque version est optimisée pour la lisibilité en petite taille.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {faviconVersions.map((version) => (
            <Card 
              key={version.id}
              className={`transition-all duration-300 hover:shadow-lg cursor-pointer ${
                selectedVersion === version.id 
                  ? 'ring-2 ring-primary shadow-lg' 
                  : 'hover:ring-1 hover:ring-primary/50'
              }`}
              onClick={() => handleSelect(version.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {version.name}
                  {selectedVersion === version.id && (
                    <Badge variant="default" className="ml-2">
                      <Check className="w-3 h-3 mr-1" />
                      Sélectionné
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{version.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Aperçu en taille réelle */}
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Taille réelle (32x32px):</p>
                  <div className="flex items-center gap-3">
                    <div className="bg-white border rounded p-1">
                      <img 
                        src={version.image} 
                        alt={`Favicon ${version.name}`}
                        className="w-8 h-8"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Aperçu dans l'onglet navigateur
                    </span>
                  </div>
                </div>

                {/* Aperçu agrandi */}
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Version agrandie:</p>
                  <div className="flex justify-center">
                    <img 
                      src={version.image} 
                      alt={`Favicon ${version.name} agrandi`}
                      className="w-24 h-24 border rounded-lg shadow-sm"
                    />
                  </div>
                </div>

                {/* Palette de couleurs */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Palette de couleurs:</p>
                  <div className="flex flex-wrap gap-1">
                    {version.colors.map((color, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {color}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant={selectedVersion === version.id ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(version.id);
                    }}
                  >
                    {selectedVersion === version.id ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Sélectionné
                      </>
                    ) : (
                      'Sélectionner'
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(version.image, `favicon-${version.id}.png`);
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Section de validation */}
        {selectedVersion && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">
                Favicon sélectionné: {faviconVersions.find(v => v.id === selectedVersion)?.name}
              </CardTitle>
              <CardDescription>
                Cette version sera utilisée comme nouveau favicon du site.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center">
                <div className="bg-white border rounded p-2">
                  <img 
                    src={faviconVersions.find(v => v.id === selectedVersion)?.image} 
                    alt="Favicon sélectionné"
                    className="w-8 h-8"
                  />
                </div>
                <div>
                  <p className="font-medium">Aperçu final</p>
                  <p className="text-sm text-muted-foreground">
                    Ce favicon apparaîtra dans les onglets du navigateur
                  </p>
                </div>
                <Button className="ml-auto">
                  Confirmer ce choix
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FaviconTest;