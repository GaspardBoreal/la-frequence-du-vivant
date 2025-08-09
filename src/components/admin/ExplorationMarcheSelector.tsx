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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gaspard-background/40 via-gaspard-background/20 to-transparent backdrop-blur-xl border border-gaspard-accent/20 shadow-xl">
        <div className="p-12 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-gaspard-accent rounded-full animate-gentle-float"></div>
            <div className="w-3 h-3 bg-gaspard-secondary rounded-full animate-gentle-float animation-delay-300"></div>
            <div className="w-3 h-3 bg-gaspard-primary rounded-full animate-gentle-float animation-delay-600"></div>
          </div>
          <div className="text-gaspard-secondary font-light">
            Révélation des territoires disponibles...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gaspard-background/40 via-gaspard-background/20 to-transparent backdrop-blur-xl border border-gaspard-accent/20 shadow-2xl shadow-gaspard-accent/10">
      {/* Particules de fond */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-40 h-40 bg-gaspard-accent/5 rounded-full blur-3xl animate-gentle-float"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gaspard-secondary/5 rounded-full blur-3xl animate-gentle-float animation-delay-300"></div>
      </div>
      
      <div className="relative p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gaspard-accent/20 to-gaspard-secondary/30 flex items-center justify-center backdrop-blur-sm">
            <Plus className="h-5 w-5 text-gaspard-accent" />
          </div>
          <div>
            <h3 className="gaspard-main-title text-2xl font-bold text-gaspard-accent">
              Enrichir l'exploration
            </h3>
            <p className="text-sm text-gaspard-secondary mt-1 font-light">
              {filteredMarches.length} territoires disponibles pour votre parcours
            </p>
          </div>
        </div>
        
        <div className="flex gap-4 items-center mb-8">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gaspard-muted/60 group-hover:text-gaspard-accent group-focus-within:text-gaspard-accent transition-all duration-500 group-hover:scale-110" />
            <Input
              type="text"
              placeholder="Découvrir des territoires par ville, nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 bg-gaspard-background/30 backdrop-blur-sm border-gaspard-accent/30 rounded-2xl focus:border-gaspard-accent/50 transition-all duration-500 hover:bg-gaspard-background/50 focus:bg-gaspard-background/60 text-green-900 placeholder:text-gaspard-muted/80"
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-gaspard-accent/10 via-transparent to-gaspard-secondary/10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-50 transition-opacity duration-500 pointer-events-none"></div>
          </div>
          
          {selectedMarches.length > 0 && (
            <Button 
              onClick={onAddSelected}
              size="lg"
              className="bg-gradient-to-r from-gaspard-accent to-gaspard-secondary hover:from-gaspard-accent/90 hover:to-gaspard-secondary/90 text-gaspard-background rounded-2xl px-6 py-3 shadow-lg shadow-gaspard-accent/20 hover:shadow-xl hover:shadow-gaspard-accent/30 transition-all duration-300 hover:scale-105 border-0 group"
            >
              <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              <span className="group-hover:tracking-wide transition-all duration-300">Intégrer ({selectedMarches.length})</span>
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gaspard-accent/20 scrollbar-track-transparent">
          {filteredMarches.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative mx-auto w-20 h-20 mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-gaspard-accent/20 to-gaspard-secondary/30 rounded-full animate-gentle-float"></div>
                <div className="absolute inset-3 bg-gradient-to-br from-gaspard-secondary/30 to-gaspard-primary/40 rounded-full animate-gentle-float animation-delay-300 flex items-center justify-center">
                  <Search className="h-8 w-8 text-gaspard-background animate-soft-pulse" />
                </div>
              </div>
              <h4 className="gaspard-main-title text-xl font-bold text-gaspard-accent mb-4">
                {searchTerm ? 'Aucun territoire trouvé' : 'Tous les territoires sont intégrés'}
              </h4>
              <p className="text-sm text-gaspard-muted font-light">
                {searchTerm ? 'Explorez d\'autres termes' : 'Votre exploration territoriale est complète'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMarches.map((marche) => {
                const isSelected = selectedMarches.includes(marche.id);
                
                return (
                  <div
                    key={marche.id}
                    className={`group relative overflow-hidden rounded-2xl border transition-all duration-500 cursor-pointer backdrop-blur-xl ${
                      isSelected 
                        ? 'border-gaspard-accent/50 bg-gradient-to-br from-gaspard-accent/15 to-gaspard-secondary/20 scale-[1.02] shadow-xl shadow-gaspard-accent/20' 
                        : 'border-gaspard-primary/30 hover:border-gaspard-accent/50 hover:bg-gradient-to-br hover:from-gaspard-background/30 hover:to-gaspard-background/20 hover:scale-[1.01] hover:shadow-lg hover:shadow-gaspard-primary/10'
                    }`}
                    onClick={() => onMarcheToggle(marche.id)}
                  >
                    {/* Motif décoratif subtil */}
                    <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
                      <svg viewBox="0 0 50 50" className="w-full h-full">
                        <circle cx="25" cy="25" r="8" fill="none" stroke="currentColor" strokeWidth="0.3" className="animate-gentle-float text-gaspard-accent" />
                        <circle cx="25" cy="25" r="15" fill="none" stroke="currentColor" strokeWidth="0.3" className="animate-gentle-float animation-delay-300 text-gaspard-secondary" />
                        <circle cx="25" cy="25" r="22" fill="none" stroke="currentColor" strokeWidth="0.3" className="animate-gentle-float animation-delay-600 text-gaspard-primary" />
                      </svg>
                    </div>
                    
                    <div className="relative p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => onMarcheToggle(marche.id)}
                            className="mt-1 scale-125"
                          />
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gaspard-primary/30 to-gaspard-accent/40 flex items-center justify-center shadow-lg backdrop-blur-sm">
                            <Footprints className="h-5 w-5 text-gaspard-background" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-4">
                            <h4 className="font-bold text-lg text-gaspard-primary truncate">
                              {marche.nom_marche || `Marché de ${marche.ville}`}
                            </h4>
                            <Radio className="h-4 w-4 text-gaspard-secondary animate-soft-pulse" />
                          </div>
                          
                          <div className="flex flex-wrap gap-3 mb-4">
                            <div className="px-3 py-1.5 text-xs bg-gradient-to-r from-gaspard-background/60 to-gaspard-background/40 backdrop-blur-sm border border-gaspard-primary/30 rounded-full flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-gaspard-primary" />
                              <span className="text-gaspard-primary font-medium">{marche.ville}</span>
                            </div>
                            
                            {marche.date && (
                              <div className="px-3 py-1.5 text-xs bg-gradient-to-r from-gaspard-background/60 to-gaspard-background/40 backdrop-blur-sm border border-gaspard-accent/30 rounded-full flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-gaspard-accent" />
                                <span className="text-gaspard-accent font-medium">{marche.date}</span>
                              </div>
                            )}
                          </div>
                          
                          {marche.descriptif_court && (
                            <p className="text-sm text-gaspard-secondary leading-relaxed line-clamp-2 font-light">
                              {marche.descriptif_court}
                            </p>
                          )}
                        </div>
                        
                        {isSelected && (
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-gaspard-accent/20 to-gaspard-secondary/20 backdrop-blur-sm">
                            <Plus className="h-5 w-5 text-gaspard-accent animate-gentle-float" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplorationMarcheSelector;