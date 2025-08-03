import React, { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarcheTechnoSensible } from '@/utils/googleSheetsApi';

interface SimpleMarcheSelectorProps {
  marches: MarcheTechnoSensible[];
  selectedMarche: string;
  onSelectMarche: (marcheId: string) => void;
  isLoading?: boolean;
}

export const SimpleMarcheSelector: React.FC<SimpleMarcheSelectorProps> = ({
  marches,
  selectedMarche,
  onSelectMarche,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  // Liste simple des marches avec nom concaténé et filtrée
  const filteredMarches = useMemo(() => {
    return marches
      .map(marche => ({
        ...marche,
        displayName: `${marche.ville} - ${marche.nomMarche || `Marche ${marche.ville}`}`
      }))
      .filter(marche => 
        marche.displayName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [marches, searchTerm]);

  const selectedMarcheData = marches.find(m => m.supabaseId === selectedMarche);

  // Fermer la liste quand une marche est sélectionnée
  useEffect(() => {
    if (selectedMarche) {
      setIsExpanded(false);
    }
  }, [selectedMarche]);

  const handleSelectMarche = (marcheId: string) => {
    onSelectMarche(marcheId);
    setIsExpanded(false);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setSearchTerm(''); // Reset search when expanding
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Barre de recherche - seulement si liste expandée */}
      {isExpanded && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher une marche..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Marche sélectionnée - toujours visible */}
      {selectedMarcheData && (
        <Card className="border-2 border-primary bg-primary/5">
          <CardContent className="p-3">
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
              onClick={toggleExpanded}
            >
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {selectedMarcheData.ville} - {selectedMarcheData.nomMarche || `Marche ${selectedMarcheData.ville}`}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="default">Sélectionnée</Badge>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-primary" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-primary" />
                )}
              </div>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bouton pour ouvrir la liste si aucune marche sélectionnée */}
      {!selectedMarcheData && !isExpanded && (
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={toggleExpanded}
        >
          <span>Sélectionner une marche...</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}

      {/* Liste des marches - seulement si expandée */}
      {isExpanded && (
      <Card className="max-h-80 overflow-y-auto">
        <CardContent className="p-2">
          {filteredMarches.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune marche trouvée</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredMarches.map(marche => (
                <Button
                  key={marche.supabaseId}
                  variant={selectedMarche === marche.supabaseId ? "default" : "ghost"}
                  className="w-full justify-start p-2 h-auto text-left"
                  onClick={() => handleSelectMarche(marche.supabaseId || '')}
                >
                  <div className="flex items-center space-x-2 w-full">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{marche.displayName}</span>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
};