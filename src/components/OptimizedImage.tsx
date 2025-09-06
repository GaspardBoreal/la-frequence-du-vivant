import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: 'high' | 'medium' | 'low';
  onLoad?: () => void;
  onError?: () => void;
  blur?: boolean;
  preloadedImage?: HTMLImageElement;
  transition?: {
    duration?: number;
    ease?: any;
  };
  direction?: 'left' | 'right' | null;
  enableCinematicTransitions?: boolean;
  instant?: boolean;
}

export const OptimizedImage = memo<OptimizedImageProps>(({ 
  src, 
  alt, 
  className = '',
  priority = 'medium',
  onLoad,
  onError,
  blur = true,
  preloadedImage,
  transition = { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  direction = null,
  enableCinematicTransitions = true,
  instant = false
}) => {
  const [loaded, setLoaded] = useState<boolean>(!!preloadedImage);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>(preloadedImage?.src || '');
  const imgRef = useRef<HTMLImageElement>(null);

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Double-buffer state for instant mode on mobile to avoid flicker
  const [currentSrc, setCurrentSrc] = useState<string>(preloadedImage?.src || src || '');
  const prevSrcRef = useRef<string>('');
  const [topReady, setTopReady] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const topImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (preloadedImage) {
      setImageSrc(preloadedImage.src);
      setLoaded(true);
      onLoad?.();
      return;
    }

    // Create new image for loading
    const img = new Image();
    
    // Set loading attributes
    if ('fetchPriority' in img) {
      img.fetchPriority = priority;
    }
    
    img.crossOrigin = 'anonymous';
    img.loading = priority === 'high' ? 'eager' : 'lazy';

    img.onload = async () => {
      try {
        // Attendre le décodage pour éviter les flashs lors de l'affichage
        if ('decode' in img && typeof (img as any).decode === 'function') {
          await (img as any).decode();
        }
      } catch (e) {
        // ignore decode errors, fallback to onload
      }
      setImageSrc(src);
      setLoaded(true);
      setError(false);
      onLoad?.();
    };

    img.onerror = () => {
      setError(true);
      setLoaded(false);
      onError?.();
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, priority, onLoad, onError, preloadedImage]);

  // Instant mode: double-buffer crossfade to avoid flicker on mobile (iOS Safari)
  useEffect(() => {
    if (!instant) return;

    // Initialize current source on first mount
    if (!currentSrc) {
      const initial = preloadedImage?.src || src;
      setCurrentSrc(initial);
      prevSrcRef.current = initial;
      return;
    }

    // If the target is already displayed, nothing to do
    if (src === currentSrc) return;

    let cancelled = false;
    const img = new Image();

    if ('fetchPriority' in img) {
      (img as any).fetchPriority = priority;
    }
    img.crossOrigin = 'anonymous';
    img.loading = priority === 'high' ? 'eager' : 'lazy';

    img.onload = async () => {
      try {
        if ('decode' in img && typeof (img as any).decode === 'function') {
          await (img as any).decode();
        }
      } catch {}
      if (cancelled) return;
      setTopReady(true);
      if (prefersReducedMotion) {
        setShowTop(true);
      } else {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setShowTop(true));
        });
      }
    };

    img.onerror = () => {
      if (cancelled) return;
      setTopReady(false);
      setShowTop(false);
      // Fallback: swap immediately
      setCurrentSrc(src);
      prevSrcRef.current = src;
    };

    img.src = src;

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [instant, src, priority, currentSrc, preloadedImage, prefersReducedMotion]);

  // Instant branch: double-buffer crossfade to avoid flicker
  if (instant) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* Base image (current) */}
        <img
          src={currentSrc || src}
          alt={alt}
          className="w-full h-full object-cover absolute inset-0"
          style={{
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            willChange: 'opacity, transform'
          }}
        />
        {/* Top image (incoming) */}
        {topReady && (
          <img
            ref={topImgRef}
            src={src}
            alt={alt}
            className="w-full h-full object-cover absolute inset-0"
            style={{
              opacity: showTop ? 1 : 0,
              transition: prefersReducedMotion ? 'none' : 'opacity 0.12s ease',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              willChange: 'opacity'
            }}
            onTransitionEnd={() => {
              if (!showTop) return;
              setCurrentSrc(src);
              prevSrcRef.current = src;
              setShowTop(false);
              setTopReady(false);
              onLoad?.();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        {!loaded && !error && (
          <motion.div
            key="loading"
            className="absolute inset-0 bg-gradient-to-br from-neutral-200 via-neutral-100 to-neutral-200 animate-pulse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[slide-right_1.5s_ease-in-out_infinite]" />
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            className="absolute inset-0 bg-neutral-100 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-neutral-400 text-center">
              <div className="w-8 h-8 mx-auto mb-2 opacity-50">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xs">Image non disponible</p>
            </div>
          </motion.div>
        )}

        {loaded && imageSrc && (
          <motion.img
            key={instant ? 'instant' : `image-${src}`}
            ref={imgRef}
            src={imageSrc}
            alt={alt}
            className="w-full h-full object-cover"
            initial={instant ? {
              opacity: 1,
              scale: 1,
              x: 0,
              filter: 'blur(0px)'
            } : enableCinematicTransitions ? {
              opacity: 0,
              scale: 1.08,
              x: direction === 'right' ? 30 : direction === 'left' ? -30 : 0,
              filter: 'blur(1px) brightness(0.95)'
            } : { 
              opacity: 0, 
              scale: blur ? 1.05 : 1,
              filter: blur ? 'blur(2px)' : 'blur(0px)'
            }}
            animate={instant ? {
              opacity: 1,
              scale: 1,
              x: 0,
              filter: 'blur(0px)'
            } : enableCinematicTransitions ? {
              opacity: 1,
              scale: 1,
              x: 0,
              filter: 'blur(0px) brightness(1)'
            } : { 
              opacity: 1, 
              scale: 1,
              filter: 'blur(0px)'
            }}
            exit={enableCinematicTransitions && !instant ? {
              opacity: 0,
              scale: 0.95,
              x: direction === 'right' ? -20 : direction === 'left' ? 20 : 0,
              filter: 'blur(1px) brightness(1.05)'
            } : {
              opacity: 1,
              scale: 1
            }}
            transition={{ 
              duration: instant ? 0.01 : transition.duration,
              ease: transition.ease,
              opacity: { duration: (instant ? 0.01 : transition.duration) * 0.7 },
              scale: { duration: (instant ? 0.01 : transition.duration) * 0.8 },
              x: { duration: (instant ? 0.01 : transition.duration) * 0.9 },
              filter: { duration: (instant ? 0.01 : transition.duration) * 0.6 }
            }}
            style={{
              willChange: 'transform, opacity, filter'
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';