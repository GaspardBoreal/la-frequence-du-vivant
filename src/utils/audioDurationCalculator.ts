/**
 * Calcul robuste de durée audio avec fallbacks intelligents
 * Gère les cas d'Infinity et timeout pour fichiers de 30min max
 */

export interface AudioDurationResult {
  duration: number | null;
  method: 'html5' | 'audiocontext' | 'estimated' | 'failed';
  confidence: 'high' | 'medium' | 'low';
  error?: string;
}

// Estimation du bitrate moyen par format
const AVERAGE_BITRATES = {
  'audio/webm': 64000, // 64 kbps
  'audio/mp3': 128000, // 128 kbps
  'audio/wav': 1411200, // 1411.2 kbps (CD quality)
  'audio/aac': 128000, // 128 kbps
  'audio/ogg': 96000, // 96 kbps
  'default': 96000 // Fallback
};

/**
 * Calcul de durée via HTML5 Audio avec timeout
 */
const calculateDurationHTML5 = (file: File, timeoutMs = 10000): Promise<AudioDurationResult> => {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    let resolved = false;
    
    const cleanup = () => {
      URL.revokeObjectURL(url);
      audio.removeEventListener('loadedmetadata', onLoad);
      audio.removeEventListener('error', onError);
    };
    
    const resolveOnce = (result: AudioDurationResult) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(result);
      }
    };
    
    const onLoad = () => {
      const duration = audio.duration;
      
      if (duration && isFinite(duration) && duration > 0) {
        resolveOnce({
          duration: Math.round(duration),
          method: 'html5',
          confidence: 'high'
        });
      } else {
        resolveOnce({
          duration: null,
          method: 'html5',
          confidence: 'low',
          error: 'Invalid duration from HTML5 Audio'
        });
      }
    };
    
    const onError = () => {
      resolveOnce({
        duration: null,
        method: 'html5',
        confidence: 'low',
        error: 'HTML5 Audio loading error'
      });
    };
    
    // Timeout
    setTimeout(() => {
      resolveOnce({
        duration: null,
        method: 'html5',
        confidence: 'low',
        error: 'HTML5 Audio timeout'
      });
    }, timeoutMs);
    
    audio.addEventListener('loadedmetadata', onLoad);
    audio.addEventListener('error', onError);
    audio.src = url;
  });
};

/**
 * Calcul de durée via AudioContext (fallback)
 */
const calculateDurationAudioContext = (file: File, timeoutMs = 10000): Promise<AudioDurationResult> => {
  return new Promise((resolve) => {
    if (!window.AudioContext) {
      resolve({
        duration: null,
        method: 'audiocontext',
        confidence: 'low',
        error: 'AudioContext not supported'
      });
      return;
    }

    const audioContext = new AudioContext();
    let resolved = false;
    
    const resolveOnce = (result: AudioDurationResult) => {
      if (!resolved) {
        resolved = true;
        audioContext.close();
        resolve(result);
      }
    };
    
    // Timeout
    setTimeout(() => {
      resolveOnce({
        duration: null,
        method: 'audiocontext',
        confidence: 'low',
        error: 'AudioContext timeout'
      });
    }, timeoutMs);
    
    file.arrayBuffer()
      .then(buffer => audioContext.decodeAudioData(buffer))
      .then(audioBuffer => {
        const duration = audioBuffer.duration;
        if (duration && isFinite(duration) && duration > 0) {
          resolveOnce({
            duration: Math.round(duration),
            method: 'audiocontext',
            confidence: 'high'
          });
        } else {
          resolveOnce({
            duration: null,
            method: 'audiocontext',
            confidence: 'low',
            error: 'Invalid duration from AudioContext'
          });
        }
      })
      .catch(error => {
        resolveOnce({
          duration: null,
          method: 'audiocontext',
          confidence: 'low',
          error: `AudioContext error: ${error.message}`
        });
      });
  });
};

/**
 * Estimation de durée basée sur taille fichier
 */
const estimateDurationFromSize = (file: File): AudioDurationResult => {
  const fileSizeBytes = file.size;
  const mimeType = file.type;
  const bitrate = AVERAGE_BITRATES[mimeType as keyof typeof AVERAGE_BITRATES] || AVERAGE_BITRATES.default;
  
  // Durée = (taille en bits) / (bitrate en bits/sec)
  const estimatedDuration = Math.round((fileSizeBytes * 8) / bitrate);
  
  return {
    duration: estimatedDuration,
    method: 'estimated',
    confidence: 'medium',
    error: `Estimated from file size (${Math.round(fileSizeBytes / 1024)}KB)`
  };
};

/**
 * Calcul robuste de durée avec fallbacks
 */
