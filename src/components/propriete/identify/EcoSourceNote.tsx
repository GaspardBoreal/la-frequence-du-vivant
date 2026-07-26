import React from 'react';
import { BookOpen } from 'lucide-react';
import { ECO_SOURCE } from '@/lib/plantIndicatorKb';

export const EcoSourceNote: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <p
    className={`flex items-start gap-2 text-[hsl(var(--ds-forest-deep))]/60 italic ${
      compact ? 'text-[9px] mt-2' : 'text-[10px] mt-4 pt-3 border-t border-[hsl(var(--ds-line))]'
    }`}
  >
    <BookOpen className="w-3 h-3 mt-[1px] shrink-0 not-italic" />
    <span>{ECO_SOURCE}</span>
  </p>
);
