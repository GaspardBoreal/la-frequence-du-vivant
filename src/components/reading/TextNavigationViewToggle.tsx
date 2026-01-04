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
      "flex items-center bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-600 rounded-xl p-1",
      className
    )}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onModeChange('fil')}
        className={cn(
          "rounded-lg px-2.5 py-1.5 h-auto text-xs gap-1.5 transition-all",
          mode === 'fil' 
            ? "!bg-emerald-700 !text-white shadow-sm font-medium" 
            : "text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50"
        )}
      >
        <BookOpen className="h-3.5 w-3.5" />
        <span>Fil</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onModeChange('parcours')}
        className={cn(
          "rounded-lg px-2.5 py-1.5 h-auto text-xs gap-1.5 transition-all",
          mode === 'parcours' 
            ? "!bg-emerald-700 !text-white shadow-sm font-medium" 
            : "text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50"
        )}
      >
        <Route className="h-3.5 w-3.5" />
        <span>Parcours</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onModeChange('anthologie')}
        className={cn(
          "rounded-lg px-2.5 py-1.5 h-auto text-xs gap-1.5 transition-all",
          mode === 'anthologie' 
            ? "!bg-emerald-700 !text-white shadow-sm font-medium" 
            : "text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50"
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>Anthologie</span>
      </Button>
    </div>
  );
}
