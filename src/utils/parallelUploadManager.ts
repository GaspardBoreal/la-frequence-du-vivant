
import { PhotoToUpload, UploadProgress } from './supabasePhotoOperations';
import { savePhoto } from './supabasePhotoOperations';

export interface ParallelUploadOptions {
  maxConcurrent?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface UploadTask {
  id: string;
  photo: PhotoToUpload;
  marcheId: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  retryCount: number;
}

export class ParallelUploadManager {
  private tasks: Map<string, UploadTask> = new Map();
  private activeUploads: Set<string> = new Set();
  private options: Required<ParallelUploadOptions>;
  private progressCallback?: (tasks: UploadTask[]) => void;

  constructor(options: ParallelUploadOptions = {}) {
    this.options = {
      maxConcurrent: options.maxConcurrent || 3,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000
    };
  }

  // Ajouter des photos à la queue d'upload
  addPhotos(marcheId: string, photos: PhotoToUpload[]): void {
    console.log(`📋 [ParallelUploadManager] Ajout de ${photos.length} photos à la queue`);
    
    photos.forEach(photo => {
      const task: UploadTask = {
        id: photo.id,
        photo,
        marcheId,
        status: 'pending',
        progress: 0,
        retryCount: 0
      };
      
      this.tasks.set(photo.id, task);
    });

    this.notifyProgress();
  }

  // Définir le callback de progression
  onProgress(callback: (tasks: UploadTask[]) => void): void {
    this.progressCallback = callback;
  }

  // Démarrer l'upload parallèle - VERSION CORRIGÉE
  async startUpload(): Promise<string[]> {
    console.log(`🚀 [ParallelUploadManager] Démarrage upload parallèle (max: ${this.options.maxConcurrent})`);
    
    const pendingTasks = Array.from(this.tasks.values()).filter(t => t.status === 'pending');
    
    if (pendingTasks.length === 0) {
      console.log('✅ [ParallelUploadManager] Aucune tâche en attente');
      return [];
    }

    // Créer les promesses d'upload
    const uploadPromises: Promise<string | null>[] = [];
    
    // Traiter les tâches par lot
    for (const task of pendingTasks) {
      if (this.activeUploads.size < this.options.maxConcurrent) {
        uploadPromises.push(this.processTask(task));
      } else {
        // Attendre qu'une tâche se termine avant d'en démarrer une nouvelle
        await Promise.race(uploadPromises.filter(p => p));
        uploadPromises.push(this.processTask(task));
      }
    }

    // Attendre que tous les uploads se terminent
    try {
      const results = await Promise.allSettled(uploadPromises);
      
      // Extraire les résultats réussis
      const successfulIds: string[] = [];
      let failedCount = 0;
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          successfulIds.push(result.value);
        } else {
          failedCount++;
          console.error(`❌ [ParallelUploadManager] Échec upload tâche ${index}:`, result.status === 'rejected' ? result.reason : 'Résultat null');
        }
      });
      
      console.log(`✅ [ParallelUploadManager] Upload terminé: ${successfulIds.length} réussis, ${failedCount} échecs`);
      return successfulIds;
    } catch (error) {
      console.error('💥 [ParallelUploadManager] Erreur critique lors de l\'upload:', error);
      throw error;
    }
  }

  // Traiter une tâche d'upload - VERSION AMÉLIORÉE
  private async processTask(task: UploadTask): Promise<string | null> {
    console.log(`🔄 [ParallelUploadManager] Début traitement: ${task.photo.file.name}`);
    
    try {
      this.activeUploads.add(task.id);
      task.status = 'uploading';
      task.progress = 0;
      this.notifyProgress();

      console.log(`📤 [ParallelUploadManager] Upload de ${task.photo.file.name}`);
      
      // Appel à savePhoto avec gestion d'erreur robuste
      const photoId = await savePhoto(task.marcheId, task.photo, (progress) => {
        try {
          task.progress = Math.min(progress.progress, 100);
          
          if (progress.status === 'success') {
            task.status = 'success';
            task.progress = 100;
          } else if (progress.status === 'error') {
            task.status = 'error';
            task.error = progress.error || 'Erreur inconnue';
          }
          
          this.notifyProgress();
        } catch (progressError) {
          console.error(`❌ [ParallelUploadManager] Erreur callback progression:`, progressError);
        }
      });

      // Succès final
      task.status = 'success';
      task.progress = 100;
      task.error = undefined;
      this.notifyProgress();
      
      console.log(`✅ [ParallelUploadManager] Upload réussi: ${task.photo.file.name} -> ${photoId}`);
      return photoId;
      
    } catch (error) {
      console.error(`❌ [ParallelUploadManager] Erreur upload ${task.photo.file.name}:`, error);
      
      // Gestion des erreurs et retry
      task.error = error instanceof Error ? error.message : 'Erreur inconnue';
      task.retryCount++;
      
      // Tentative de retry si possible
      if (task.retryCount < this.options.retryAttempts) {
        console.log(`🔄 [ParallelUploadManager] Retry ${task.retryCount}/${this.options.retryAttempts} pour ${task.photo.file.name}`);
        
        // Réinitialiser l'état pour le retry
        task.status = 'pending';
        task.progress = 0;
        this.notifyProgress();
        
        // Attendre avant le retry
        await this.delay(this.options.retryDelay * task.retryCount);
        
        // Relancer la tâche récursivement
        return this.processTask(task);
      } else {
        // Échec définitif
        task.status = 'error';
        task.progress = 0;
        this.notifyProgress();
        
        console.error(`💥 [ParallelUploadManager] Échec définitif pour ${task.photo.file.name} après ${task.retryCount} tentatives`);
        return null;
      }
    } finally {
      this.activeUploads.delete(task.id);
    }
  }

  // Fonction utilitaire pour les délais
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Notifier la progression - VERSION SÉCURISÉE
  private notifyProgress(): void {
    try {
      if (this.progressCallback) {
        const tasks = Array.from(this.tasks.values());
        this.progressCallback(tasks);
      }
    } catch (error) {
      console.error('❌ [ParallelUploadManager] Erreur lors de la notification de progression:', error);
    }
  }

  // Obtenir le statut global
  getStatus(): { total: number; pending: number; uploading: number; success: number; error: number } {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      uploading: tasks.filter(t => t.status === 'uploading').length,
      success: tasks.filter(t => t.status === 'success').length,
      error: tasks.filter(t => t.status === 'error').length
    };
  }

  // Nettoyer les tâches
  clear(): void {
    this.tasks.clear();
    this.activeUploads.clear();
  }
}
