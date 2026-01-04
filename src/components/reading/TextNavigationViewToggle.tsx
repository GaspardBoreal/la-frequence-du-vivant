// Text Navigation View Toggle - 3 modes: Fil, Parcours, Anthologie
// Mirrors PlaylistViewToggle for consistency across Écouter and Lire sections
import React from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, Route, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TextViewMode = 'fil' | 'parcours' | 'anthologie';

interface TextNavigationViewToggleProps {
  mode: TextViewMode;
  onModeChange: (mode: TextViewMode) => void;
  className?: string;
}

export default function TextNavigationViewToggle({
  mode,
  onModeChange,
  className
}: TextNavigationViewToggleProps) {
  return (
    <div className={cn(
      "flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1",
      className
    )}>
      <Button
        variant={mode === 'fil' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('fil')}
        className={cn(
          "rounded-lg px-2.5 py-1.5 h-auto text-xs gap-1.5 transition-all",
          mode === 'fil' 
            ? "bg-white dark:bg-slate-700 shadow-sm font-medium" 
            : "hover:bg-white/50 dark:hover:bg-slate-700/50"
        )}
      >
        <BookOpen className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Fil</span>
      </Button>
      
      <Button
        variant={mode === 'parcours' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('parcours')}
        className={cn(
          "rounded-lg px-2.5 py-1.5 h-auto text-xs gap-1.5 transition-all",
          mode === 'parcours' 
            ? "bg-white dark:bg-slate-700 shadow-sm font-medium" 
            : "hover:bg-white/50 dark:hover:bg-slate-700/50"
        )}
      >
        <Route className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Parcours</span>
      </Button>
      
      <Button
        variant={mode === 'anthologie' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('anthologie')}
        className={cn(
          "rounded-lg px-2.5 py-1.5 h-auto text-xs gap-1.5 transition-all",
          mode === 'anthologie' 
            ? "bg-white dark:bg-slate-700 shadow-sm font-medium" 
            : "hover:bg-white/50 dark:hover:bg-slate-700/50"
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Anthologie</span>
      </Button>
    </div>
  );
}
