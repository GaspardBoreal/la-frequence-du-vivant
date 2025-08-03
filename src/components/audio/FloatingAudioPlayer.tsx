import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX,
  ChevronUp,
  ChevronDown,
  ExternalLink 
} from 'lucide-react';

export const FloatingAudioPlayer = () => {
  const {
    currentRecording,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    pause,
    stop,
    setVolume,
    setPlaybackRate,
    seekTo,
    playRecording
  } = useAudioPlayer();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  if (!currentRecording) return null;

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(0.8);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleProgressChange = (newTime: number[]) => {
    seekTo(newTime[0]);
  };

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 bg-card/95 backdrop-blur-lg border shadow-2xl transition-all duration-300">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">
              {currentRecording.fileName.replace(/\.(mp3|wav|ogg)$/i, '')}
            </h4>
            <p className="text-xs text-muted-foreground truncate">
              {currentRecording.recordist} • {currentRecording.date}
            </p>
          </div>
          
          <div className="flex items-center gap-2 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleProgressChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => isPlaying ? pause() : playRecording(currentRecording)}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={stop}
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            
            <div className="w-16">
              <Slider
                value={[volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
              />
            </div>
          </div>
        </div>

        {/* Expanded Controls */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            {/* Quality and Metadata */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                Qualité {currentRecording.quality}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {currentRecording.length}
              </Badge>
              {currentRecording.type && (
                <Badge variant="outline" className="text-xs">
                  {currentRecording.type}
                </Badge>
              )}
            </div>

            {/* Playback Speed */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground min-w-fit">Vitesse:</span>
              <div className="flex gap-1">
                {playbackRates.map(rate => (
                  <Button
                    key={rate}
                    variant={playbackRate === rate ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPlaybackRate(rate)}
                    className="text-xs px-2 py-1 h-7"
                  >
                    {rate}x
                  </Button>
                ))}
              </div>
            </div>

            {/* External Link */}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => window.open(currentRecording.url, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-2" />
              Voir sur Xeno-Canto
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};