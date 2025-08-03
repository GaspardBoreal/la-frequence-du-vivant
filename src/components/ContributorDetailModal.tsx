import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, User, MapPin, Camera, Volume2, List, Eye } from 'lucide-react';
import { BiodiversitySpecies } from '@/types/biodiversity';

interface ContributorInfo {
  name: string;
  institution?: string;
  location?: string;
  speciesCount: number;
  observationsCount: number;
  photosCount: number;
  audioCount: number;
  listsCount: number;
  source: 'ebird' | 'inaturalist';
  avatar?: string;
}

interface ContributorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contributors: ContributorInfo[];
  apiSource: 'ebird' | 'inaturalist';
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const ContributorDetailModal: React.FC<ContributorDetailModalProps> = ({
  isOpen,
  onClose,
  contributors,
  apiSource,
  searchTerm,
  onSearchChange
}) => {
  const filteredContributors = useMemo(() => {
    return contributors
      .filter(contributor => 
        contributor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contributor.institution && contributor.institution.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [contributors, searchTerm]);

  const apiColors = {
    ebird: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      accent: 'border-blue-200'
    },
    inaturalist: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      accent: 'border-green-200'
    }
  };

  const currentColors = apiColors[apiSource];

  const totalStats = useMemo(() => {
    return contributors.reduce((acc, contributor) => ({
      totalSpecies: acc.totalSpecies + contributor.speciesCount,
      totalObservations: acc.totalObservations + contributor.observationsCount,
      totalPhotos: acc.totalPhotos + contributor.photosCount,
      totalAudio: acc.totalAudio + contributor.audioCount,
      totalLists: acc.totalLists + contributor.listsCount,
    }), {
      totalSpecies: 0,
      totalObservations: 0,
      totalPhotos: 0,
      totalAudio: 0,
      totalLists: 0,
    });
  }, [contributors]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${currentColors.bg}`}>
              {apiSource === 'ebird' ? (
                <Eye className="h-5 w-5 text-blue-600" />
              ) : (
                <Camera className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div>
              <span className="block">Contributeurs {apiSource === 'ebird' ? 'eBird' : 'iNaturalist'}</span>
              <span className="text-sm font-normal text-gray-500">
                {contributors.length} contributeur{contributors.length > 1 ? 's' : ''}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Statistiques générales */}
        <div className={`grid grid-cols-5 gap-4 p-4 rounded-lg ${currentColors.bg} ${currentColors.accent} border`}>
          <div className="text-center">
            <div className={`text-2xl font-bold ${currentColors.text}`}>{totalStats.totalSpecies}</div>
            <div className="text-xs text-gray-600">Espèces totales</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${currentColors.text}`}>{totalStats.totalObservations}</div>
            <div className="text-xs text-gray-600">Observations</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${currentColors.text}`}>{totalStats.totalPhotos}</div>
            <div className="text-xs text-gray-600">Photos</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${currentColors.text}`}>{totalStats.totalAudio}</div>
            <div className="text-xs text-gray-600">Audio</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${currentColors.text}`}>{totalStats.totalLists}</div>
            <div className="text-xs text-gray-600">Listes</div>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un contributeur..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Liste des contributeurs */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {filteredContributors.map((contributor, index) => (
            <div
              key={`${contributor.name}-${index}`}
              className={`p-4 rounded-lg border ${currentColors.accent} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <Avatar className="h-12 w-12">
                  <AvatarImage src={contributor.avatar} alt={contributor.name} />
                  <AvatarFallback className={`${currentColors.bg} ${currentColors.text}`}>
                    {contributor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Informations principales */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{contributor.name}</h4>
                    <Badge 
                      variant={apiSource === 'ebird' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {apiSource}
                    </Badge>
                  </div>
                  
                  {contributor.institution && (
                    <p className="text-sm text-gray-600 mb-2">{contributor.institution}</p>
                  )}
                  
                  {contributor.location && (
                    <div className="flex items-center space-x-1 text-sm text-gray-500 mb-3">
                      <MapPin className="h-3 w-3" />
                      <span>{contributor.location}</span>
                    </div>
                  )}

                  {/* Statistiques du contributeur */}
                  <div className="grid grid-cols-5 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{contributor.speciesCount}</div>
                      <div className="text-xs text-gray-500">Espèces</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{contributor.observationsCount}</div>
                      <div className="text-xs text-gray-500">Obs.</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{contributor.photosCount}</div>
                      <div className="text-xs text-gray-500">Photos</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{contributor.audioCount}</div>
                      <div className="text-xs text-gray-500">Audio</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{contributor.listsCount}</div>
                      <div className="text-xs text-gray-500">Listes</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredContributors.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun contributeur trouvé pour cette recherche</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};