
export interface CacheEntry {
  fileHash: string;
  fileName: string;
  fileSize: number;
  uploadedUrl: string;
  photoId: string;
  timestamp: number;
  marcheId: string;
}

export class UploadCache {
  private static readonly CACHE_KEY = 'marche_upload_cache';
  private static readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 heures
  
  private cache: Map<string, CacheEntry> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  // Générer un hash simple pour un fichier
  async generateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Vérifier si un fichier existe déjà dans le cache
  async checkCache(file: File, marcheId: string): Promise<CacheEntry | null> {
    try {
      const fileHash = await this.generateFileHash(file);
      const cacheKey = `${marcheId}_${fileHash}`;
      const entry = this.cache.get(cacheKey);

      if (entry) {
        const isExpired = Date.now() - entry.timestamp > UploadCache.CACHE_EXPIRY;
        if (isExpired) {
          console.log(`⏰ [UploadCache] Entrée expirée supprimée: ${file.name}`);
          this.cache.delete(cacheKey);
          this.saveToStorage();
          return null;
        }

        console.log(`💾 [UploadCache] Fichier trouvé dans le cache: ${file.name}`);
        return entry;
      }

      return null;
    } catch (error) {
      console.error('❌ [UploadCache] Erreur vérification cache:', error);
      return null;
    }
  }

  // Ajouter une entrée au cache
  async addToCache(file: File, marcheId: string, uploadedUrl: string, photoId: string): Promise<void> {
    try {
      const fileHash = await this.generateFileHash(file);
      const cacheKey = `${marcheId}_${fileHash}`;
      
      const entry: CacheEntry = {
        fileHash,
        fileName: file.name,
        fileSize: file.size,
        uploadedUrl,
        photoId,
        timestamp: Date.now(),
        marcheId
      };

      this.cache.set(cacheKey, entry);
      this.saveToStorage();
      
      console.log(`💾 [UploadCache] Fichier ajouté au cache: ${file.name}`);
    } catch (error) {
      console.error('❌ [UploadCache] Erreur ajout cache:', error);
    }
  }

  // Nettoyer le cache (supprimer les entrées expirées)
  cleanExpiredEntries(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > UploadCache.CACHE_EXPIRY) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 [UploadCache] ${removedCount} entrées expirées supprimées`);
      this.saveToStorage();
    }
  }

  // Charger le cache depuis localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(UploadCache.CACHE_KEY);
      if (stored) {
        const entries: [string, CacheEntry][] = JSON.parse(stored);
        this.cache = new Map(entries);
        console.log(`📁 [UploadCache] ${this.cache.size} entrées chargées depuis le storage`);
      }
    } catch (error) {
      console.error('❌ [UploadCache] Erreur chargement cache:', error);
      this.cache = new Map();
    }
  }

  // Sauvegarder le cache dans localStorage
  private saveToStorage(): void {
    try {
      const entries = Array.from(this.cache.entries());
      localStorage.setItem(UploadCache.CACHE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('❌ [UploadCache] Erreur sauvegarde cache:', error);
    }
  }

  // Obtenir les statistiques du cache
  getStats(): { total: number; totalSize: number; oldestEntry: number | null } {
    const entries = Array.from(this.cache.values());
    return {
      total: entries.length,
      totalSize: entries.reduce((sum, entry) => sum + entry.fileSize, 0),
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : null
    };
  }

  // Vider complètement le cache
  clear(): void {
    this.cache.clear();
    localStorage.removeItem(UploadCache.CACHE_KEY);
    console.log('🧹 [UploadCache] Cache vidé');
  }
}
