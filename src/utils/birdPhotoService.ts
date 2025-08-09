interface BirdPhoto {
  url: string;
  source: 'inaturalist' | 'flickr' | 'wikimedia' | 'placeholder';
  attribution?: string;
  license?: string;
  photographer?: string;
  quality?: 'high' | 'medium' | 'low';
  resolution?: string;
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
      // Essayer toutes les sources en parallèle et prendre la meilleure
      const sources = await Promise.allSettled([
        this.fetchFromWikimedia(scientificName, commonName),
        this.fetchFromINaturalist(scientificName),
        this.fetchFromFlickr(scientificName, commonName)
      ]);

      // Sélectionner la meilleure photo disponible
      const photos = sources
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => (result as PromiseFulfilledResult<BirdPhoto | null>).value!)
        .filter(Boolean);

      const bestPhoto = this.selectBestPhoto(photos);
      
      if (bestPhoto) {
        this.setCachedPhoto(cacheKey, bestPhoto);
        return bestPhoto;
      }

      return this.getPlaceholderPhoto();
    } catch (error) {
      console.warn('Erreur récupération photo:', error);
      return this.getPlaceholderPhoto();
    }
  }

  private selectBestPhoto(photos: BirdPhoto[]): BirdPhoto | null {
    if (photos.length === 0) return null;
    if (photos.length === 1) return photos[0];

    // Scoring des photos par qualité et source
    const scorePhoto = (photo: BirdPhoto): number => {
      let score = 0;
      
      // Score par source (Wikimedia généralement meilleure qualité)
      switch (photo.source) {
        case 'wikimedia': score += 3; break;
        case 'inaturalist': score += 2; break;
        case 'flickr': score += 1; break;
      }
      
      // Score par qualité
      switch (photo.quality) {
        case 'high': score += 3; break;
        case 'medium': score += 2; break;
        case 'low': score += 1; break;
      }
      
      return score;
    };

    return photos.sort((a, b) => scorePhoto(b) - scorePhoto(a))[0];
  }

  private async fetchFromINaturalist(scientificName: string): Promise<BirdPhoto | null> {
    try {
      // Rechercher les observations avec photos haute qualité
      const searchUrl = `https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent(scientificName)}&has[]=photos&quality_grade=research&per_page=10&order=desc&order_by=votes`;
      
      const response = await fetch(searchUrl);
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Chercher la meilleure photo disponible
        for (const observation of data.results) {
          const photo = observation.photos?.[0];
          if (photo) {
            // Essayer différentes résolutions, de la plus haute à la plus basse
            const resolutions = ['original', 'large', 'medium'];
            for (const resolution of resolutions) {
              const highResUrl = photo.url.replace('square', resolution);
              
              return {
                url: highResUrl,
                source: 'inaturalist',
                attribution: `Photo by ${observation.user?.name || 'iNaturalist user'}`,
                license: observation.license_code || 'CC BY-NC',
                photographer: observation.user?.name,
                quality: resolution === 'original' ? 'high' : resolution === 'large' ? 'medium' : 'low',
                resolution: resolution
              };
            }
          }
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
      const searchTerm = commonName || scientificName;
      const searchUrl = `https://api.flickr.com/services/feeds/photos_public.gne?format=json&nojsoncallback=1&tags=${encodeURIComponent(searchTerm + ' bird')}&per_page=10`;
      
      const response = await fetch(searchUrl);
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        
        // Essayer différentes tailles Flickr, de la plus haute à la plus basse
        const sizes = [
          { suffix: '_h.jpg', quality: 'high', name: '1600px' },    // 1600px
          { suffix: '_b.jpg', quality: 'medium', name: '1024px' },  // 1024px  
          { suffix: '_c.jpg', quality: 'low', name: '800px' }       // 800px
        ];
        
        for (const size of sizes) {
          const highResUrl = item.media.m.replace('_m.jpg', size.suffix);
          
          return {
            url: highResUrl,
            source: 'flickr',
            attribution: `Photo by ${item.author?.replace(/.*\(([^)]+)\).*/, '$1') || 'Flickr user'}`,
            license: 'Flickr',
            photographer: item.author?.replace(/.*\(([^)]+)\).*/, '$1'),
            quality: size.quality as 'high' | 'medium' | 'low',
            resolution: size.name
          };
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Erreur Flickr:', error);
      return null;
    }
  }

  private async fetchFromWikimedia(scientificName: string, commonName?: string): Promise<BirdPhoto | null> {
    try {
      // Chercher d'abord par nom scientifique puis par nom commun
      const searchTerms = [scientificName];
      if (commonName) searchTerms.push(commonName);
      
      for (const searchTerm of searchTerms) {
        const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&list=search&srsearch=${encodeURIComponent(searchTerm)}&srnamespace=6&srlimit=5`;
        
        const response = await fetch(searchUrl);
        if (!response.ok) continue;
        
        const data = await response.json();
        
        if (data.query?.search?.length > 0) {
          const firstResult = data.query.search[0];
          const filename = firstResult.title.replace('File:', '');
          
          // Obtenir l'URL de l'image en haute résolution
          const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=1200`;
          
          return {
            url: imageUrl,
            source: 'wikimedia',
            attribution: `Wikimedia Commons`,
            license: 'Creative Commons',
            photographer: 'Wikimedia contributor',
            quality: 'high',
            resolution: '1200px'
          };
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Erreur Wikimedia:', error);
      return null;
    }
  }

  private getPlaceholderPhoto(): BirdPhoto {
    return {
      url: '/placeholder.svg',
      source: 'placeholder',
      attribution: 'Placeholder image',
      quality: 'low'
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