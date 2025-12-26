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
  Moon,
  Clock,
  ChevronDown
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

// Format duration in human-readable format
const formatPlaylistDuration = (seconds: number): string => {
  if (seconds <= 0) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${mins.toString().padStart(2, '0')}min`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Compact duration format for small screens
const formatCompactDuration = (seconds: number): string => {
  if (seconds <= 0) return '0min';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h${mins > 0 ? mins : ''}`;
  }
  return `${mins}min`;
};

interface PodcastNavigationHeaderProps {
  explorationName?: string;
  currentTrackIndex?: number;
  totalTracks?: number;
  tracks?: Array<{ id: string; title: string; marche?: string; type?: AudioType }>;
  onTrackSelect?: (index: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  slug?: string;
  // New props for lifted state
  selectedAudioType?: AudioType | 'all';
  onAudioTypeChange?: (type: AudioType | 'all') => void;
  // Playlist duration props
  totalDurationSeconds?: number;
  remainingDurationSeconds?: number;
}

const PodcastNavigationHeader: React.FC<PodcastNavigationHeaderProps> = ({ 
  explorationName, 
  currentTrackIndex = 0, 
  totalTracks = 0, 
  tracks = [],
  onTrackSelect,
  onPrevious,
  onNext,
  slug,
  selectedAudioType = 'all',
  onAudioTypeChange,
  totalDurationSeconds = 0,
  remainingDurationSeconds = 0
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [appearanceMode, setAppearanceMode] = useState<AppearanceMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appearanceMode') as AppearanceMode;
      return saved || 'dark';
    }
    return 'dark';
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

  // Filter tracks based on selected type (for display count)
  const filteredTracks = selectedAudioType === 'all' 
    ? tracks 
    : tracks.filter(t => t.type === selectedAudioType);

  const handleTypeSelect = (type: AudioType | 'all') => {
    // Use lifted state handler if provided
    if (onAudioTypeChange) {
      onAudioTypeChange(type);
    }
  };

  // Get label for current audio type
  const getTypeLabel = (type: AudioType | 'all', compact = false): string => {
    switch (type) {
      case 'all': return compact ? 'Tous' : 'Tous les audio';
      case 'gaspard': return compact ? 'Gaspard' : 'Gaspard parle';
      case 'dordogne': return compact ? 'Dordogne' : 'La Dordogne parle';
      case 'sounds': return compact ? 'Sons' : 'Sons captés';
      default: return compact ? 'Tous' : 'Tous les audio';
    }
  };

  // Appearance dropdown content - reusable
  const AppearanceDropdownContent = () => (
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
  );

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 border-b bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800/60"
    >
      <div className="px-3 sm:px-4 py-2 sm:py-3">
        
        {/* ========== MOBILE LAYOUT (< 640px) ========== */}
        <div className="flex sm:hidden items-center justify-between gap-1">
          {/* Left: Back icon only */}
          <Button 
            variant="ghost" 
            size="sm" 
            asChild 
            className="h-8 w-8 p-0 shrink-0 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-800/20"
          >
            <Link to={`/galerie-fleuve/exploration/${slug}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          {/* Center: Type dropdown + Duration + Navigation */}
          <div className="flex items-center gap-1.5 flex-1 justify-center min-w-0">
            {/* Type selector as compact dropdown */}
            {availableTypes.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 gap-1 text-xs text-slate-700 dark:text-emerald-200 hover:bg-slate-100 dark:hover:bg-emerald-800/20"
                  >
                    <span className="truncate max-w-[60px]">{getTypeLabel(selectedAudioType, true)}</span>
                    <ChevronDown className="h-3 w-3 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="z-50 w-40 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 shadow-lg">
                  {(['all', ...availableTypes] as (AudioType | 'all')[]).map((type) => (
                    <DropdownMenuItem
                      key={type}
                      onClick={() => handleTypeSelect(type)}
                      className={`cursor-pointer ${
                        selectedAudioType === type 
                          ? 'bg-slate-100 dark:bg-emerald-700/50 text-slate-900 dark:text-emerald-100'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {getTypeLabel(type)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Compact duration badge (only show if duration is known) */}
            {remainingDurationSeconds > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-emerald-900/30 text-[10px] text-slate-600 dark:text-emerald-300 whitespace-nowrap">
                <Clock className="h-2.5 w-2.5" />
                <span>{formatCompactDuration(remainingDurationSeconds)}</span>
              </div>
            )}

            {/* Compact navigation */}
            {onPrevious && onNext && (
              <NavigationAudio
                currentIndex={currentTrackIndex}
                totalTracks={totalTracks}
                onPrevious={onPrevious}
                onNext={onNext}
                compact
              />
            )}
          </div>

          {/* Right: Share only (most important action) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="h-8 w-8 p-0 shrink-0 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-800/20"
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* ========== TABLET LAYOUT (640px - 1024px) ========== */}
        <div className="hidden sm:flex lg:hidden items-center justify-between gap-3">
          {/* Left: Compact back button */}
          <Button 
            variant="ghost" 
            size="sm" 
            asChild 
            className="shrink-0 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-800/20"
          >
            <Link to={`/galerie-fleuve/exploration/${slug}`}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="text-sm">Retour</span>
            </Link>
          </Button>

          {/* Center: Type buttons + Navigation + Duration */}
          <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
            {/* Type selector as compact buttons */}
            {availableTypes.length > 0 && (
              <div className="flex items-center gap-1">
                {(['all', ...availableTypes] as (AudioType | 'all')[]).map((type) => {
                  const isActive = selectedAudioType === type;
                  return (
                    <Button
                      key={type}
                      variant={isActive ? 'default' : 'ghost'}
                      size="sm"
                      className={`h-7 px-2 text-xs ${
                        isActive 
                          ? 'bg-slate-200 text-slate-900 dark:bg-emerald-700/50 dark:text-emerald-100' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-800/20'
                      }`}
                      onClick={() => handleTypeSelect(type)}
                    >
                      {getTypeLabel(type, true)}
                    </Button>
                  );
                })}
              </div>
            )}

            {/* Navigation */}
            {onPrevious && onNext && (
              <NavigationAudio
                currentIndex={currentTrackIndex}
                totalTracks={totalTracks}
                onPrevious={onPrevious}
                onNext={onNext}
              />
            )}

            {/* Duration badge - simplified (only show if duration is known) */}
            {remainingDurationSeconds > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-emerald-900/30 text-xs whitespace-nowrap">
                <Clock className="h-3 w-3 text-slate-500 dark:text-emerald-400" />
                <span className="text-slate-600 dark:text-emerald-300">
                  {formatCompactDuration(remainingDurationSeconds)} restant
                </span>
              </div>
            )}
          </div>

          {/* Right: Actions (icons only) */}
          <div className="flex items-center gap-1 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-800/20"
                >
                  <Palette className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <AppearanceDropdownContent />
            </DropdownMenu>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="h-8 w-8 p-0 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-800/20"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* ========== DESKTOP LAYOUT (>= 1024px) ========== */}
        <div className="hidden lg:flex items-center justify-between">
          {/* Left: Gaspard Boréal signature */}
          <div className="font-crimson text-slate-800 dark:text-emerald-200 shrink-0">
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
                  const isActive = selectedAudioType === type;
                  return (
                    <Button
                      key={type}
                      variant={isActive ? 'default' : 'ghost'}
                      size="sm"
                      className={isActive ? 'bg-slate-200 text-slate-900 dark:bg-emerald-700/50 dark:text-emerald-100' : 'text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-800/20 hover:text-slate-900 dark:hover:text-emerald-100'}
                      onClick={() => handleTypeSelect(type)}
                    >
                      {getTypeLabel(type)}
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

            {/* Desktop: Playlist duration indicator (only show if duration is known) */}
            {remainingDurationSeconds > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-emerald-900/30 text-sm">
                <Clock className="h-4 w-4 text-slate-500 dark:text-emerald-400" />
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-emerald-300">
                  <span className="font-medium">{formatPlaylistDuration(remainingDurationSeconds)}</span>
                  <span className="text-slate-400 dark:text-emerald-500">restant</span>
                  <span className="text-slate-300 dark:text-emerald-600 mx-1">•</span>
                  <span className="text-slate-500 dark:text-emerald-400">{formatPlaylistDuration(totalDurationSeconds)} total</span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-emerald-800/20">
                  <Palette className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <AppearanceDropdownContent />
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
