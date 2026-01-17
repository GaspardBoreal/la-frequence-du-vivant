import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Leaf, Bird, Bug, HelpCircle, Loader2 } from 'lucide-react';
import { useSpeciesPhoto } from '@/hooks/useSpeciesPhoto';

interface SpeciesGalleryDetailModalProps {
  species: {
    name: string;
    scientificName: string;
    count: number;
    kingdom: string;
    photos?: string[];
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

const getKingdomInfo = (kingdom: string) => {
  const lowerKingdom = kingdom?.toLowerCase() || '';
  if (lowerKingdom.includes('plant') || lowerKingdom.includes('flore') || lowerKingdom === 'plantae') {
    return { icon: Leaf, label: 'Flore', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  }
  if (lowerKingdom.includes('bird') || lowerKingdom.includes('aves')) {
    return { icon: Bird, label: 'Oiseau', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
  }
  if (lowerKingdom.includes('insect') || lowerKingdom.includes('arthropod')) {
    return { icon: Bug, label: 'Insecte', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  }
  if (lowerKingdom.includes('animal') || lowerKingdom.includes('faune') || lowerKingdom === 'animalia') {
    return { icon: Bird, label: 'Faune', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
  }
  if (lowerKingdom.includes('fung')) {
    return { icon: Leaf, label: 'Champignon', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
  }
  return { icon: HelpCircle, label: kingdom || 'Inconnu', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
};

const SpeciesGalleryDetailModal: React.FC<SpeciesGalleryDetailModalProps> = ({
  species,
  isOpen,
  onClose,
}) => {
  // Fetch real-time photo data from iNaturalist when modal opens
  const { data: photoData, isLoading } = useSpeciesPhoto(
    isOpen ? species?.scientificName : undefined
  );

  if (!species) return null;

  // Use fetched data if available, otherwise fall back to props
  const photos = (photoData?.photos && photoData.photos.length > 0) 
    ? photoData.photos 
    : species.photos || [];
  const kingdom = (photoData?.kingdom && photoData.kingdom !== 'Unknown') 
    ? photoData.kingdom 
    : species.kingdom;
  const displayName = photoData?.commonName || species.name || species.scientificName;

  const hasPhoto = photos.length > 0;
  const kingdomInfo = getKingdomInfo(kingdom);
  const KingdomIcon = kingdomInfo.icon;

  // Build external search URLs
  const gbifSearchUrl = `https://www.gbif.org/species/search?q=${encodeURIComponent(species.scientificName)}`;
  const inaturalistSearchUrl = `https://www.inaturalist.org/taxa/search?q=${encodeURIComponent(species.scientificName)}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-light text-white/90">
            {displayName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo or placeholder */}
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                <div className="text-center text-white/60 space-y-2">
                  <Loader2 className="w-10 h-10 mx-auto animate-spin" />
                  <p className="text-sm">Chargement...</p>
                </div>
              </div>
            ) : hasPhoto ? (
              <img
                src={photos[0]}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                <div className="text-center text-white/40 space-y-2">
                  <KingdomIcon className="w-12 h-12 mx-auto opacity-50" />
                  <p className="text-sm">Photo non disponible</p>
                </div>
              </div>
            )}
            
            {/* Photo badge */}
            {hasPhoto && !isLoading && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-emerald-600/90 text-white text-xs">
                  📷 Photo disponible
                </Badge>
              </div>
            )}
          </div>

          {/* Thumbnails if multiple photos */}
          {photos.length > 1 && !isLoading && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.slice(0, 4).map((photo, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-14 h-14 rounded-md overflow-hidden border border-white/10"
                >
                  <img
                    src={photo}
                    alt={`${displayName} ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Scientific name and badges */}
          <div className="space-y-2">
            <p className="text-sm text-white/50 italic">{species.scientificName}</p>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`${kingdomInfo.color} flex items-center gap-1`}>
                <KingdomIcon className="w-3 h-3" />
                {kingdomInfo.label}
              </Badge>
              
              <Badge variant="outline" className="bg-white/5 text-white/70 border-white/20">
                {species.count} observation{species.count > 1 ? 's' : ''}
              </Badge>
            </div>
          </div>

          {/* External links */}
          <div className="pt-2 border-t border-white/10">
            <p className="text-xs text-white/40 mb-2">Rechercher sur :</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-white/70"
                onClick={() => window.open(gbifSearchUrl, '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                GBIF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-white/70"
                onClick={() => window.open(inaturalistSearchUrl, '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                iNaturalist
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpeciesGalleryDetailModal;
