// Toggle between List, Parcours, and Selection views for the audio playlist
import React from 'react';
import { Button } from '@/components/ui/button';
import { List, Route, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PlaylistViewMode = 'list' | 'parcours' | 'selection';

interface PlaylistViewToggleProps {
  mode: PlaylistViewMode;
  onModeChange: (mode: PlaylistViewMode) => void;
  className?: string;
}

export default function PlaylistViewToggle({ mode, onModeChange, className }: PlaylistViewToggleProps) {
  return (
    <div className={cn("flex items-center gap-1 p-1 rounded-lg bg-muted/50", className)}>
      <Button
        variant={mode === 'list' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('list')}
        className={cn(
          "h-8 px-3 gap-1.5 text-xs font-medium transition-all",
          mode === 'list' 
            ? "bg-background shadow-sm" 
            : "hover:bg-background/50"
        )}
      >
        <List className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Liste</span>
      </Button>
      <Button
        variant={mode === 'parcours' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('parcours')}
        className={cn(
          "h-8 px-3 gap-1.5 text-xs font-medium transition-all",
          mode === 'parcours' 
            ? "bg-background shadow-sm" 
            : "hover:bg-background/50"
        )}
      >
        <Route className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Parcours</span>
      </Button>
      <Button
        variant={mode === 'selection' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('selection')}
        className={cn(
          "h-8 px-3 gap-1.5 text-xs font-medium transition-all",
          mode === 'selection' 
            ? "bg-background shadow-sm" 
            : "hover:bg-background/50"
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Sélection</span>
      </Button>
    </div>
  );
}
