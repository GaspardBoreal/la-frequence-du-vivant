interface BirdPhoto {
  url: string;
  source: 'inaturalist' | 'flickr' | 'placeholder';
  attribution?: string;
  license?: string;
  photographer?: string;
}

class BirdPhotoService {
  private cache = new Map<string, BirdPhoto>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24h

  async getPhoto(scientificName: string, commonName?: string): Promise<BirdPhoto> {
    const cacheKey = scientificName.toLowerCase();
    
    // Vérifier le cache
    const cached = this.getCachedPhoto(cacheKey);
    if (cached) return cached;

    try {
      // 1. Essayer iNaturalist d'abord
      let photo = await this.fetchFromINaturalist(scientificName);
      
      // 2. Fallback vers Flickr si iNaturalist échoue
      if (!photo) {
        photo = await this.fetchFromFlickr(scientificName, commonName);
      }
      
      // 3. Fallback vers placeholder
      if (!photo) {
        photo = this.getPlaceholderPhoto();
      }

      this.setCachedPhoto(cacheKey, photo);
      return photo;
    } catch (error) {
      console.warn('Erreur récupération photo:', error);
      return this.getPlaceholderPhoto();
    }
  }

  private async fetchFromINaturalist(scientificName: string): Promise<BirdPhoto | null> {
    try {
      // Rechercher les observations avec photos
      const searchUrl = `https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent(scientificName)}&has[]=photos&quality_grade=research&per_page=5&order=desc&order_by=votes`;
      
      const response = await fetch(searchUrl);
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const observation = data.results[0];
        const photo = observation.photos?.[0];
        
        if (photo) {
          return {
            url: photo.url.replace('square', 'medium'),
            source: 'inaturalist',
            attribution: `Photo by ${observation.user?.name || 'iNaturalist user'}`,
            license: observation.license_code || 'Unknown',
            photographer: observation.user?.name
          };
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Erreur iNaturalist:', error);
      return null;
    }
  }

  private async fetchFromFlickr(scientificName: string, commonName?: string): Promise<BirdPhoto | null> {
    try {
      // Utiliser l'API publique de Flickr (pas besoin de clé API pour la recherche publique)
      const searchTerm = commonName || scientificName;
      const searchUrl = `https://api.flickr.com/services/feeds/photos_public.gne?format=json&nojsoncallback=1&tags=${encodeURIComponent(searchTerm + ' bird')}&per_page=5`;
      
      const response = await fetch(searchUrl);
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        
        return {
          url: item.media.m.replace('_m.jpg', '_c.jpg'), // Version plus grande
          source: 'flickr',
          attribution: `Photo by ${item.author?.replace(/.*\(([^)]+)\).*/, '$1') || 'Flickr user'}`,
          license: 'Flickr',
          photographer: item.author?.replace(/.*\(([^)]+)\).*/, '$1')
        };
      }
      
      return null;
    } catch (error) {
      console.warn('Erreur Flickr:', error);
      return null;
    }
  }

  private getPlaceholderPhoto(): BirdPhoto {
    return {
      url: '/placeholder.svg',
      source: 'placeholder',
      attribution: 'Placeholder image'
    };
  }

  private getCachedPhoto(key: string): BirdPhoto | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Vérifier l'expiration (simple, sans timestamp pour l'instant)
    return cached;
  }

  private setCachedPhoto(key: string, photo: BirdPhoto): void {
    this.cache.set(key, photo);
    
    // Sauvegarder en localStorage aussi
    try {
      const cacheData = { photo, timestamp: Date.now() };
      localStorage.setItem(`bird_photo_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      // Ignorer les erreurs de localStorage
    }
  }
}

export const birdPhotoService = new BirdPhotoService();
export type { BirdPhoto };