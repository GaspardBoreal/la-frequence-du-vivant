import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Eye, EyeOff, Users, ChevronDown } from 'lucide-react';

type PublicationStatus = 'published_public' | 'published_readers' | 'draft';

interface PublicationStatusSelectProps {
  value: PublicationStatus;
  onChange: (status: PublicationStatus) => void;
  variant?: 'default' | 'compact';
}

const PublicationStatusSelect: React.FC<PublicationStatusSelectProps> = ({ 
  value, 
  onChange, 
  variant = 'default' 
}) => {
  const getStatusInfo = (status: PublicationStatus) => {
    switch (status) {
      case 'published_public':
        return {
          label: 'Public complet',
          icon: Eye,
          color: 'bg-green-100 text-green-800 border-green-200',
          description: 'Visible par tous (partenaires + lecteurs)'
        };
      case 'published_readers':
        return {
          label: 'Lecteurs seulement',
          icon: Users,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          description: 'Visible uniquement par les lecteurs'
        };
      case 'draft':
        return {
          label: 'Brouillon',
          icon: EyeOff,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: 'Non visible publiquement'
        };
    }
  };

  if (variant === 'compact') {
    const statusInfo = getStatusInfo(value);
    const Icon = statusInfo.icon;
    
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className={`${statusInfo.color} text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-md border hover:opacity-80 transition-opacity cursor-pointer`}>
            <Icon className="h-3 w-3" />
            {statusInfo.label}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" align="start">
          <div className="space-y-1">
            <button
              onClick={() => onChange('published_public')}
              className={`w-full flex items-center gap-2 px-2 py-2 text-sm hover:bg-muted rounded-sm transition-colors ${
                value === 'published_public' ? 'bg-muted' : ''
              }`}
            >
              <Eye className="h-4 w-4 text-green-600" />
              <div className="text-left">
                <div className="font-medium">Public complet</div>
                <div className="text-xs text-muted-foreground">Partenaires + Lecteurs</div>
              </div>
            </button>
            <button
              onClick={() => onChange('published_readers')}
              className={`w-full flex items-center gap-2 px-2 py-2 text-sm hover:bg-muted rounded-sm transition-colors ${
                value === 'published_readers' ? 'bg-muted' : ''
              }`}
            >
              <Users className="h-4 w-4 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">Lecteurs seulement</div>
                <div className="text-xs text-muted-foreground">URL lecteurs uniquement</div>
              </div>
            </button>
            <button
              onClick={() => onChange('draft')}
              className={`w-full flex items-center gap-2 px-2 py-2 text-sm hover:bg-muted rounded-sm transition-colors ${
                value === 'draft' ? 'bg-muted' : ''
              }`}
            >
              <EyeOff className="h-4 w-4 text-gray-600" />
              <div className="text-left">
                <div className="font-medium">Brouillon</div>
                <div className="text-xs text-muted-foreground">Non visible publiquement</div>
              </div>
            </button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="published_public">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-green-600" />
            <div>
              <div className="font-medium">Public complet</div>
              <div className="text-xs text-muted-foreground">Partenaires + Lecteurs</div>
            </div>
          </div>
        </SelectItem>
        <SelectItem value="published_readers">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <div>
              <div className="font-medium">Lecteurs seulement</div>
              <div className="text-xs text-muted-foreground">URL lecteurs uniquement</div>
            </div>
          </div>
        </SelectItem>
        <SelectItem value="draft">
          <div className="flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-gray-600" />
            <div>
              <div className="font-medium">Brouillon</div>
              <div className="text-xs text-muted-foreground">Non visible publiquement</div>
            </div>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default PublicationStatusSelect;