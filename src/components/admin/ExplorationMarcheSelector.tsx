import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, MapPin, Calendar, Plus, Footprints, Radio } from 'lucide-react';
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
          <div className="text-center text-gaspard-forest">
            Chargement des marches disponibles...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gaspard-cream/5 backdrop-blur-sm border-gaspard-emerald/20 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gaspard-gold/20 to-gaspard-gold/30 flex items-center justify-center">
            <Plus className="h-4 w-4 text-gaspard-dark" />
          </div>
          <div>
            <CardTitle className="text-xl text-gaspard-dark">
              Enrichir l'exploration
            </CardTitle>
            <p className="text-sm text-gaspard-forest mt-1">
              {filteredMarches.length} marchés disponibles pour votre parcours
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gaspard-sage" />
            <Input
              type="text"
              placeholder="Découvrir des marchés par ville, nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gaspard-cream/30 border-gaspard-emerald/30 focus:border-gaspard-gold/50"
            />
          </div>
          
          {selectedMarches.length > 0 && (
            <Button 
              onClick={onAddSelected}
              className="bg-gradient-to-r from-gaspard-gold to-gaspard-gold/90 hover:from-gaspard-gold/90 hover:to-gaspard-gold text-gaspard-dark shadow-md transition-all duration-200 hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Intégrer ({selectedMarches.length})
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="max-h-96 overflow-y-auto">
        {filteredMarches.length === 0 ? (
          <div className="text-center py-12">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-gaspard-emerald/20 to-gaspard-forest/30 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute inset-2 bg-gradient-to-br from-gaspard-forest/30 to-gaspard-sage/40 rounded-full opacity-30 flex items-center justify-center">
                <Search className="h-6 w-6 text-gaspard-cream" />
              </div>
            </div>
            <p className="text-gaspard-forest font-medium">
              {searchTerm ? 'Aucun marché trouvé' : 'Tous les marchés sont intégrés'}
            </p>
            <p className="text-sm text-gaspard-sage mt-1">
              {searchTerm ? 'Essayez une autre recherche' : 'Votre exploration est complète'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMarches.map((marche) => {
              const isSelected = selectedMarches.includes(marche.id);
              
              return (
                <div
                  key={marche.id}
                  className={`group relative overflow-hidden rounded-xl border transition-all duration-200 cursor-pointer backdrop-blur-sm ${
                    isSelected 
                      ? 'border-gaspard-gold/40 bg-gradient-to-br from-gaspard-gold/10 to-gaspard-gold/20 scale-[1.02] shadow-md' 
                      : 'border-gaspard-emerald/30 hover:border-gaspard-gold/40 hover:bg-gradient-to-br hover:from-gaspard-cream/20 hover:to-gaspard-cream/30 hover:scale-[1.01] hover:shadow-sm'
                  }`}
                  onClick={() => onMarcheToggle(marche.id)}
                >
                  {/* Motif décoratif */}
                  <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
                    <svg viewBox="0 0 50 50" className="w-full h-full">
                      <circle cx="25" cy="25" r="5" fill="none" stroke="currentColor" strokeWidth="0.5" className="animate-ping" />
                      <circle cx="25" cy="25" r="10" fill="none" stroke="currentColor" strokeWidth="0.5" className="animate-ping" style={{animationDelay: '0.5s'}} />
                      <circle cx="25" cy="25" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" className="animate-ping" style={{animationDelay: '1s'}} />
                    </svg>
                  </div>
                  
                  <div className="relative p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => onMarcheToggle(marche.id)}
                          className="mt-1"
                        />
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gaspard-emerald/30 to-gaspard-forest/40 flex items-center justify-center shadow-sm">
                          <Footprints className="h-4 w-4 text-gaspard-cream" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className="font-semibold text-gaspard-dark truncate">
                            {marche.nom_marche || `Marché de ${marche.ville}`}
                          </h4>
                          <Radio className="h-4 w-4 text-gaspard-sage" />
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className="text-xs bg-gaspard-cream/50 border-gaspard-emerald/30">
                            <MapPin className="h-3 w-3 mr-1.5 text-gaspard-forest" />
                            {marche.ville}
                          </Badge>
                          
                          {marche.date && (
                            <Badge variant="outline" className="text-xs bg-gaspard-cream/50 border-gaspard-emerald/30">
                              <Calendar className="h-3 w-3 mr-1.5 text-gaspard-forest" />
                              {marche.date}
                            </Badge>
                          )}
                        </div>
                        
                        {marche.descriptif_court && (
                          <p className="text-sm text-gaspard-forest leading-relaxed line-clamp-2">
                            {marche.descriptif_court}
                          </p>
                        )}
                      </div>
                      
                      {isSelected && (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gaspard-gold/20">
                          <Plus className="h-4 w-4 text-gaspard-dark" />
                        </div>
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