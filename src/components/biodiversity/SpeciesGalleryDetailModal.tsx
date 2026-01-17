import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Leaf, Bird, Bug, HelpCircle } from 'lucide-react';

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
  if (lowerKingdom.includes('plant') || lowerKingdom.includes('flore')) {
    return { icon: Leaf, label: 'Flore', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  }
  if (lowerKingdom.includes('bird') || lowerKingdom.includes('aves')) {
    return { icon: Bird, label: 'Oiseau', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
  }
  if (lowerKingdom.includes('insect') || lowerKingdom.includes('arthropod')) {
    return { icon: Bug, label: 'Insecte', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  }
  if (lowerKingdom.includes('animal') || lowerKingdom.includes('faune')) {
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
  if (!species) return null;

  const kingdomInfo = getKingdomInfo(species.kingdom);
  const KingdomIcon = kingdomInfo.icon;
  const hasPhoto = species.photos && species.photos.length > 0;
  const displayName = species.name || species.scientificName;

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
            {hasPhoto ? (
              <img
                src={species.photos![0]}
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
          </div>

          {/* Scientific name */}
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
