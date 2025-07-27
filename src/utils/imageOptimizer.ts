
import imageCompression from 'browser-image-compression';
import { convertHeicToJpeg, isSupportedPhotoFormat } from './photoUtils';

export interface OptimizationOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
  convertToJpeg?: boolean;
}

export interface OptimizedImage {
  file: File;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  wasConverted: boolean;
  wasCompressed: boolean;
  originalFormat?: string;
}

export class ImageOptimizer {
  private options: Required<OptimizationOptions>;

  constructor(options: OptimizationOptions = {}) {
    this.options = {
      maxSizeMB: options.maxSizeMB || 2,
      maxWidthOrHeight: options.maxWidthOrHeight || 1920,
      useWebWorker: options.useWebWorker ?? true,
      quality: options.quality || 0.8,
      convertToJpeg: options.convertToJpeg ?? true
    };
  }

  // Optimiser une image
  async optimizeImage(file: File): Promise<OptimizedImage> {
    console.log(`🔧 [ImageOptimizer] Optimisation de ${file.name} (${this.formatSize(file.size)})`);
    
    const originalSize = file.size;
    const originalFormat = file.type;
    let processedFile = file;
    let wasConverted = false;
    let wasCompressed = false;

    try {
      // Étape 1: Vérifier et convertir le format si nécessaire
      if (!isSupportedPhotoFormat(file)) {
        throw new Error(`Format non supporté: ${file.type}`);
      }

      // Convertir HEIC/HEIF en JPEG
      if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        console.log('🔄 [ImageOptimizer] Conversion HEIC vers JPEG...');
        processedFile = await convertHeicToJpeg(file);
        wasConverted = true;
      }

      // Étape 2: Compression si nécessaire
      if (processedFile.size > this.options.maxSizeMB * 1024 * 1024) {
        console.log('🗜️ [ImageOptimizer] Compression de l\'image...');
        
        const compressionOptions = {
          maxSizeMB: this.options.maxSizeMB,
          maxWidthOrHeight: this.options.maxWidthOrHeight,
          useWebWorker: this.options.useWebWorker,
          quality: this.options.quality,
          fileType: this.options.convertToJpeg ? 'image/jpeg' : processedFile.type
        };

        processedFile = await imageCompression(processedFile, compressionOptions);
        wasCompressed = true;
      }

      const optimizedSize = processedFile.size;
      const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

      console.log(`✅ [ImageOptimizer] Optimisation terminée:`, {
        original: this.formatSize(originalSize),
        optimized: this.formatSize(optimizedSize),
        ratio: `${compressionRatio.toFixed(1)}%`,
        converted: wasConverted,
        compressed: wasCompressed
      });

      return {
        file: processedFile,
        originalSize,
        optimizedSize,
        compressionRatio,
        wasConverted,
        wasCompressed,
        originalFormat
      };

    } catch (error) {
      console.error('❌ [ImageOptimizer] Erreur optimisation:', error);
      throw error;
    }
  }

  // Optimiser plusieurs images en parallèle
  async optimizeImages(files: File[]): Promise<OptimizedImage[]> {
    console.log(`🔧 [ImageOptimizer] Optimisation de ${files.length} images`);
    
    const results = await Promise.all(
      files.map(file => this.optimizeImage(file))
    );

    const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalOptimized = results.reduce((sum, r) => sum + r.optimizedSize, 0);
    const totalRatio = ((totalOriginal - totalOptimized) / totalOriginal) * 100;

    console.log(`✅ [ImageOptimizer] Optimisation globale terminée:`, {
      files: results.length,
      totalOriginal: this.formatSize(totalOriginal),
      totalOptimized: this.formatSize(totalOptimized),
      totalRatio: `${totalRatio.toFixed(1)}%`
    });

    return results;
  }

  // Formater la taille des fichiers
  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  // Vérifier si une image nécessite une optimisation
  needsOptimization(file: File): boolean {
    const isLarge = file.size > this.options.maxSizeMB * 1024 * 1024;
    const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
    return isLarge || isHeic;
  }
}