export const getAudioDurationRobust = async (file: File): Promise<AudioDurationResult> => {
  console.log('🎵 [getAudioDurationRobust] Calcul durée pour:', file.name, file.size, 'bytes');
  
  try {
    // Méthode 1: HTML5 Audio (le plus fiable)
    const html5Result = await calculateDurationHTML5(file, 8000);
    if (html5Result.duration && html5Result.duration > 0) {
      console.log('✅ [HTML5] Durée calculée:', html5Result.duration, 's');
      return html5Result;
    }
    
    console.log('⚠️ [HTML5] Échec, tentative AudioContext...');
    
    // Méthode 2: AudioContext (fallback)
    const contextResult = await calculateDurationAudioContext(file, 8000);
    if (contextResult.duration && contextResult.duration > 0) {
      console.log('✅ [AudioContext] Durée calculée:', contextResult.duration, 's');
      return contextResult;
    }
    
    console.log('⚠️ [AudioContext] Échec, estimation par taille...');
    
    // Méthode 3: Estimation par taille (dernier recours)
    const estimatedResult = estimateDurationFromSize(file);
    console.log('📊 [Estimated] Durée estimée:', estimatedResult.duration, 's');
    return estimatedResult;
    
  } catch (error) {
    console.error('❌ [getAudioDurationRobust] Erreur critique:', error);
    
    // Fallback ultime: estimation par taille
    return estimateDurationFromSize(file);
  }
};

/**
 * Estimation de durée basée sur bytes et MIME type (pour URLs)
 */
const estimateDurationFromBytes = (mimeType: string | null, bytes: number): AudioDurationResult => {
  const bitrate = AVERAGE_BITRATES[mimeType as keyof typeof AVERAGE_BITRATES] || AVERAGE_BITRATES.default;
  const estimatedDuration = Math.round((bytes * 8) / bitrate);
  
  return {
    duration: estimatedDuration,
    method: 'estimated',
    confidence: 'medium',
    error: `Estimated from size (${Math.round(bytes / 1024)}KB)`
  };
};

/**
 * Recalcul de durée pour fichiers existants via URL avec fallback HEAD request
 */
export const recalculateDurationFromUrl = async (url: string, filename?: string): Promise<AudioDurationResult> => {
  console.log('🔄 [recalculateDurationFromUrl] Recalcul pour:', filename || url);
  
  try {
    // Méthode 1: HTML5 Audio (le plus fiable)
    const html5Result = await new Promise<AudioDurationResult>((resolve) => {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      let resolved = false;
      
      const resolveOnce = (result: AudioDurationResult) => {
        if (!resolved) {
          resolved = true;
          resolve(result);
        }
      };
      
      const onLoad = () => {
        const duration = audio.duration;
        if (duration && isFinite(duration) && duration > 0) {
          resolveOnce({
            duration: Math.round(duration),
            method: 'html5',
            confidence: 'high'
          });
        } else {
          resolveOnce({
            duration: null,
            method: 'html5',
            confidence: 'low',
            error: 'Invalid duration from URL'
          });
        }
      };
      
      const onError = () => {
        resolveOnce({
          duration: null,
          method: 'html5',
          confidence: 'low',
          error: 'Failed to load audio from URL'
        });
      };
      
      // Timeout pour éviter blocage
      setTimeout(() => {
        resolveOnce({
          duration: null,
          method: 'html5',
          confidence: 'low',
          error: 'URL loading timeout'
        });
      }, 10000);
      
      audio.addEventListener('loadedmetadata', onLoad);
      audio.addEventListener('error', onError);
      audio.src = url;
    });
    
    // Si HTML5 a réussi, on retourne le résultat
    if (html5Result.duration && html5Result.duration > 0) {
      console.log('✅ [HTML5] URL Durée calculée:', html5Result.duration, 's');
      return html5Result;
    }
    
    console.log('⚠️ [HTML5] URL Échec, tentative HEAD request...');
    
    // Méthode 2: HEAD request pour estimer via taille
    try {
      const headResponse = await fetch(url, { method: 'HEAD' });
      const contentLength = headResponse.headers.get('Content-Length');
      const contentType = headResponse.headers.get('Content-Type');
      
      if (contentLength && parseInt(contentLength) > 0) {
        const bytes = parseInt(contentLength);
        const estimatedResult = estimateDurationFromBytes(contentType, bytes);
        console.log('📊 [HEAD] Durée estimée:', estimatedResult.duration, 's');
        return estimatedResult;
      }
    } catch (headError) {
      console.warn('⚠️ [HEAD] Erreur HEAD request:', headError);
    }
    
    // Aucune méthode n'a fonctionné
    return {
      duration: null,
      method: 'failed',
      confidence: 'low',
      error: 'All recalculation methods failed'
    };
    
  } catch (error) {
    return {
      duration: null,
      method: 'failed',
      confidence: 'low',
      error: `URL recalculation error: ${error}`
    };
  }
};