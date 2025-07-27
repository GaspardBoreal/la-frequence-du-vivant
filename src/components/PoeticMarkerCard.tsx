
import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Play, 
  Pause, 
  Image as ImageIcon, 
  Volume2, 
  VideoIcon, 
  BookOpen, 
  MessageSquare, 
  ExternalLink,
  Link,
  Sparkles,
  Heart,
  Eye
} from 'lucide-react';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { RegionalTheme } from '../utils/regionalThemes';
import PoeticPhotoGallery from './PoeticPhotoGallery';

interface PoeticMarkerCardProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
}

const PoeticMarkerCard: React.FC<PoeticMarkerCardProps> = ({ marche, theme }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [explorationMode, setExplorationMode] = useState<'visual' | 'audio' | 'poetic' | 'social'>('visual');

  const handleAudioPlay = (audioUrl: string) => {
    if (currentAudio === audioUrl && isPlaying) {
      setIsPlaying(false);
      // Pause audio logic
    } else {
      setCurrentAudio(audioUrl);
      setIsPlaying(true);
      // Play audio logic
    }
  };

  const ExplorationModeSelector = () => (
    <div className="flex justify-center space-x-2 mb-4">
      <Button
        variant={explorationMode === 'visual' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setExplorationMode('visual')}
        className="flex items-center space-x-1"
      >
        <Eye className="h-4 w-4" />
        <span>Visuel</span>
      </Button>
      <Button
        variant={explorationMode === 'audio' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setExplorationMode('audio')}
        className="flex items-center space-x-1"
      >
        <Volume2 className="h-4 w-4" />
        <span>Sonore</span>
      </Button>
      <Button
        variant={explorationMode === 'poetic' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setExplorationMode('poetic')}
        className="flex items-center space-x-1"
      >
        <BookOpen className="h-4 w-4" />
        <span>Poétique</span>
      </Button>
      <Button
        variant={explorationMode === 'social' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setExplorationMode('social')}
        className="flex items-center space-x-1"
      >
        <MessageSquare className="h-4 w-4" />
        <span>Social</span>
      </Button>
    </div>
  );

  const VisualExploration = () => (
    <div className="space-y-4">
      <PoeticPhotoGallery marche={marche} theme={theme} />
      
      {marche.videos && marche.videos.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center">
            <VideoIcon className="h-4 w-4 mr-2" />
            Explorations vidéo
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {marche.videos.map((video, index) => (
              <div key={index} className="relative group">
                <video
                  src={video}
                  className="w-full h-32 object-cover rounded-lg shadow-md"
                  controls
                  preload="metadata"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const AudioExploration = () => (
    <div className="space-y-4">
      {marche.audioFiles && marche.audioFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center">
            <Volume2 className="h-4 w-4 mr-2" />
            Paysages sonores
          </h4>
          {marche.audioFiles.map((audio, index) => (
            <div key={index} className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Séquence {index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAudioPlay(audio)}
                  className="flex items-center space-x-1"
                >
                  {currentAudio === audio && isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: currentAudio === audio && isPlaying ? '100%' : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const PoeticExploration = () => (
    <div className="space-y-4">
      {/* Afficher le poème en priorité, sinon le descriptif long */}
      {(marche.poeme || marche.descriptifLong) && (
        <div className="relative">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border-l-4 border-amber-400">
            <h4 className="font-medium text-sm flex items-center mb-3">
              <BookOpen className="h-4 w-4 mr-2" />
              {marche.poeme ? 'Poème' : 'Texte poétique'}
            </h4>
            <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-line font-serif italic">
              {marche.poeme || marche.descriptifLong}
            </div>
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
          </div>
        </div>
      )}
      
      {/* Afficher le descriptif court si disponible et différent du poème */}
      {marche.descriptifCourt && marche.descriptifCourt !== marche.poeme && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-l-4 border-blue-400">
          <h4 className="font-medium text-sm flex items-center mb-3">
            <Heart className="h-4 w-4 mr-2" />
            Description
          </h4>
          <div className="text-sm leading-relaxed text-gray-700">
            {marche.descriptifCourt}
          </div>
        </div>
      )}
      
      {marche.supabaseTags && marche.supabaseTags.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Thématiques</h4>
          <div className="flex flex-wrap gap-1">
            {marche.supabaseTags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const SocialExploration = () => (
    <div className="space-y-4">
      <div className="text-center text-gray-500 text-sm py-8">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Les fonctionnalités sociales seront bientôt disponibles</p>
      </div>
    </div>
  );

  return (
    <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-white to-gray-50 border-2 border-transparent hover:border-purple-200">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1 leading-tight">
                    {marche.nomMarche || marche.ville}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {marche.descriptifCourt || marche.theme}
                  </p>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  {marche.photos && marche.photos.length > 0 && (
                    <div className="flex items-center">
                      <ImageIcon className="h-3 w-3 mr-1" />
                      <span>{marche.photos.length}</span>
                    </div>
                  )}
                  {marche.audioFiles && marche.audioFiles.length > 0 && (
                    <div className="flex items-center">
                      <Volume2 className="h-3 w-3 mr-1" />
                      <span>{marche.audioFiles.length}</span>
                    </div>
                  )}
                  {marche.poeme && (
                    <BookOpen className="h-3 w-3" />
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{marche.ville}</span>
                  <span>•</span>
                  <span>{marche.region}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {marche.theme}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {marche.nomMarche || marche.ville}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            {marche.descriptifCourt || marche.theme}
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
          <ExplorationModeSelector />
          
          <div className="min-h-[300px]">
            {explorationMode === 'visual' && <VisualExploration />}
            {explorationMode === 'audio' && <AudioExploration />}
            {explorationMode === 'poetic' && <PoeticExploration />}
            {explorationMode === 'social' && <SocialExploration />}
          </div>
          
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-3">
                <span>{marche.ville}, {marche.departement}</span>
                <span>•</span>
                <span>{marche.region}</span>
              </div>
              {marche.lien && (
                <a
                  href={marche.lien}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Plus d'infos</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PoeticMarkerCard;
