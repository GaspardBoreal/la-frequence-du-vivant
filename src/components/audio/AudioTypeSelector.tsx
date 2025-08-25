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

export type AudioType = 'gaspard' | 'dordogne' | 'sounds';

interface AudioTypeInfo {
  icon: string;
  label: string;
}

const getAudioTypeInfo = (type: AudioType): AudioTypeInfo => {
  switch (type) {
    case 'gaspard':
      return { icon: '🎙️', label: 'Gaspard parle' };
    case 'dordogne':
      return { icon: '🌊', label: 'La Dordogne parle' };
    case 'sounds':
      return { icon: '🎵', label: 'Sons captés' };
    default:
      return { icon: '🎵', label: 'Audio' };
  }
};

interface Props {
  currentType: AudioType | 'all';
  availableTypes: AudioType[];
  onTypeSelect: (type: AudioType | 'all') => void;
}

export default function AudioTypeSelector({ currentType, availableTypes, onTypeSelect }: Props) {
  const [open, setOpen] = useState(false);
  const currentTypeInfo = currentType === 'all' 
    ? { icon: '🎧', label: 'Tous les audio' }
    : getAudioTypeInfo(currentType);

  const allTypes: (AudioType | 'all')[] = ['all', ...availableTypes.sort((a, b) => {
    const aInfo = getAudioTypeInfo(a);
    const bInfo = getAudioTypeInfo(b);
    return aInfo.label.localeCompare(bInfo.label);
  })];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto p-2 gap-1.5 text-emerald-200 hover:text-emerald-100">
          <Badge variant="outline" className="text-xs font-normal text-emerald-200 border-emerald-400/30 bg-emerald-900/20">
            <span className="mr-1">{currentTypeInfo.icon}</span>
            {currentTypeInfo.label}
          </Badge>
          <ChevronDown className="h-3 w-3 opacity-50 text-emerald-200" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 bg-slate-800 border-emerald-400/30">
        {allTypes.map((type) => {
          const typeInfo = type === 'all' 
            ? { icon: '🎧', label: 'Tous les audio' }
            : getAudioTypeInfo(type);
          const isActive = type === currentType;
          return (
            <DropdownMenuItem
              key={type}
              onClick={() => {
                onTypeSelect(type);
                setOpen(false);
              }}
              className={`flex items-center gap-2 cursor-pointer hover:bg-emerald-800/30 focus:bg-emerald-800/30 ${
                isActive 
                  ? 'bg-emerald-700/50 text-emerald-100' 
                  : 'text-emerald-200'
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

export { getAudioTypeInfo, type AudioTypeInfo };