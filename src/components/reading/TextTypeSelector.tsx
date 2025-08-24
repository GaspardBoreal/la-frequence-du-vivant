import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { getTextTypeInfo, TextType } from '@/types/textTypes';

interface Props {
  currentType: TextType;
  availableTypes: TextType[];
  onTypeSelect: (type: TextType) => void;
}

export default function TextTypeSelector({ currentType, availableTypes, onTypeSelect }: Props) {
  const [open, setOpen] = useState(false);
  const currentTypeInfo = getTextTypeInfo(currentType);

  const sortedTypes = [...availableTypes].sort((a, b) => {
    const aInfo = getTextTypeInfo(a);
    const bInfo = getTextTypeInfo(b);
    return aInfo.label.localeCompare(bInfo.label);
  });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto p-2 gap-1.5 text-slate-800 dark:text-slate-300">
          <Badge variant="outline" className="text-xs font-normal text-slate-800 dark:text-slate-300 border-slate-800/30 dark:border-slate-300/20 bg-white/50 dark:bg-slate-800/50">
            <span className="mr-1">{currentTypeInfo.icon}</span>
            {currentTypeInfo.label}
          </Badge>
          <ChevronDown className="h-3 w-3 opacity-50 text-slate-800 dark:text-slate-300" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60">
        {sortedTypes.map((type) => {
          const typeInfo = getTextTypeInfo(type);
          const isActive = type === currentType;
          return (
            <DropdownMenuItem
              key={type}
              onClick={() => {
                onTypeSelect(type);
                setOpen(false);
              }}
              className={`flex items-center gap-2 cursor-pointer hover:bg-muted/50 ${
                isActive 
                  ? 'bg-yellow-200 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' 
                  : 'text-slate-800 dark:text-slate-300'
              }`}
            >
              <span className="text-sm">{typeInfo.icon}</span>
              <span className="text-sm">{typeInfo.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}