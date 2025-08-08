import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Play, Pause, SkipBack, SkipForward, BookOpen, Volume2, VolumeX } from "lucide-react";

export interface StoryEventPanelProps {
  events: Array<{ id: string; title: string; summary: string }>; 
  currentIndex: number;
  isPlaying: boolean;
  ttsEnabled: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  onToggleTTS: () => void;
  onExit: () => void;
}

const StoryEventPanel: React.FC<StoryEventPanelProps> = ({
  events,
  currentIndex,
  isPlaying,
  ttsEnabled,
  onPrev,
  onNext,
  onPlayPause,
  onToggleTTS,
  onExit,
}) => {
  const current = events[currentIndex];

  return (
    <Card className="bg-card border-muted/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold leading-none">Mode Story</h3>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={onPrev} aria-label="Précédent">
                    <SkipBack className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Précédent</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" size="sm" onClick={onPlayPause} aria-label={isPlaying ? "Pause" : "Lecture"}>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isPlaying ? "Pause" : "Lecture"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={onNext} aria-label="Suivant">
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Suivant</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={onToggleTTS} aria-label="Texte en parole">
                    {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Voix</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button variant="ghost" size="sm" onClick={onExit} aria-label="Quitter le mode Story">
              Quitter
            </Button>
          </div>
        </div>

        <div className="mt-3">
          <p className="text-sm text-foreground/90" aria-live="polite">
            {current ? current.summary : "Aucun évènement"}
          </p>
          {/* Progress dots */}
          <div className="mt-3 flex flex-wrap gap-1" aria-hidden>
            {events.map((e, idx) => (
              <span
                key={e.id}
                className={`h-1.5 w-1.5 rounded-full ${idx === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StoryEventPanel;
