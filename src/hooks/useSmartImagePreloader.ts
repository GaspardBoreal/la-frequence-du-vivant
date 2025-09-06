import { useState, useEffect, useCallback, useRef } from 'react';
import { ImageCacheManager } from '../utils/imageCacheManager';

interface PreloadOptions {
  priority?: 'high' | 'medium' | 'low';
  quality?: 'high' | 'medium' | 'low';
}

interface PreloadedImage {
  url: string;
  loaded: boolean;
  loading: boolean;
  error: boolean;
  element?: HTMLImageElement;
}

export const useSmartImagePreloader = (maxCacheSize: number = 10) => {
  const [preloadedImages, setPreloadedImages] = useState<Map<string, PreloadedImage>>(new Map());
  const cacheManager = useRef(new ImageCacheManager(maxCacheSize));
  const loadingQueue = useRef<Set<string>>(new Set());

  const preloadImage = useCallback(async (url: string, options: PreloadOptions = {}) => {
    if (!url || loadingQueue.current.has(url)) return;

    // Check cache first
    const cached = cacheManager.current.get(url);
    if (cached) {
      setPreloadedImages(prev => new Map(prev).set(url, {
        url,
        loaded: true,
        loading: false,
        error: false,
        element: cached
      }));
      return cached;
    }

    // Add to loading queue
    loadingQueue.current.add(url);
    
    setPreloadedImages(prev => new Map(prev).set(url, {
      url,
      loaded: false,
      loading: true,
      error: false
    }));

    try {
      const img = new Image();
      
      // Optimize image loading based on priority
      if (options.priority === 'high') {
        img.fetchPriority = 'high';
      }
      
      return new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => {
          cacheManager.current.set(url, img);
          setPreloadedImages(prev => new Map(prev).set(url, {
            url,
            loaded: true,
            loading: false,
            error: false,
            element: img
          }));
          loadingQueue.current.delete(url);
          resolve(img);
        };

        img.onerror = () => {
          setPreloadedImages(prev => new Map(prev).set(url, {
            url,
            loaded: false,
            loading: false,
            error: true
          }));
          loadingQueue.current.delete(url);
          reject(new Error(`Failed to load image: ${url}`));
        };

        img.src = url;
      });
    } catch (error) {
      loadingQueue.current.delete(url);
      setPreloadedImages(prev => new Map(prev).set(url, {
        url,
        loaded: false,
        loading: false,
        error: true
      }));
      throw error;
    }
  }, []);

  const preloadImageSet = useCallback(async (urls: string[], currentIndex: number = 0) => {
    if (!urls.length) return;

    // Preload current image with high priority
    const currentUrl = urls[currentIndex];
    if (currentUrl) {
      preloadImage(currentUrl, { priority: 'high' });
    }

    // Preload adjacent images with medium priority
    const adjacentUrls = [
      urls[currentIndex - 1],
      urls[currentIndex + 1],
      urls[currentIndex - 2],
      urls[currentIndex + 2]
    ].filter(Boolean);

    adjacentUrls.forEach(url => {
      if (url) {
        setTimeout(() => preloadImage(url, { priority: 'medium' }), 50);
      }
    });

    // Preload remaining images with low priority (throttled)
    const remainingUrls = urls.filter((url, index) => 
      Math.abs(index - currentIndex) > 2 && url
    );

    remainingUrls.forEach((url, index) => {
      setTimeout(() => preloadImage(url, { priority: 'low' }), 200 + index * 100);
    });
  }, [preloadImage]);

  const getPreloadedImage = useCallback((url: string): PreloadedImage | null => {
    return preloadedImages.get(url) || null;
  }, [preloadedImages]);

  const clearCache = useCallback(() => {
    cacheManager.current.clear();
    setPreloadedImages(new Map());
    loadingQueue.current.clear();
  }, []);

  const getCacheStats = useCallback(() => {
    return {
      size: preloadedImages.size,
      loaded: Array.from(preloadedImages.values()).filter(img => img.loaded).length,
      loading: Array.from(preloadedImages.values()).filter(img => img.loading).length,
      errors: Array.from(preloadedImages.values()).filter(img => img.error).length
    };
  }, [preloadedImages]);

  return {
    preloadImage,
    preloadImageSet,
    getPreloadedImage,
    clearCache,
    getCacheStats,
    preloadedImages: Array.from(preloadedImages.values())
  };
};