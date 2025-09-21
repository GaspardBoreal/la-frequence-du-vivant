import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Eye, Users, Waves } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ExplorationGalleryButtonsProps {
  explorationSlug: string;
}

const ExplorationGalleryButtons: React.FC<ExplorationGalleryButtonsProps> = ({ explorationSlug }) => {
  const navigate = useNavigate();
  
  const handleOpenExternal = (url: string) => {
    window.open(url, '_blank');
  };

  const handleNavigatePreview = (path: string) => {
    navigate(path);
  };

  return (
    <Card className="overflow-hidden rounded-3xl bg-gradient-to-br from-gaspard-background/40 via-gaspard-background/20 to-transparent backdrop-blur-xl border border-gaspard-primary/20 shadow-2xl shadow-gaspard-primary/10">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gaspard-accent/20 to-gaspard-secondary/30 flex items-center justify-center backdrop-blur-sm">
            <Waves className="h-4 w-4 text-gaspard-accent" />
          </div>
          <CardTitle className="gaspard-main-title text-2xl font-bold text-gaspard-primary">
            Galeries publiques
          </CardTitle>
        </div>
        <p className="text-sm text-gaspard-muted font-light">
          Accéder aux différentes versions de la galerie fleuve
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gaspard-primary flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Galerie complète (Partenaires)
          </h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenExternal(`${window.location.origin}/galerie-fleuve/exploration/${explorationSlug}`)}
              className="flex-1 text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Ouvrir la galerie complète
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigatePreview(`/galerie-fleuve/exploration/${explorationSlug}?preview=true`)}
              className="text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
          </div>
        </div>

        {/* Galerie lecteurs */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gaspard-primary flex items-center gap-2">
            <Users className="h-4 w-4" />
            Galerie lecteurs (Progressive)
          </h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenExternal(`${window.location.origin}/lecteurs/exploration/${explorationSlug}`)}
              className="flex-1 text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Ouvrir la galerie lecteurs
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigatePreview(`/lecteurs/exploration/${explorationSlug}?preview=true`)}
              className="text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gaspard-primary/5 rounded-xl border border-gaspard-primary/10">
          <p className="text-xs text-gaspard-muted leading-relaxed">
            <strong>Galerie complète :</strong> Toutes les marches (public + lecteurs + brouillons)<br/>
            <strong>Galerie lecteurs :</strong> Seulement les marches "Public complet" + "Lecteurs seulement"
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExplorationGalleryButtons;