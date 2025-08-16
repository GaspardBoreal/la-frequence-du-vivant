import React, { useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { useMarchesWithMetrics } from '@/hooks/useMarchesWithMetrics';
import { useDebounce } from '@/hooks/useDebounce';

interface MarcheFilterProps {
  selectedMarches: string[];
  onMarchesChange: (marches: string[]) => void;
}

export const MarcheFilter: React.FC<MarcheFilterProps> = ({
  selectedMarches,
  onMarchesChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const { data: marches, isLoading } = useMarchesWithMetrics();

  const filteredMarches = marches?.filter(marche => 
    marche.display_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  ) || [];

  const toggleMarche = (marcheId: string) => {
    const newMarches = selectedMarches.includes(marcheId)
      ? selectedMarches.filter(id => id !== marcheId)
      : [...selectedMarches, marcheId];
    onMarchesChange(newMarches);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MapPin className="w-4 h-4" />
          Marches
          {selectedMarches.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedMarches.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <DropdownMenuLabel>Marches</DropdownMenuLabel>
        <div className="px-2 pb-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une marche..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-2 text-sm text-muted-foreground">Chargement...</div>
          ) : filteredMarches.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              {debouncedSearchTerm ? 'Aucune marche trouvée' : 'Aucune marche disponible'}
            </div>
          ) : (
            filteredMarches.slice(0, 50).map(marche => (
              <DropdownMenuCheckboxItem
                key={marche.id}
                checked={selectedMarches.includes(marche.id)}
                onCheckedChange={() => toggleMarche(marche.id)}
                className="text-xs"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{marche.ville}{marche.nom_marche ? ` - ${marche.nom_marche}` : ''}</span>
                  <span className="text-muted-foreground text-xs">
                    {marche.total_species} espèces • {marche.region}
                  </span>
                </div>
              </DropdownMenuCheckboxItem>
            ))
          )}
          {filteredMarches.length > 50 && (
            <div className="p-2 text-xs text-muted-foreground border-t">
              Affichage des 50 premiers résultats. Affinez votre recherche.
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};