import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Volume2, X, Maximize2 } from 'lucide-react';
import { useGlobalAudioPlayer } from '@/contexts/AudioContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import EcoAudioVisualizer from './EcoAudioVisualizer';

interface MiniFloatingAudioPlayerProps {
  onExpand?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  className?: string;
}

export default function MiniFloatingAudioPlayer({
  onExpand,
  onNext,
  onPrevious,
  canGoNext = false,
  canGoPrevious = false,
  className = ""
}: MiniFloatingAudioPlayerProps) {
  const {
    currentRecording,
    isPlaying,
    currentTime,
    duration,
    volume,
    playRecording,
    pause,
    setVolume
  } = useGlobalAudioPlayer();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showVolume, setShowVolume] = useState(false);

  if (!currentRecording) return null;

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      playRecording(currentRecording);
    }
  };

  return (
    <motion.div
      className={`fixed bottom-4 right-4 z-50 ${className}`}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
    >
      <div className="dordogne-experience">
        <motion.div 
          className="bg-card/95 backdrop-blur-md border border-border/30 rounded-2xl shadow-2xl overflow-hidden"
          animate={{
            width: isExpanded ? 360 : 280,
            height: isExpanded ? 200 : 80
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* Compact View */}
          <div className="p-4">
            <div className="flex items-center space-x-3">
              
              {/* Play/Pause Button */}
              <Button
                size="sm"
                onClick={togglePlayPause}
                className="h-10 w-10 rounded-full btn-nature flex-shrink-0"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              {/* Track Info & Progress */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium truncate dordogne-title">
                    {currentRecording.fileName || 'Audio en cours'}
                  </p>
                  <div className="flex space-x-1">
                    {canGoPrevious && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onPrevious}
                        className="h-6 w-6 p-0"
                      >
                        <SkipBack className="h-3 w-3" />
                      </Button>
                    )}
                    {canGoNext && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onNext}
                        className="h-6 w-6 p-0"
                      >
                        <SkipForward className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Progress 
                    value={duration > 0 ? (currentTime / duration) * 100 : 0} 
                    className="flex-1 h-2"
                  />
                  <span className="text-xs text-muted-foreground">
                    {formatTime(currentTime)}/{formatTime(duration)}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVolume(!showVolume)}
                  className="h-6 w-6 p-0"
                >
                  <Volume2 className="h-3 w-3" />
                </Button>
                
                {onExpand && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onExpand}
                    className="h-6 w-6 p-0"
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-6 w-6 p-0"
                >
                  {isExpanded ? <X className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                </Button>
              </div>
            </div>

            {/* Volume Control */}
            <AnimatePresence>
              {showVolume && (
                <motion.div
                  className="mt-3 flex items-center space-x-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={[volume]}
                    onValueChange={(value) => setVolume(value[0])}
                    max={1}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-12">
                    {Math.round(volume * 100)}%
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Expanded View */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  className="mt-4 space-y-4"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {/* Audio Visualizer */}
                  <EcoAudioVisualizer
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    duration={duration}
                    className="w-full"
                  />

                  {/* Extended Info */}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {currentRecording.location || 'Exploration sonore'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}