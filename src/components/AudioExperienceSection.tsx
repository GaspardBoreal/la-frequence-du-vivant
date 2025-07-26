
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  BarChart3,
  Radio,
  Share2,
  Clock,
  Waves
} from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { MarcheTechnoSensible } from '../utils/googleSheetsApi';
import { RegionalTheme } from '../utils/regionalThemes';

interface AudioExperienceSectionProps {
  marche: MarcheTechnoSensible;
  theme: RegionalTheme;
}

const AudioExperienceSection: React.FC<AudioExperienceSectionProps> = ({ marche, theme }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [activeOption, setActiveOption] = useState<'spectogram' | 'frequencies' | 'share' | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Mock audio files - in real implementation, these would come from marche data
  const audioFiles = [
    {
      name: "Exploration Sonore 1",
      url: "/audio/sample1.m4a",
      duration: 245,
      description: "Ambiance urbaine et nature"
    },
    {
      name: "Fréquences Cachées",
      url: "/audio/sample2.mp3", 
      duration: 312,
      description: "Sons imperceptibles révélés"
    },
    {
      name: "Résonance du Lieu", 
      url: "/audio/sample3.wav",
      duration: 189,
      description: "Écho architectural unique"
    }
  ];

  const currentTrack = audioFiles[currentTrackIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleNext);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleNext);
    };
  }, [currentTrackIndex]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    const nextIndex = (currentTrackIndex + 1) % audioFiles.length;
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(false);
  };

  const handlePrevious = () => {
    const prevIndex = currentTrackIndex === 0 ? audioFiles.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    setIsPlaying(false);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = (value[0] / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newVolume = value[0] / 100;
    audio.volume = newVolume;
    setVolume(newVolume);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

  return (
    <div className="space-y-12">
      {/* Header Section */}
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
        <p className="text-gray-600 max-w-3xl mx-auto text-xl">
          Plongez dans l'univers sonore de <span className="font-semibold text-purple-600">{marche.ville}</span>
        </p>
      </motion.div>

      {/* Audio Player */}
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

          {/* Track Info */}
          <div className="text-center space-y-2 relative z-10">
            <Badge variant="secondary" className="text-sm px-4 py-1 bg-purple-100 text-purple-800">
              {currentTrackIndex + 1} / {audioFiles.length}
            </Badge>
            <h3 className="text-2xl font-crimson font-bold text-gray-800">
              {currentTrack.name}
            </h3>
            <p className="text-gray-600">
              {currentTrack.description}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 relative z-10">
            <Slider
              value={[duration ? (currentTime / duration) * 100 : 0]}
              onValueChange={handleSeek}
              className="w-full"
              max={100}
              step={0.1}
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(currentTime)}
              </span>
              <span>{formatTime(duration - currentTime)} restant</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex items-center justify-center gap-6 relative z-10">
            <Button
              variant="ghost"
              size="lg"
              onClick={handlePrevious}
              className="rounded-full p-3 hover:bg-purple-100 transition-all duration-300"
            >
              <SkipBack className="h-6 w-6" />
            </Button>

            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handlePlayPause}
                size="lg"
                className="rounded-full p-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-2xl"
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 ml-1" />
                )}
              </Button>
            </motion.div>

            <Button
              variant="ghost"
              size="lg"
              onClick={handleNext}
              className="rounded-full p-3 hover:bg-purple-100 transition-all duration-300"
            >
              <SkipForward className="h-6 w-6" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center justify-center gap-4 relative z-10">
            <Volume2 className="h-5 w-5 text-gray-600" />
            <div className="w-32">
              <Slider
                value={[volume * 100]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
              />
            </div>
          </div>

          {/* Audio Element */}
          <audio
            ref={audioRef}
            src={currentTrack.url}
            preload="metadata"
          />
        </div>
      </motion.div>

      {/* Experience Options */}
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

      {/* Active Option Display */}
      <AnimatePresence>
        {activeOption && (
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
