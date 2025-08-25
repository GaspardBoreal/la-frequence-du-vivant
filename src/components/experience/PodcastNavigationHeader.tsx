import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Waves, Headphones, ChevronDown, Share, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface PodcastNavigationHeaderProps {
  explorationName?: string;
  currentTrackIndex?: number;
  totalTracks?: number;
  tracks?: Array<{ id: string; title: string; marche?: string }>;
  onTrackSelect?: (index: number) => void;
}

const PodcastNavigationHeader: React.FC<PodcastNavigationHeaderProps> = ({ 
  explorationName, 
  currentTrackIndex = 0, 
  totalTracks = 0, 
  tracks = [],
  onTrackSelect 
}) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate('/explorations/remontee-dordogne-atlas-eaux-vivantes-2050-2100/experience/a467469c-358f-4ccc-bc77-0de6c06ef9ce');
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: explorationName || 'Écoute Contemplative',
        url: window.location.href,
      });
    } catch (error) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const currentTrack = tracks[currentTrackIndex];
  const displayTitle = currentTrack?.title || 'Toutes les pistes';

  return (
    <header className="relative z-30 w-full border-b border-emerald-400/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Left section - Back button and logo */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="text-emerald-200 hover:text-emerald-100 hover:bg-emerald-800/20 p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="hidden sm:flex items-center gap-2">
              <Headphones className="h-5 w-5 text-emerald-300" />
              <span className="dordogne-title text-lg text-emerald-200">
                Écoute
              </span>
            </div>
          </div>

          {/* Center section - Track selector and navigation */}
          <div className="flex items-center gap-2 flex-1 justify-center max-w-md">
            {tracks.length > 0 && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="text-emerald-200 hover:text-emerald-100 hover:bg-emerald-800/20 max-w-48 truncate text-sm"
                    >
                      <span className="truncate">{displayTitle}</span>
                      <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-800 border-emerald-400/30 max-w-80">
                    {tracks.map((track, index) => (
                      <DropdownMenuItem
                        key={track.id}
                        onClick={() => onTrackSelect?.(index)}
                        className="text-emerald-200 hover:bg-emerald-800/30 focus:bg-emerald-800/30 cursor-pointer"
                      >
                        <div className="flex flex-col gap-1 max-w-full">
                          <span className="text-sm truncate">{track.title}</span>
                          {track.marche && (
                            <span className="text-xs text-emerald-400/70 truncate">{track.marche}</span>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="text-emerald-300/70 text-sm font-mono bg-emerald-900/20 px-2 py-1 rounded border border-emerald-400/30">
                  {currentTrackIndex + 1}/{totalTracks}
                </div>
              </>
            )}
          </div>

          {/* Right section - Action buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-emerald-200 hover:text-emerald-100 hover:bg-emerald-800/20 p-2"
            >
              <Share className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-200 hover:text-emerald-100 hover:bg-emerald-800/20 p-2"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-emerald-400/30">
                <DropdownMenuItem 
                  onClick={handleBackClick}
                  className="text-emerald-200 hover:bg-emerald-800/30 focus:bg-emerald-800/30 cursor-pointer"
                >
                  Retour à l'exploration
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PodcastNavigationHeader;