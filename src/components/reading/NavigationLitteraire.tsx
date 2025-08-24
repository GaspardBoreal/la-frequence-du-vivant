import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  currentIndex: number;
  totalTexts: number;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}

export default function NavigationLitteraire({ 
  currentIndex, 
  totalTexts, 
  onPrevious, 
  onNext, 
  className 
}: Props) {
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < totalTexts - 1;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onPrevious}
        disabled={!hasPrevious}
        className="h-8 w-8 p-0 rounded-full hover:bg-muted/50 disabled:opacity-30 text-slate-800 dark:text-slate-300"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      
      <div className="text-xs text-slate-800 dark:text-slate-300 font-normal min-w-[3rem] text-center">
        {currentIndex + 1} / {totalTexts}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onNext}
        disabled={!hasNext}
        className="h-8 w-8 p-0 rounded-full hover:bg-muted/50 disabled:opacity-30 text-slate-800 dark:text-slate-300"
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}