import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { StoryEvent } from "@/hooks/useWeatherStory";

interface StoryBannerProps {
  stationName: string;
  events: StoryEvent[];
  currentIndex: number;
  isPlaying: boolean;
  ttsEnabled: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  onToggleTTS: () => void;
  onExit: () => void;
  voiceId?: string;
}

const defaultVoice = "XB0fDUnXU5powFXDhCwa"; // Fallback voice id

export default function StoryBanner({
  stationName,
  events,
  currentIndex,
  isPlaying,
  ttsEnabled,
  onPrev,
  onNext,
  onPlayPause,
  onToggleTTS,
  onExit,
  voiceId,
}: StoryBannerProps) {
  const event = events[currentIndex];
  const [images, setImages] = useState<Record<string, string>>({});
  const [loadingImage, setLoadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const prompt = useMemo(() => {
    if (!event) return "";
    const base = `Pastel poétique, illustration cinématographique du lieu ${stationName}. Style doux, brume légère, textures aquarelle, lumière diffuse, minimalisme élégant, éditorial, haute qualité.`;
    const detail = ` Séquence: ${event.title}. Résumé: ${event.summary}. Palette pastel harmonieuse, rendu artistique, atmosphère contemplative.`;
    return base + detail;
  }, [event, stationName]);

  useEffect(() => {
    let mounted = true;
    async function generateIfNeeded() {
      if (!event || images[event.id]) {
        console.log("🎨 Image generation skipped:", { hasEvent: !!event, hasImage: !!images[event.id], eventId: event?.id });
        return;
      }
      
      console.log("🎨 Starting image generation for event:", event.id, "with prompt:", prompt.substring(0, 100) + "...");
      setLoadingImage(true);
      setImageError(null);
      
      try {
        const { data, error } = await supabase.functions.invoke("generate-story-visuals", {
          body: { prompt, aspect_ratio: "1:1" },
        });
        
        if (!mounted) return;
        
        if (error) {
          console.error("❌ Image generation error:", error);
          setImageError(`Erreur de génération: ${error.message || 'Erreur inconnue'}`);
          setLoadingImage(false);
          return;
        }
        
        console.log("🎨 Raw response from generate-story-visuals:", data);
        const url = Array.isArray(data?.output) ? data.output[0] : data?.output;
        
        if (url) {
          console.log("✅ Generated image URL:", url);
          setImages((prev) => ({ ...prev, [event.id]: url }));
          setImageError(null);
        } else {
          console.warn("⚠️ No image URL in response:", data);
          setImageError("Aucune image reçue de l'API");
        }
        
        setLoadingImage(false);
      } catch (err) {
        console.error("💥 Image generation exception:", err);
        setImageError(`Exception: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
        setLoadingImage(false);
      }
    }
    generateIfNeeded();
    return () => {
      mounted = false;
    };
  }, [event, prompt, images]);

  useEffect(() => {
    // Premium TTS via Edge Function
    async function speak() {
      if (!event || !ttsEnabled) return;
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        const { data, error } = await supabase.functions.invoke("eleven-tts", {
          body: { text: event.summary, voiceId: voiceId || defaultVoice },
        });
        if (error || !data?.audioContent) return;
        const src = `data:audio/mpeg;base64,${data.audioContent}`;
        const audio = new Audio(src);
        audioRef.current = audio;
        audio.play().catch(() => {});
      } catch (_) {
        // fail silently
      }
    }
    speak();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [event, ttsEnabled, voiceId]);

  if (!event) return null;

  const img = images[event.id];

  const retryImageGeneration = () => {
    setImageError(null);
    setImages(prev => {
      const { [event.id]: removed, ...rest } = prev;
      return rest;
    });
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border bg-card">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Left: Visual */}
        <div className="relative aspect-video md:aspect-[4/3] overflow-hidden">
          <AnimatePresence mode="wait">
            {img ? (
              <motion.img
                key={img}
                src={img}
                alt={`Illustration poétique pour ${event.title}`}
                className="h-full w-full object-cover"
                initial={{ scale: 1.05, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.05, opacity: 0 }}
                transition={{ duration: 0.6 }}
                loading="lazy"
              />
            ) : (
              <motion.div
                key="placeholder"
                className="h-full w-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center space-y-3">
                  <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {loadingImage ? "Génération de l'image…" : imageError || "Image poétique à venir"}
                  </p>
                  {imageError && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={retryImageGeneration}
                    >
                      Réessayer
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pastel overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-background/0 via-primary/10 to-accent/10" />
        </div>

        {/* Right: Text */}
        <div className="relative p-6 md:p-8 flex flex-col">
          <motion.header initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{event.date}</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-serif leading-tight text-foreground">
              {event.title}
            </h2>
          </motion.header>

          <motion.p
            className="mt-4 text-base md:text-lg text-muted-foreground"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            {event.summary}
          </motion.p>

          {/* Player */}
          <div className="mt-6 md:mt-auto border-t border-border pt-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={onPrev} aria-label="Précédent">
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button variant="default" size="sm" onClick={onPlayPause} aria-label={isPlaying ? "Pause" : "Lecture"}>
                  {isPlaying ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" /> Lecture
                    </>
                  )}
                </Button>
                <Button variant="outline" size="icon" onClick={onNext} aria-label="Suivant">
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onToggleTTS} aria-label="Narration">
                  {ttsEnabled ? (
                    <>
                      <VolumeX className="mr-2 h-4 w-4" /> Muet
                    </>
                  ) : (
                    <>
                      <Volume2 className="mr-2 h-4 w-4" /> Narration
                    </>
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={onExit} aria-label="Quitter">
                  <X className="mr-2 h-4 w-4" /> Quitter
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}