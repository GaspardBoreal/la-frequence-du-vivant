import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  currentIndex: number;
  totalTracks: number;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}

export default function NavigationAudio({ 
  currentIndex, 
  totalTracks, 
  onPrevious, 
  onNext, 
  className 
}: Props) {
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < totalTracks - 1;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onPrevious}
        disabled={!hasPrevious}
        className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-emerald-800/20 disabled:opacity-30 text-slate-800 dark:text-emerald-200 hover:text-slate-900 dark:hover:text-emerald-100"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      
      <div className="text-xs text-slate-800 dark:text-emerald-200 font-normal min-w-[3rem] text-center">
        {currentIndex + 1} / {totalTracks}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onNext}
        disabled={!hasNext}
        className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-emerald-800/20 disabled:opacity-30 text-slate-800 dark:text-emerald-200 hover:text-slate-900 dark:hover:text-emerald-100"
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}