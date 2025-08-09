import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, MapPin, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAvailableMarches } from '@/hooks/useExplorationMarches';

interface MarcheOption {
  id: string;
  ville: string;
  nom_marche?: string;
  date?: string;
  descriptif_court?: string;
  latitude?: number;
  longitude?: number;
}

interface ExplorationMarcheSelectorProps {
  explorationId: string;
  selectedMarches: string[];
  onMarcheToggle: (marcheId: string) => void;
  onAddSelected: () => void;
}

const ExplorationMarcheSelector: React.FC<ExplorationMarcheSelectorProps> = ({
  explorationId,
  selectedMarches,
  onMarcheToggle,
  onAddSelected
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: availableMarches = [], isLoading } = useQuery(
    useAvailableMarches(explorationId)
  );

  const filteredMarches = availableMarches.filter(marche =>
    marche.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
    marche.nom_marche?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    marche.descriptif_court?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-sage-600">
            Chargement des marches disponibles...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-sage-800">
          Ajouter des marches ({filteredMarches.length} disponibles)
        </CardTitle>
        
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sage-400" />
            <Input
              type="text"
              placeholder="Rechercher par ville, nom de marché..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {selectedMarches.length > 0 && (
            <Button 
              onClick={onAddSelected}
              className="bg-sage-600 hover:bg-sage-700"
            >
              Ajouter ({selectedMarches.length})
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="max-h-96 overflow-y-auto">
        {filteredMarches.length === 0 ? (
          <div className="text-center py-8 text-sage-600">
            {searchTerm ? 'Aucune marche trouvée' : 'Toutes les marches sont déjà assignées'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMarches.map((marche) => {
              const isSelected = selectedMarches.includes(marche.id);
              
              return (
                <div
                  key={marche.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-sage-300 bg-sage-50' 
                      : 'border-sage-200 hover:border-sage-300 hover:bg-sage-25'
                  }`}
                  onClick={() => onMarcheToggle(marche.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onMarcheToggle(marche.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-sage-800 truncate">
                          {marche.nom_marche || `Marché de ${marche.ville}`}
                        </h4>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {marche.ville}
                        </Badge>
                        
                        {marche.date && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {marche.date}
                          </Badge>
                        )}
                      </div>
                      
                      {marche.descriptif_court && (
                        <p className="text-sm text-sage-600 line-clamp-2">
                          {marche.descriptif_court}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExplorationMarcheSelector;