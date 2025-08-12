import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PodcastNavigationHeaderProps {
  explorationName?: string;
}

const PodcastNavigationHeader: React.FC<PodcastNavigationHeaderProps> = ({ explorationName }) => {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate('/explorations/remontee-dordogne-atlas-eaux-vivantes-2050-2100/experience/a467469c-358f-4ccc-bc77-0de6c06ef9ce');
  };

  const handleBackClick = () => {
    navigate('/explorations/remontee-dordogne-atlas-eaux-vivantes-2050-2100/experience/a467469c-358f-4ccc-bc77-0de6c06ef9ce');
  };

  return (
    <header className="relative z-30 w-full">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Title avec lien vers l'accueil */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={handleHomeClick}
          >
            <Waves className="h-8 w-8 text-emerald-300 group-hover:text-emerald-200 transition-colors duration-300" />
            <div>
              <h1 className="dordogne-title text-xl text-emerald-200 group-hover:text-white transition-colors duration-300">
                Marches Techno-Sensibles
              </h1>
              {explorationName && (
                <p className="dordogne-body text-sm text-emerald-400/80 group-hover:text-emerald-300/90 transition-colors duration-300">
                  {explorationName}
                </p>
              )}
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackClick}
              className="bg-emerald-900/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-800/30 hover:border-emerald-300/60 hover:text-emerald-100 transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PodcastNavigationHeader;