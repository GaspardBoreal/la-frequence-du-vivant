
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SkipBack, 
  SkipForward, 
  BarChart3,
  Radio,
  Share2,
  Waves,
  Music,
  Download,
  ExternalLink,
  Volume2
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { RegionalTheme } from '../utils/regionalThemes';

interface AudioExperienceSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
}

interface AudioFile {
  url: string;
  name: string;
  title?: string;
  description?: string;
}

const AudioExperienceSection: React.FC<AudioExperienceSectionProps> = ({ marche, theme }) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [activeOption, setActiveOption] = useState<'spectogram' | 'frequencies' | 'share' | null>(null);
  
  // Récupérer les fichiers audio depuis les props (maintenant depuis Supabase)
  const audioUrls = marche.audioFiles || [];
  const audioData = marche.audioData || [];
  
          // Transformer en format AudioFile en utilisant les métadonnées Supabase si disponibles
  const audioFiles: AudioFile[] = audioData.length > 0 
    ? audioData
        .sort((a, b) => (a.ordre || 0) - (b.ordre || 0)) // Trier par ordre
        .map((audio, index) => {
          // Description spécifique pour la marche de Gauriac
          let description = audio.description;
          if (!description) {
            if (marche.ville?.toLowerCase() === 'gauriac') {
              description = 'Resac Bec d\'Ambès';
            } else {
              description = `Enregistrement audio de la marche à ${marche.ville}`;
            }
          }
          
          return {
            url: audio.url,
            name: audio.titre || audio.nom_fichier || `Audio ${index + 1}`,
            title: audio.titre,
            description
          };
        })
    : audioUrls.map((url, index) => ({
        url,
        name: `Audio-${index + 1}-${marche.ville}.mp3`,
        description: `Enregistrement audio de la marche à ${marche.ville}`
      }));

  const currentTrack = audioFiles[currentTrackIndex] || null;
  const hasAudioFiles = audioFiles.length > 0;

  // Logs de débogage détaillés
  console.log(`🔧 DEBUG AudioExperienceSection: Marche ${marche.ville}`);
  console.log(`🔧 DEBUG AudioExperienceSection: audioUrls length:`, audioUrls.length);
  console.log(`🔧 DEBUG AudioExperienceSection: audioFiles length:`, audioFiles.length);
  console.log(`🔧 DEBUG AudioExperienceSection: hasAudioFiles:`, hasAudioFiles);
  console.log(`🔧 DEBUG AudioExperienceSection: currentTrack:`, currentTrack?.name);
  console.log(`🔧 DEBUG AudioExperienceSection: Component rendered successfully`);

  const handleNext = () => {
    if (audioFiles.length <= 1) return;
    const nextIndex = (currentTrackIndex + 1) % audioFiles.length;
    setCurrentTrackIndex(nextIndex);
  };

  const handlePrevious = () => {
    if (audioFiles.length <= 1) return;
    const prevIndex = currentTrackIndex === 0 ? audioFiles.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
  };

  const handleDirectAccess = (track: AudioFile) => {
    // Ouvrir directement l'URL Supabase
    if (track.url.startsWith('http')) {
      window.open(track.url, '_blank', 'noopener,noreferrer');
    } else {
      console.error('URL audio invalide:', track.url);
    }
  };

  const handleDownload = (track: AudioFile) => {
    // Créer un lien de téléchargement
    const link = document.createElement('a');
    link.href = track.url;
    link.download = track.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const options = [
    {
      id: 'spectogram' as const,
      label: 'Voir le Spectrogramme',
      icon: BarChart3,
      color: theme.colors.primary,
      description: 'Visualisation des fréquences en temps réel'
    },
    {
      id: 'frequencies' as const,
      label: 'Reconnaître les fréquences sonores',
      icon: Radio,
      color: theme.colors.secondary,
      description: 'Analyse intelligente des sons captés'
    },
    {
      id: 'share' as const,
      label: 'Partager l\'expérience',
      icon: Share2,
      color: theme.colors.accent,
      description: 'Diffusez votre exploration sonore'
    }
  ];

  // Affichage quand il n'y a pas de fichiers audio
  if (!hasAudioFiles) {
    console.log(`🔧 DEBUG AudioExperienceSection: Affichage du message "Pas de fichiers audio"`);
    return (
      <div className="space-y-12 pt-16">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-5xl font-crimson font-bold flex items-center justify-center gap-4">
            <Waves className="h-10 w-10 text-purple-600" />
            Expérience Audio
          </h2>
        </motion.div>

        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <div className="gaspard-glass rounded-3xl p-12 text-center space-y-8 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-purple-300 to-blue-300 rounded-full opacity-20"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`
                  }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{
                    duration: 4 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 3
                  }}
                />
              ))}
            </div>

            <motion.div
              className="relative z-10"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
                <Music className="h-12 w-12 text-purple-600" />
              </div>
            </motion.div>

            <div className="relative z-10 space-y-4">
              <h3 className="text-3xl font-crimson font-bold text-white">
                Pas encore de paysages sonores à écouter
              </h3>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
                Les explorations audio de <span className="font-semibold text-purple-600">{marche.ville}</span> 
                {' '}seront bientôt disponibles. Cette expérience immersive vous permettra de découvrir 
                les sons uniques capturés lors de cette marche techno-sensible.
              </p>
            </div>

            <motion.div
              className="relative z-10 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-full border border-purple-200">
                <Waves className="h-4 w-4 text-purple-600" />
                <span className="text-purple-700 font-medium">Expérience en préparation</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  console.log(`🔧 DEBUG AudioExperienceSection: Affichage du lecteur audio avec ${audioFiles.length} fichier(s)`);

  return (
    <div className="space-y-6 pt-6">
      {/* Header Section */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-5xl font-crimson font-bold flex items-center justify-center gap-4">
          <Waves className="h-10 w-10 text-purple-600" />
          Expérience Audio
        </h2>
      </motion.div>

      {/* Audio Player Interface */}
      <motion.div
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <div className="gaspard-glass rounded-3xl p-8 space-y-8 relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`
                }}
                animate={{
                  scale: [1, 2, 1],
                  opacity: [0.3, 0.8, 0.3]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>

          {/* Audio Player */}
          <div className="text-center space-y-6 relative z-10">

            {/* Audio HTML5 Player */}
            <div className="bg-white/50 rounded-2xl p-6 backdrop-blur-sm">
              <audio
                key={currentTrack?.url} // Force re-render when track changes
                src={currentTrack?.url}
                controls
                className="w-full"
                preload="metadata"
                style={{
                  height: '54px',
                  background: 'transparent'
                }}
              >
                Votre navigateur ne supporte pas l'élément audio.
              </audio>
              
              {/* Titre principal sous le lecteur */}
              {currentTrack?.description && (
                <h3 className="text-xl font-bold text-gray-800 mt-4 text-center">
                  {currentTrack.description}
                </h3>
              )}
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-center gap-6">
              {audioFiles.length > 1 && (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handlePrevious}
                  className="rounded-full p-3 hover:bg-purple-100 transition-all duration-300"
                >
                  <SkipBack className="h-6 w-6" />
                </Button>
              )}

              <motion.div className="text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-xl font-bold text-purple-600">
                    {currentTrackIndex + 1} / {audioFiles.length}
                  </span>
                </div>
              </motion.div>

              {audioFiles.length > 1 && (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleNext}
                  className="rounded-full p-3 hover:bg-purple-100 transition-all duration-300"
                >
                  <SkipForward className="h-6 w-6" />
                </Button>
              )}
            </div>

          </div>
        </div>
      </motion.div>

      {/* Experience Options */}
      {hasAudioFiles && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          {options.map((option, index) => {
            const Icon = option.icon;
            const isActive = activeOption === option.id;
            
            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
              >
                <Button
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setActiveOption(isActive ? null : option.id)}
                  className={`
                    w-full h-auto p-6 rounded-2xl transition-all duration-500 group
                    ${isActive 
                      ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-2xl scale-105' 
                      : 'gaspard-glass hover:shadow-xl hover:scale-102'
                    }
                  `}
                >
                  <div className="flex flex-col items-center space-y-4 text-center">
                    <motion.div
                      animate={{ 
                        rotate: isActive ? 360 : 0,
                        scale: isActive ? 1.2 : 1 
                      }}
                      transition={{ duration: 0.6 }}
                      className={`
                        p-4 rounded-full 
                        ${isActive 
                          ? 'bg-white/20' 
                          : 'bg-gradient-to-br from-purple-100 to-blue-100'
                        }
                      `}
                    >
                      <Icon className={`h-8 w-8 ${isActive ? 'text-white' : 'text-purple-600'}`} />
                    </motion.div>
                    
                    <div className="space-y-2">
                      <h3 className={`font-semibold text-lg ${isActive ? 'text-white' : 'text-gray-800'}`}>
                        {option.label}
                      </h3>
                      <p className={`text-sm ${isActive ? 'text-white/80' : 'text-gray-600'}`}>
                        {option.description}
                      </p>
                    </div>
                    
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-xs bg-white/20 px-3 py-1 rounded-full text-white"
                      >
                        Bientôt disponible
                      </motion.div>
                    )}
                  </div>
                </Button>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Active Option Display */}
      <AnimatePresence>
        {activeOption && hasAudioFiles && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <div className="gaspard-glass rounded-2xl p-8 text-center">
              <h4 className="text-2xl font-bold mb-4 text-purple-600">
                {options.find(opt => opt.id === activeOption)?.label}
              </h4>
              <p className="text-gray-600 text-lg">
                Cette fonctionnalité révolutionnaire sera bientôt disponible. 
                Restez connectés pour découvrir des expériences sonores inédites !
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AudioExperienceSection;
