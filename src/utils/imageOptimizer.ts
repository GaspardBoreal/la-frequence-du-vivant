import imageCompression from 'browser-image-compression';
import { convertHeicToJpeg, isHeic, HeicConversionError } from './heicConverter';
import { isSupportedPhotoFormat } from './photoUtils';

export type OptimizationStage =
  | 'detecting'
  | 'converting-heic'
  | 'compressing'
  | 'done';

export interface OptimizationOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
  convertToJpeg?: boolean;
  /** Per-file progress callback (UI feedback for slow HEIC conversions). */
  onProgress?: (file: File, stage: OptimizationStage) => void;
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
  private options: Required<Omit<OptimizationOptions, 'onProgress'>> & {
    onProgress?: OptimizationOptions['onProgress'];
  };

  constructor(options: OptimizationOptions = {}) {
    this.options = {
      maxSizeMB: options.maxSizeMB || 2,
      maxWidthOrHeight: options.maxWidthOrHeight || 1920,
      useWebWorker: options.useWebWorker ?? true,
      quality: options.quality || 0.8,
      convertToJpeg: options.convertToJpeg ?? true,
      onProgress: options.onProgress,
    };
  }

  // Optimiser une image — politique "fail-fast" sur HEIC non convertible
  async optimizeImage(file: File): Promise<OptimizedImage> {
    console.log(`🔧 [ImageOptimizer] Optimisation de ${file.name} (${this.formatSize(file.size)})`);

    const originalSize = file.size;
    const originalFormat = file.type;
    let processedFile = file;
    let wasConverted = false;
    let wasCompressed = false;

    // Étape 1 : détection
    this.options.onProgress?.(file, 'detecting');
    if (!isSupportedPhotoFormat(file)) {
      console.warn(`⚠️ [ImageOptimizer] Format non standard: ${file.type || 'inconnu'} (${file.name})`);
    }

    // Étape 2 : conversion HEIC si nécessaire (peut LEVER une erreur — fail-fast)
    if (await isHeic(file)) {
      this.options.onProgress?.(file, 'converting-heic');
      try {
        const converted = await convertHeicToJpeg(file);
        wasConverted = converted !== file;
        processedFile = converted;
      } catch (err) {
        // Propage l'erreur au hook d'upload — on n'envoie JAMAIS un .heic non converti
        if (err instanceof HeicConversionError) throw err;
        throw err;
      }
    }

    // Étape 3 : compression si trop volumineux
    if (processedFile.size > this.options.maxSizeMB * 1024 * 1024) {
      this.options.onProgress?.(processedFile, 'compressing');
      console.log('🗜️ [ImageOptimizer] Compression…');

      const compressionOptions = {
        maxSizeMB: this.options.maxSizeMB,
        maxWidthOrHeight: this.options.maxWidthOrHeight,
        useWebWorker: this.options.useWebWorker,
        quality: this.options.quality,
        fileType: this.options.convertToJpeg ? 'image/jpeg' : processedFile.type,
      };
      processedFile = await imageCompression(processedFile, compressionOptions);
      wasCompressed = true;
    }

    this.options.onProgress?.(processedFile, 'done');

    const optimizedSize = processedFile.size;
    const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

    console.log(`✅ [ImageOptimizer] Optimisation terminée:`, {
      original: this.formatSize(originalSize),
      optimized: this.formatSize(optimizedSize),
      ratio: `${compressionRatio.toFixed(1)}%`,
      converted: wasConverted,
      compressed: wasCompressed,
    });

    return {
      file: processedFile,
      originalSize,
      optimizedSize,
      compressionRatio,
      wasConverted,
      wasCompressed,
      originalFormat,
    };
  }

  // Optimiser plusieurs images en parallèle
  async optimizeImages(files: File[]): Promise<OptimizedImage[]> {
    console.log(`🔧 [ImageOptimizer] Optimisation de ${files.length} images`);

    const results = await Promise.all(files.map((f) => this.optimizeImage(f)));

    const totalOriginal = results.reduce((s, r) => s + r.originalSize, 0);
    const totalOptimized = results.reduce((s, r) => s + r.optimizedSize, 0);
    const totalRatio = totalOriginal > 0
      ? ((totalOriginal - totalOptimized) / totalOriginal) * 100
      : 0;

    console.log(`✅ [ImageOptimizer] Optimisation globale terminée:`, {
      files: results.length,
      totalOriginal: this.formatSize(totalOriginal),
      totalOptimized: this.formatSize(totalOptimized),
      totalRatio: `${totalRatio.toFixed(1)}%`,
    });

    return results;
  }

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

  needsOptimization(file: File): boolean {
    const isLarge = file.size > this.options.maxSizeMB * 1024 * 1024;
    const isHeicByName =
      file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
    return isLarge || isHeicByName;
  }
}
