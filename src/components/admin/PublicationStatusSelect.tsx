import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff, Users } from 'lucide-react';

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
    const isVisibleToReaders = value === 'published_public' || value === 'published_readers';
    
    return (
      <div className="flex items-center gap-2">
        <Switch
          checked={isVisibleToReaders}
          onCheckedChange={(checked) => {
            onChange(checked ? 'published_public' : 'draft');
          }}
        />
        <span className="text-xs text-muted-foreground">
          Visible aux lecteurs
        </span>
      </div>
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