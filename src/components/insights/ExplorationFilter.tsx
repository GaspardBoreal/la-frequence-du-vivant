import React from 'react';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { useExplorationsWithMetrics } from '@/hooks/useExplorationsWithMetrics';

interface ExplorationFilterProps {
  selectedExplorations: string[];
  onExplorationsChange: (explorations: string[]) => void;
}

export const ExplorationFilter: React.FC<ExplorationFilterProps> = ({
  selectedExplorations,
  onExplorationsChange
}) => {
  const { data: explorations, isLoading } = useExplorationsWithMetrics();

  const toggleExploration = (explorationId: string) => {
    const newExplorations = selectedExplorations.includes(explorationId)
      ? selectedExplorations.filter(id => id !== explorationId)
      : [...selectedExplorations, explorationId];
    onExplorationsChange(newExplorations);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Compass className="w-4 h-4" />
          Explorations
          {selectedExplorations.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedExplorations.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <DropdownMenuLabel>Explorations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-2 text-sm text-muted-foreground">Chargement...</div>
          ) : !explorations || explorations.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">Aucune exploration disponible</div>
          ) : (
            explorations.map(exploration => (
              <DropdownMenuCheckboxItem
                key={exploration.id}
                checked={selectedExplorations.includes(exploration.id)}
                onCheckedChange={() => toggleExploration(exploration.id)}
                className="text-xs"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{exploration.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {exploration.total_species} espèces • {exploration.marches_count} marches
                  </span>
                </div>
              </DropdownMenuCheckboxItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};