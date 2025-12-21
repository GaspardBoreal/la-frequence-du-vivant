export class ImageCacheManager {
  private cache: Map<string, HTMLImageElement>;
  private accessTimes: Map<string, number>;
  private maxSize: number;

  constructor(maxSize: number = 10) {
    this.cache = new Map();
    this.accessTimes = new Map();
    this.maxSize = maxSize;
  }

  set(url: string, image: HTMLImageElement): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(url)) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(url, image);
    this.accessTimes.set(url, Date.now());
  }

  get(url: string): HTMLImageElement | null {
    const image = this.cache.get(url);
    if (image) {
      // Update access time
      this.accessTimes.set(url, Date.now());
      return image;
    }
    return null;
  }

  has(url: string): boolean {
    return this.cache.has(url);
  }

  delete(url: string): boolean {
    this.accessTimes.delete(url);
    return this.cache.delete(url);
  }

  clear(): void {
    this.cache.clear();
    this.accessTimes.clear();
  }

  private evictLeastRecentlyUsed(): void {
    let oldestUrl = '';
    let oldestTime = Date.now();

    for (const [url, time] of this.accessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestUrl = url;
      }
    }

    if (oldestUrl) {
      this.delete(oldestUrl);
    }
  }

  getSize(): number {
    return this.cache.size;
  }

  getMaxSize(): number {
    return this.maxSize;
  }

  getStats(): { size: number; maxSize: number; urls: string[] } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      urls: Array.from(this.cache.keys())
    };
  }

  // Preload image with optimizations
  async preloadImage(url: string, priority: 'high' | 'low' | 'auto' = 'auto'): Promise<HTMLImageElement> {
    if (this.has(url)) {
      return this.get(url)!;
    }

    const img = new Image();
    
    // Set loading priority
    if ('fetchPriority' in img) {
      img.fetchPriority = priority;
    }

    // Enable CORS for external images
    img.crossOrigin = 'anonymous';
    
    // Optimize for different use cases
    if (priority === 'high') {
      img.loading = 'eager';
    } else {
      img.loading = 'lazy';
    }

    return new Promise((resolve, reject) => {
      img.onload = () => {
        this.set(url, img);
        resolve(img);
      };

      img.onerror = () => {
        reject(new Error(`Failed to preload image: ${url}`));
      };

      img.src = url;
    });
  }
}