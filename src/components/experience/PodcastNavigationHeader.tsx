import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Palette, 
  Bookmark, 
  Share2,
  Monitor,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import AudioTypeSelector, { AudioType } from '@/components/audio/AudioTypeSelector';
import NavigationAudio from '@/components/audio/NavigationAudio';

type AppearanceMode = 'light' | 'dark' | 'system';

interface PodcastNavigationHeaderProps {
  explorationName?: string;
  currentTrackIndex?: number;
  totalTracks?: number;
  tracks?: Array<{ id: string; title: string; marche?: string; type?: AudioType }>;
  onTrackSelect?: (index: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  slug?: string;
}

const PodcastNavigationHeader: React.FC<PodcastNavigationHeaderProps> = ({ 
  explorationName, 
  currentTrackIndex = 0, 
  totalTracks = 0, 
  tracks = [],
  onTrackSelect,
  onPrevious,
  onNext,
  slug
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedAudioType, setSelectedAudioType] = useState<AudioType | 'all'>('all');
  const [appearanceMode, setAppearanceMode] = useState<AppearanceMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appearanceMode') as AppearanceMode;
      return saved || 'system';
    }
    return 'system';
  });

  // Apply theme class to document
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      
      if (appearanceMode === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      } else {
        root.classList.toggle('dark', appearanceMode === 'dark');
      }
      
      // Persist the choice
      localStorage.setItem('appearanceMode', appearanceMode);
    };

    applyTheme();
    
    if (appearanceMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [appearanceMode]);

  const handleBackClick = () => {
    navigate(`/galerie-fleuve/exploration/${slug}`);
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
      toast({ 
        title: "Lien copié", 
        description: "Le lien a été copié dans le presse-papiers" 
      });
    }
  };

  // Get available audio types from tracks
  const availableTypes = Array.from(new Set(tracks.map(t => t.type).filter(Boolean))) as AudioType[];

  // Filter tracks based on selected type
  const filteredTracks = selectedAudioType === 'all' 
    ? tracks 
    : tracks.filter(t => t.type === selectedAudioType);

  const handleTypeSelect = (type: AudioType | 'all') => {
    setSelectedAudioType(type);
    // Reset to first track of the new type
    if (onTrackSelect && filteredTracks.length > 0) {
      const firstTrackIndex = tracks.findIndex(t => 
        type === 'all' ? true : t.type === type
      );
      if (firstTrackIndex >= 0) {
        onTrackSelect(firstTrackIndex);
      }
    }
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 border-b bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800/60"
    >
      <div className="px-4 py-3">
        {/* Mobile Layout */}
        <div className="flex md:hidden items-center justify-between">
          {/* Mobile Left: Return button */}
          <Button variant="ghost" size="sm" asChild className="text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-800/20 hover:text-slate-900 dark:hover:text-emerald-100">
            <Link to={`/galerie-fleuve/exploration/${slug}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          {/* Mobile Center: Navigation + Type Selector */}
          <div className="flex items-center gap-2 flex-1 justify-center">
            {availableTypes.length > 0 && (
              <AudioTypeSelector
                currentType={selectedAudioType}
                availableTypes={availableTypes}
                onTypeSelect={handleTypeSelect}
              />
            )}
            {onPrevious && onNext && (
              <NavigationAudio
                currentIndex={currentTrackIndex}
                totalTracks={totalTracks}
                onPrevious={onPrevious}
                onNext={onNext}
              />
            )}
          </div>

          {/* Mobile Right: Actions */}
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-800/20">
                  <Palette className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50 w-36 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 shadow-lg">
                <DropdownMenuItem
                  onClick={() => setAppearanceMode('light')}
                  className={`flex items-center gap-2 cursor-pointer hover:text-emerald-900 dark:hover:text-emerald-900 data-[highlighted]:text-emerald-900 dark:data-[highlighted]:text-emerald-900 ${
                    appearanceMode === 'light' 
                      ? 'bg-yellow-200 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                      : 'text-slate-800 dark:text-slate-300'
                  }`}
                >
                  <Sun className="h-4 w-4" />
                  <span>Clair</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setAppearanceMode('system')}
                  className={`flex items-center gap-2 cursor-pointer hover:text-emerald-900 dark:hover:text-emerald-900 data-[highlighted]:text-emerald-900 dark:data-[highlighted]:text-emerald-900 ${
                    appearanceMode === 'system' 
                      ? 'bg-yellow-200 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                      : 'text-slate-800 dark:text-slate-300'
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                  <span>Système</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setAppearanceMode('dark')}
                  className={`flex items-center gap-2 cursor-pointer hover:text-emerald-900 dark:hover:text-emerald-900 data-[highlighted]:text-emerald-900 dark:data-[highlighted]:text-emerald-900 ${
                    appearanceMode === 'dark' 
                      ? 'bg-yellow-200 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                      : 'text-slate-800 dark:text-slate-300'
                  }`}
                >
                  <Moon className="h-4 w-4" />
                  <span>Sombre</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="h-8 w-8 p-0 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-800/20 hover:text-slate-900 dark:hover:text-emerald-100"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
          {/* Left: Gaspard Boréal signature */}
          <div className="font-crimson text-slate-800 dark:text-emerald-200">
            <div className="text-lg font-medium">Gaspard Boréal</div>
            <div className="text-xs opacity-80">Poète des Mondes Hybrides</div>
          </div>

          {/* Center: Navigation + Type Selector */}
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="sm" asChild className="text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-800/20 hover:text-slate-900 dark:hover:text-emerald-100">
              <Link to={`/galerie-fleuve/exploration/${slug}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Link>
            </Button>
            
            {availableTypes.length > 0 && (
              <div className="flex items-center gap-2">
                {(['all', ...availableTypes] as (AudioType | 'all')[]).map((type) => {
                  const label = type === 'all'
                    ? 'Tous les audio'
                    : type === 'gaspard'
                      ? 'Gaspard parle'
                      : type === 'dordogne'
                        ? 'La Dordogne parle'
                        : 'Sons captés';
                  const isActive = selectedAudioType === type;
                  return (
                    <Button
                      key={type}
                      variant={isActive ? 'default' : 'ghost'}
                      size="sm"
                      className={isActive ? 'bg-slate-200 text-slate-900 dark:bg-emerald-700/50 dark:text-emerald-100' : 'text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-800/20 hover:text-slate-900 dark:hover:text-emerald-100'}
                      onClick={() => handleTypeSelect(type)}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
            )}

            {onPrevious && onNext && (
              <NavigationAudio
                currentIndex={currentTrackIndex}
                totalTracks={totalTracks}
                onPrevious={onPrevious}
                onNext={onNext}
              />
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-800/20">
                  <Palette className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50 w-36 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 shadow-lg">
                <DropdownMenuItem
                  onClick={() => setAppearanceMode('light')}
                  className={`flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-emerald-800/30 focus:bg-slate-100 dark:focus:bg-emerald-800/30 ${
                    appearanceMode === 'light' 
                      ? 'bg-slate-100 text-slate-900 dark:bg-emerald-700/50 dark:text-emerald-100'
                      : 'text-slate-800 dark:text-emerald-200'
                  }`}
                >
                  <Sun className="h-4 w-4" />
                  <span>Clair</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setAppearanceMode('system')}
                  className={`flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-emerald-800/30 focus:bg-slate-100 dark:focus:bg-emerald-800/30 ${
                    appearanceMode === 'system' 
                      ? 'bg-slate-100 text-slate-900 dark:bg-emerald-700/50 dark:text-emerald-100'
                      : 'text-slate-800 dark:text-emerald-200'
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                  <span>Système</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setAppearanceMode('dark')}
                  className={`flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-emerald-800/30 focus:bg-slate-100 dark:focus:bg-emerald-800/30 ${
                    appearanceMode === 'dark' 
                      ? 'bg-slate-100 text-slate-900 dark:bg-emerald-700/50 dark:text-emerald-100'
                      : 'text-slate-800 dark:text-emerald-200'
                  }`}
                >
                  <Moon className="h-4 w-4" />
                  <span>Sombre</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast({ title: "Enregistrer", description: "Prochainement disponible" })}
              className="h-8 gap-1.5 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-800/20 hover:text-slate-900 dark:hover:text-emerald-100"
            >
              <Bookmark className="h-3.5 w-3.5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="h-8 gap-1.5 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-800/20 hover:text-slate-900 dark:hover:text-emerald-100"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default PodcastNavigationHeader;